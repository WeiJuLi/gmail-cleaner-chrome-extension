// API Error Handler - 統一處理 Gmail API 錯誤和重試邏輯
// 包含錯誤分類、指數退避重試機制、配額限制處理

import { GmailApiResult, GmailApiError } from '../types/gmail';

// 重試配置
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;        // 基礎延遲時間（毫秒）
  maxDelay: number;         // 最大延遲時間（毫秒）
  exponentialBase: number;  // 指數底數
  jitter: boolean;          // 是否加入隨機性
}

// 預設重試配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelay: 1000,      // 1秒
  maxDelay: 32000,      // 32秒
  exponentialBase: 2,
  jitter: true
};

// 錯誤類型分類
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',      // 認證錯誤
  AUTHORIZATION = 'AUTHORIZATION',        // 權限錯誤
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',      // 配額超出
  RATE_LIMITED = 'RATE_LIMITED',          // 請求頻率限制
  NETWORK_ERROR = 'NETWORK_ERROR',        // 網路錯誤
  SERVER_ERROR = 'SERVER_ERROR',          // 伺服器錯誤
  CLIENT_ERROR = 'CLIENT_ERROR',          // 客戶端錯誤
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'         // 未知錯誤
}

// 錯誤分析結果
export interface ErrorAnalysis {
  type: ErrorType;
  isRetryable: boolean;
  shouldRefreshToken: boolean;
  suggestedDelay: number;
  message: string;
}

// 重試狀態
interface RetryState {
  attempt: number;
  lastError: GmailApiError;
  startTime: number;
}

class ApiErrorHandler {
  private quotaResetTime: number | null = null;
  private requestCount: number = 0;
  private readonly REQUEST_WINDOW = 60 * 1000; // 1分鐘窗口
  private lastRequestReset = Date.now();

  /**
   * 分析錯誤類型和處理策略
   */
  analyzeError(error: any): ErrorAnalysis {
    // 如果是 Response 物件
    if (error instanceof Response) {
      return this.analyzeHttpError(error.status, error.statusText);
    }

    // 如果是 GmailApiError
    if (error && typeof error === 'object' && 'code' in error) {
      return this.analyzeGmailApiError(error as GmailApiError);
    }

    // 如果是 Error 物件
    if (error instanceof Error) {
      return this.analyzeJavaScriptError(error);
    }

    // 未知錯誤
    return {
      type: ErrorType.UNKNOWN_ERROR,
      isRetryable: false,
      shouldRefreshToken: false,
      suggestedDelay: 0,
      message: 'An unknown error occurred'
    };
  }

  /**
   * 分析 HTTP 錯誤
   */
  private analyzeHttpError(status: number, statusText: string): ErrorAnalysis {
    switch (status) {
      case 401:
        return {
          type: ErrorType.AUTHENTICATION,
          isRetryable: true,
          shouldRefreshToken: true,
          suggestedDelay: 1000,
          message: 'Authentication failed - token may be expired'
        };

      case 403:
        // 檢查是否為配額錯誤
        if (statusText.includes('quota') || statusText.includes('limit')) {
          return {
            type: ErrorType.QUOTA_EXCEEDED,
            isRetryable: true,
            shouldRefreshToken: false,
            suggestedDelay: this.calculateQuotaDelay(),
            message: 'API quota exceeded'
          };
        }
        return {
          type: ErrorType.AUTHORIZATION,
          isRetryable: false,
          shouldRefreshToken: false,
          suggestedDelay: 0,
          message: 'Insufficient permissions'
        };

      case 429:
        return {
          type: ErrorType.RATE_LIMITED,
          isRetryable: true,
          shouldRefreshToken: false,
          suggestedDelay: this.calculateRateLimitDelay(),
          message: 'Rate limit exceeded'
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ErrorType.SERVER_ERROR,
          isRetryable: true,
          shouldRefreshToken: false,
          suggestedDelay: 2000,
          message: 'Server error - temporary issue'
        };

      default:
        if (status >= 400 && status < 500) {
          return {
            type: ErrorType.CLIENT_ERROR,
            isRetryable: false,
            shouldRefreshToken: false,
            suggestedDelay: 0,
            message: `Client error: ${status} ${statusText}`
          };
        }
        return {
          type: ErrorType.UNKNOWN_ERROR,
          isRetryable: false,
          shouldRefreshToken: false,
          suggestedDelay: 0,
          message: `HTTP error: ${status} ${statusText}`
        };
    }
  }

  /**
   * 分析 Gmail API 錯誤
   */
  private analyzeGmailApiError(error: GmailApiError): ErrorAnalysis {
    const { code, message, status } = error;

    switch (code) {
      case 401:
        return {
          type: ErrorType.AUTHENTICATION,
          isRetryable: true,
          shouldRefreshToken: true,
          suggestedDelay: 1000,
          message: message || 'Authentication required'
        };

      case 403:
        if (message.includes('quota') || message.includes('limit')) {
          return {
            type: ErrorType.QUOTA_EXCEEDED,
            isRetryable: true,
            shouldRefreshToken: false,
            suggestedDelay: this.calculateQuotaDelay(),
            message: 'API quota exceeded'
          };
        }
        return {
          type: ErrorType.AUTHORIZATION,
          isRetryable: false,
          shouldRefreshToken: false,
          suggestedDelay: 0,
          message: message || 'Insufficient permissions'
        };

      case 429:
        return {
          type: ErrorType.RATE_LIMITED,
          isRetryable: true,
          shouldRefreshToken: false,
          suggestedDelay: this.calculateRateLimitDelay(),
          message: 'Too many requests'
        };

      default:
        return this.analyzeHttpError(code, status);
    }
  }

