// 中文說明：OAuth 認證核心工具
// 這個檔案負責處理完整的 Google OAuth 流程
// 包括：觸發 OAuth、解析 token、取得使用者資訊、錯誤處理

import { 
  StoredAuthData, 
  UserInfo, 
  AuthError, 
  GoogleUserProfile,
  OAuthConfig 
} from '../types/auth';
import { saveAuthData, loadAuthData, removeAuthData } from './storage';

// 中文說明：OAuth 設定參數（從 manifest.json 讀取）
const OAUTH_CONFIG: OAuthConfig = {
  clientId: '1047463995054-es5oci40c4r21kvb2odv54304ilt7m9k.apps.googleusercontent.com',
  scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
  redirectUri: 'https://opiihfibhckgipamgifpchclhjoicool.chromiumapp.org/'
};

/**
 * 中文說明：啟動 Google OAuth 流程
 * 這是整個認證流程的入口點，會開啟 Google 授權頁面
 * @returns Promise<StoredAuthData> - 成功時回傳認證資料
 * @throws AuthError - 失敗時拋出對應的錯誤
 */
export const startOAuthFlow = async (): Promise<StoredAuthData> => {
  try {
    console.log('開始 Google OAuth 流程...');
    
    // 中文說明：建構 Google OAuth 授權 URL
    const authUrl = buildAuthUrl();
    console.log('OAuth 授權 URL:', authUrl);

    // 中文說明：使用 Chrome Identity API 開啟授權頁面
    const responseUrl = await launchOAuthWindow(authUrl);
    console.log('OAuth 回應 URL:', responseUrl);

    // 中文說明：從回應 URL 中解析 access token
    const accessToken = parseAccessTokenFromUrl(responseUrl);
    console.log('成功取得 access token');

    // 中文說明：使用 access token 取得使用者資訊
    const userInfo = await fetchUserInfo(accessToken);
    console.log('成功取得使用者資訊:', { email: userInfo.email, name: userInfo.name });

    // 中文說明：計算 token 過期時間（通常是 1 小時）
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 小時後過期

    // 中文說明：組織要儲存的認證資料
    const authData: StoredAuthData = {
      access_token: accessToken,
      expires_at: expiresAt,
      user_email: userInfo.email,
      user_name: userInfo.name,
      avatar_url: userInfo.picture
    };

    // 中文說明：將認證資料儲存到 Chrome Storage
    const saveSuccess = await saveAuthData(authData);
    if (!saveSuccess) {
      throw new Error('儲存認證資料失敗');
    }

    console.log('OAuth 流程完成，使用者已成功登入');
    return authData;

  } catch (error) {
    console.error('OAuth 流程失敗:', error);
    
    // 中文說明：根據錯誤類型回傳對應的 AuthError
    if (error instanceof Error) {
      if (error.message.includes('cancelled')) {
        throw createAuthError('oauth_cancelled', '使用者取消了登入流程');
      } else if (error.message.includes('access_denied')) {
        throw createAuthError('permission_denied', '使用者拒絕了權限授權');
      } else if (error.message.includes('network')) {
        throw createAuthError('network_error', '網路連線錯誤，請檢查網路設定');
      }
    }
    
    throw createAuthError('api_error', `OAuth 流程發生錯誤: ${error}`);
  }
};

/**
 * 中文說明：建構 Google OAuth 授權 URL
 * @returns string - 完整的授權 URL
 */
const buildAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    scope: OAUTH_CONFIG.scope,
    response_type: 'token',  // 中文說明：使用 implicit flow，直接取得 access token
    include_granted_scopes: 'true',
    state: Math.random().toString(36)  // 中文說明：防止 CSRF 攻擊的隨機字串
  });

  return `https://accounts.google.com/oauth/authorize?${params.toString()}`;
};

/**
 * 中文說明：使用 Chrome Identity API 開啟 OAuth 授權視窗
 * @param authUrl - Google OAuth 授權 URL
 * @returns Promise<string> - 授權完成後的回應 URL
 */
const launchOAuthWindow = async (authUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 中文說明：開啟互動式 OAuth 視窗
    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true  // 中文說明：設為 true 讓使用者可以看到並操作授權頁面
    }, (responseUrl) => {
      // 中文說明：檢查是否有錯誤發生
      if (chrome.runtime.lastError) {
        console.error('OAuth 視窗錯誤:', chrome.runtime.lastError);
        reject(new Error(chrome.runtime.lastError.message || 'OAuth 視窗開啟失敗'));
        return;
      }

      // 中文說明：檢查是否取得回應 URL
      if (!responseUrl) {
        reject(new Error('未取得 OAuth 回應 URL，可能是使用者取消了授權'));
        return;
      }

      resolve(responseUrl);
    });
  });
};

