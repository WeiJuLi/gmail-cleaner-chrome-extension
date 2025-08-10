// Token Manager - 管理 OAuth access token 的完整生命週期
// 整合 Chrome Storage API 和現有的 OAuth 系統

import { GmailApiResult } from '../types/gmail';

// Token 相關介面定義
export interface AccessToken {
  token: string;
  expiresAt: number;        // Unix timestamp
  refreshToken?: string;
  scope: string[];
  tokenType: 'Bearer';
}

export interface TokenValidationResult {
  isValid: boolean;
  expiresIn?: number;       // 剩餘有效時間（秒）
  needsRefresh: boolean;
}

// Chrome Storage Key 常數
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'gmail_access_token',
  REFRESH_TOKEN: 'gmail_refresh_token',
  TOKEN_EXPIRES_AT: 'gmail_token_expires_at',
  TOKEN_SCOPE: 'gmail_token_scope'
} as const;

// Token 過期緩衝時間（5分鐘）
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000;

class TokenManager {
  private cachedToken: AccessToken | null = null;
  private tokenValidationCache: Map<string, { result: TokenValidationResult; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 1000; // 30秒快取

  /**
   * 取得當前有效的 access token
   */
  async getValidToken(): Promise<GmailApiResult<AccessToken>> {
    try {
      // 1. 檢查快取中的 token
      if (this.cachedToken) {
        const validation = await this.validateToken(this.cachedToken);
        if (validation.isValid && !validation.needsRefresh) {
          return { success: true, data: this.cachedToken };
        }
      }

      // 2. 從 Chrome Storage 載入 token
      const storageResult = await this.loadTokenFromStorage();
      if (!storageResult.success) {
        return storageResult;
      }

      const token = storageResult.data!;
      
      // 3. 驗證 storage 中的 token
      const validation = await this.validateToken(token);
      
      if (validation.isValid && !validation.needsRefresh) {
        this.cachedToken = token;
        return { success: true, data: token };
      }

      // 4. Token 需要刷新或無效
      if (validation.needsRefresh && token.refreshToken) {
        const refreshResult = await this.refreshToken(token.refreshToken);
        if (refreshResult.success) {
          return refreshResult;
        }
      }

      // 5. 無法取得有效 token，需要重新授權
      return {
        success: false,
        error: {
          code: 401,
          message: 'Access token is invalid and cannot be refreshed. Re-authorization required.',
          status: 'UNAUTHENTICATED'
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: {
          code: 500,
          message: `Token retrieval failed: ${errorMessage}`,
          status: 'INTERNAL_ERROR'
        }
      };
    }
  }

  /**
   * 從 Chrome Storage 載入 token
   */
  private async loadTokenFromStorage(): Promise<GmailApiResult<AccessToken>> {
    return new Promise((resolve) => {
      chrome.storage.local.get([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.TOKEN_EXPIRES_AT,
        STORAGE_KEYS.TOKEN_SCOPE
      ], (result) => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: {
              code: 500,
              message: `Failed to load token from storage: ${chrome.runtime.lastError.message}`,
              status: 'STORAGE_ERROR'
            }
          });
          return;
        }

        const {
          [STORAGE_KEYS.ACCESS_TOKEN]: token,
          [STORAGE_KEYS.REFRESH_TOKEN]: refreshToken,
          [STORAGE_KEYS.TOKEN_EXPIRES_AT]: expiresAt,
          [STORAGE_KEYS.TOKEN_SCOPE]: scope
        } = result;

        if (!token || !expiresAt) {
          resolve({
            success: false,
            error: {
              code: 404,
              message: 'No valid token found in storage',
              status: 'NOT_FOUND'
            }
          });
          return;
        }

        const accessToken: AccessToken = {
          token,
          expiresAt: parseInt(expiresAt),
          refreshToken,
          scope: scope ? JSON.parse(scope) : ['https://www.googleapis.com/auth/gmail.modify'],
          tokenType: 'Bearer'
        };

        resolve({ success: true, data: accessToken });
      });
    });
  }

  /**
   * 儲存 token 到 Chrome Storage
   */
  async saveToken(token: AccessToken): Promise<GmailApiResult<void>> {
    return new Promise((resolve) => {
      const storageData = {
        [STORAGE_KEYS.ACCESS_TOKEN]: token.token,
        [STORAGE_KEYS.REFRESH_TOKEN]: token.refreshToken,
        [STORAGE_KEYS.TOKEN_EXPIRES_AT]: token.expiresAt.toString(),
        [STORAGE_KEYS.TOKEN_SCOPE]: JSON.stringify(token.scope)
      };

      chrome.storage.local.set(storageData, () => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: {
              code: 500,
              message: `Failed to save token: ${chrome.runtime.lastError.message}`,
              status: 'STORAGE_ERROR'
            }
          });
          return;
        }

        // 更新快取
        this.cachedToken = token;
        resolve({ success: true });
      });
    });
  }

  /**
   * 驗證 token 有效性
   */
  async validateToken(token: AccessToken): Promise<TokenValidationResult> {
    const now = Date.now();
    
    // 檢查快取
    const cacheKey = `${token.token.substring(0, 20)}:${token.expiresAt}`;
    const cached = this.tokenValidationCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.result;
    }

    // 檢查過期時間
    const timeUntilExpiry = token.expiresAt - now;
    const isExpired = timeUntilExpiry <= 0;
    const needsRefresh = timeUntilExpiry <= TOKEN_EXPIRY_BUFFER;

    let result: TokenValidationResult;

    if (isExpired) {
      result = {
        isValid: false,
        expiresIn: 0,
        needsRefresh: true
      };
    } else if (needsRefresh) {
      result = {
        isValid: true,
        expiresIn: Math.floor(timeUntilExpiry / 1000),
        needsRefresh: true
      };
    } else {
      result = {
        isValid: true,
        expiresIn: Math.floor(timeUntilExpiry / 1000),
        needsRefresh: false
      };
    }

    // 更新快取
    this.tokenValidationCache.set(cacheKey, {
      result,
      timestamp: now
    });

    return result;
  }

  /**
   * 使用 refresh token 更新 access token
   */
  private async refreshToken(refreshToken: string): Promise<GmailApiResult<AccessToken>> {
    try {
      // 呼叫後端的 refresh endpoint
      const response = await fetch('http://localhost:8080/oauth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error('No access token in refresh response');
      }

      const newToken: AccessToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
        refreshToken: data.refresh_token || refreshToken, // 保留原有的 refresh token
        scope: data.scope ? data.scope.split(' ') : ['https://www.googleapis.com/auth/gmail.modify'],
        tokenType: 'Bearer'
      };

      // 儲存新的 token
      const saveResult = await this.saveToken(newToken);
      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error!
        };
      }

      return { success: true, data: newToken };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: {
          code: 401,
          message: `Token refresh failed: ${errorMessage}`,
          status: 'TOKEN_REFRESH_FAILED'
        }
      };
    }
  }

  /**
   * 清除所有 token 資料
   */
  async clearTokens(): Promise<GmailApiResult<void>> {
    return new Promise((resolve) => {
      chrome.storage.local.remove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.TOKEN_EXPIRES_AT,
        STORAGE_KEYS.TOKEN_SCOPE
      ], () => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: {
              code: 500,
              message: `Failed to clear tokens: ${chrome.runtime.lastError.message}`,
              status: 'STORAGE_ERROR'
            }
          });
          return;
        }

        // 清除快取
        this.cachedToken = null;
        this.tokenValidationCache.clear();
        
        resolve({ success: true });
      });
    });
  }

  /**
   * 檢查是否已登入（有有效的 token）
   */
  async isAuthenticated(): Promise<boolean> {
    const result = await this.getValidToken();
    return result.success;
  }

  /**
   * 取得 token 的剩餘有效時間
   */
  async getTokenExpiryInfo(): Promise<{ expiresIn: number; expiresAt: Date } | null> {
    const tokenResult = await this.getValidToken();
    if (!tokenResult.success) {
      return null;
    }

    const token = tokenResult.data!;
    const validation = await this.validateToken(token);
    
    return {
      expiresIn: validation.expiresIn || 0,
      expiresAt: new Date(token.expiresAt)
    };
  }
}

// 匯出單例實例
export const tokenManager = new TokenManager(); 