  /**
   * 分析 JavaScript 錯誤
   */
  private analyzeJavaScriptError(error: Error): ErrorAnalysis {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        isRetryable: true,
        shouldRefreshToken: false,
        suggestedDelay: 2000,
        message: 'Network connection error'
      };
    }

    return {
      type: ErrorType.UNKNOWN_ERROR,
      isRetryable: false,
      shouldRefreshToken: false,
      suggestedDelay: 0,
      message: error.message
    };
  }

  /**
   * 執行帶重試機制的 API 呼叫
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<GmailApiResult<T>> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    const retryState: RetryState = {
      attempt: 0,
      lastError: { code: 0, message: '', status: '' },
      startTime: Date.now()
    };

    while (retryState.attempt <= retryConfig.maxRetries) {
      try {
        // 執行操作
        const result = await operation();
        return { success: true, data: result };

      } catch (error) {
        retryState.attempt++;
        retryState.lastError = this.convertToGmailApiError(error);

        // 分析錯誤
        const analysis = this.analyzeError(error);

        // 如果是最後一次嘗試或錯誤不可重試
        if (retryState.attempt > retryConfig.maxRetries || !analysis.isRetryable) {
          return {
            success: false,
            error: retryState.lastError
          };
        }

        // 計算延遲時間
        const delay = this.calculateRetryDelay(
          retryState.attempt,
          retryConfig,
          analysis.suggestedDelay
        );

        // 記錄重試資訊
        console.warn(`API call failed (attempt ${retryState.attempt}/${retryConfig.maxRetries}), retrying in ${delay}ms:`, analysis.message);

        // 等待後重試
        await this.sleep(delay);
      }
    }

    // 不應該到達這裡
    return {
      success: false,
      error: retryState.lastError
    };
  }

  /**
   * 計算重試延遲時間
   */
  private calculateRetryDelay(
    attempt: number,
    config: RetryConfig,
    suggestedDelay: number
  ): number {
    // 如果有建議延遲時間，優先使用
    if (suggestedDelay > 0) {
      return Math.min(suggestedDelay, config.maxDelay);
    }

    // 指數退避計算
    let delay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);

    // 加入隨機性以避免雷群效應
    if (config.jitter) {
      delay *= (0.5 + Math.random() * 0.5);
    }

    return Math.min(delay, config.maxDelay);
  }

  /**
   * 計算配額重置延遲
   */
  private calculateQuotaDelay(): number {
    if (this.quotaResetTime) {
      const delay = this.quotaResetTime - Date.now();
      return Math.max(delay, 60000); // 至少等待1分鐘
    }
    return 60000; // 預設1分鐘
  }

  /**
   * 計算速率限制延遲
   */
  private calculateRateLimitDelay(): number {
    // 基於目前的請求頻率計算延遲
    const now = Date.now();
    
    // 重置請求計數器
    if (now - this.lastRequestReset > this.REQUEST_WINDOW) {
      this.requestCount = 0;
      this.lastRequestReset = now;
    }

    this.requestCount++;

    // 如果請求過於頻繁，增加延遲
    if (this.requestCount > 100) { // 每分鐘超過100個請求
      return 30000; // 30秒延遲
    } else if (this.requestCount > 50) {
      return 10000; // 10秒延遲
    }

    return 5000; // 預設5秒延遲
  }

  /**
   * 轉換錯誤為 GmailApiError 格式
   */
  private convertToGmailApiError(error: any): GmailApiError {
    if (error && typeof error === 'object' && 'code' in error) {
      return error as GmailApiError;
    }

    if (error instanceof Response) {
      return {
        code: error.status,
        message: error.statusText,
        status: error.statusText.toUpperCase().replace(/\s+/g, '_')
      };
    }

    if (error instanceof Error) {
      return {
        code: 500,
        message: error.message,
        status: 'INTERNAL_ERROR'
      };
    }

    return {
      code: 500,
      message: 'Unknown error occurred',
      status: 'UNKNOWN_ERROR'
    };
  }

  /**
   * 設定配額重置時間
   */
  setQuotaResetTime(resetTime: number): void {
    this.quotaResetTime = resetTime;
  }

  /**
   * 取得目前的請求統計
   */
  getRequestStats(): { count: number; windowStart: number } {
    return {
      count: this.requestCount,
      windowStart: this.lastRequestReset
    };
  }

  /**
   * 睡眠函數
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 匯出單例實例
export const apiErrorHandler = new ApiErrorHandler(); 