/**
 * 中文說明：從 OAuth 回應 URL 中解析 access token
 * @param responseUrl - OAuth 回應 URL（包含 access token）
 * @returns string - 解析出的 access token
 */
const parseAccessTokenFromUrl = (responseUrl: string): string => {
  try {
    // 中文說明：解析 URL fragment 部分（# 後面的內容）
    const url = new URL(responseUrl);
    const fragment = url.hash.substring(1); // 移除開頭的 #
    const params = new URLSearchParams(fragment);
    
    const accessToken = params.get('access_token');
    
    if (!accessToken) {
      throw new Error('OAuth 回應中未找到 access_token');
    }

    // 中文說明：檢查是否有錯誤回應
    const error = params.get('error');
    if (error) {
      const errorDescription = params.get('error_description') || error;
      throw new Error(`OAuth 錯誤: ${errorDescription}`);
    }

    console.log('成功解析 access token 從 URL');
    return accessToken;
    
  } catch (error) {
    console.error('解析 access token 失敗:', error);
    throw new Error(`無法解析 access token: ${error}`);
  }
};

/**
 * 中文說明：使用 access token 從 Google API 取得使用者資訊
 * @param accessToken - Google OAuth access token
 * @returns Promise<UserInfo> - 使用者基本資訊
 */
const fetchUserInfo = async (accessToken: string): Promise<UserInfo> => {
  try {
    console.log('正在取得使用者資訊...');
    
    // 中文說明：呼叫 Google UserInfo API
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google API 回應錯誤: ${response.status} ${response.statusText}`);
    }

    const userProfile: GoogleUserProfile = await response.json();
    console.log('成功取得使用者資訊:', userProfile);

    // 中文說明：轉換成我們的 UserInfo 格式
    const userInfo: UserInfo = {
      email: userProfile.email,
      name: userProfile.name || userProfile.given_name || 'Unknown User',
      picture: userProfile.picture,
      verified_email: userProfile.verified_email
    };

    return userInfo;
    
  } catch (error) {
    console.error('取得使用者資訊失敗:', error);
    throw new Error(`無法取得使用者資訊: ${error}`);
  }
};

/**
 * 中文說明：檢查當前的認證狀態
 * @returns Promise<UserInfo | null> - 如果已登入則回傳使用者資訊，否則回傳 null
 */
export const checkAuthStatus = async (): Promise<UserInfo | null> => {
  try {
    console.log('檢查認證狀態...');
    
    // 中文說明：從 Chrome Storage 讀取認證資料
    const authData = await loadAuthData();
    
    if (!authData) {
      console.log('未找到認證資料，使用者未登入');
      return null;
    }

    // 中文說明：檢查 token 是否仍然有效
    const now = Date.now();
    if (authData.expires_at <= now) {
      console.log('Token 已過期，清除認證資料');
      await removeAuthData();
      return null;
    }

    // 中文說明：組織使用者資訊
    const userInfo: UserInfo = {
      email: authData.user_email,
      name: authData.user_name || 'Unknown User',
      picture: authData.avatar_url
    };

    console.log('使用者已登入:', { email: userInfo.email });
    return userInfo;
    
  } catch (error) {
    console.error('檢查認證狀態時發生錯誤:', error);
    return null;
  }
};

/**
 * 中文說明：登出使用者（清除所有認證資料）
 * @returns Promise<boolean> - 登出是否成功
 */
export const logout = async (): Promise<boolean> => {
  try {
    console.log('正在登出使用者...');
    
    // 中文說明：從 Chrome Storage 移除認證資料
    const success = await removeAuthData();
    
    if (success) {
      console.log('使用者已成功登出');
    } else {
      console.error('登出過程中發生錯誤');
    }
    
    return success;
    
  } catch (error) {
    console.error('登出失敗:', error);
    return false;
  }
};

/**
 * 中文說明：建立標準化的認證錯誤物件
 * @param type - 錯誤類型
 * @param message - 錯誤訊息
 * @param details - 詳細錯誤資訊（可選）
 * @returns AuthError - 標準化的錯誤物件
 */
const createAuthError = (
  type: AuthError['type'], 
  message: string, 
  details?: any
): AuthError => {
  return {
    type,
    message,
    details
  };
}; 