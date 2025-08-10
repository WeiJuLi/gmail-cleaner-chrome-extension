// 中文說明：Chrome Storage 管理工具
// 這個檔案負責處理所有與 Chrome Extension Storage 相關的操作
// 主要用於儲存和管理 OAuth token 與使用者資料

import { StoredAuthData } from '../types/auth';

// 中文說明：Chrome Storage 中儲存認證資料的 key 名稱
const AUTH_STORAGE_KEY = 'gmail_auth_data';

/**
 * 中文說明：將認證資料儲存到 Chrome Storage
 * @param authData - 要儲存的認證資料
 * @returns Promise<boolean> - 儲存是否成功
 */
export const saveAuthData = async (authData: StoredAuthData): Promise<boolean> => {
  try {
    // 中文說明：使用 Chrome Storage Local API 儲存資料
    // Local storage 是加密的，適合儲存敏感資料如 token
    await new Promise<void>((resolve, reject) => {
      chrome.storage.local.set({ [AUTH_STORAGE_KEY]: authData }, () => {
        // 中文說明：檢查是否有錯誤發生
        if (chrome.runtime.lastError) {
          console.error('儲存認證資料失敗:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('認證資料儲存成功:', { 
            email: authData.user_email, 
            expires_at: new Date(authData.expires_at).toLocaleString() 
          });
          resolve();
        }
      });
    });
    return true;
  } catch (error) {
    console.error('Chrome Storage 儲存錯誤:', error);
    return false;
  }
};

/**
 * 中文說明：從 Chrome Storage 讀取認證資料
 * @returns Promise<StoredAuthData | null> - 讀取到的認證資料，沒有則回傳 null
 */
export const loadAuthData = async (): Promise<StoredAuthData | null> => {
  try {
    // 中文說明：從 Chrome Storage 取得儲存的認證資料
    const result = await new Promise<any>((resolve, reject) => {
      chrome.storage.local.get([AUTH_STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
          console.error('讀取認證資料失敗:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });

    const authData = result[AUTH_STORAGE_KEY];
    
    if (!authData) {
      console.log('未找到儲存的認證資料');
      return null;
    }

    // 中文說明：檢查資料格式是否正確
    if (!authData.access_token || !authData.expires_at || !authData.user_email) {
      console.warn('儲存的認證資料格式不正確，清除無效資料');
      await removeAuthData();
      return null;
    }

    console.log('成功讀取認證資料:', { 
      email: authData.user_email, 
      expires_at: new Date(authData.expires_at).toLocaleString() 
    });
    
    return authData;
  } catch (error) {
    console.error('Chrome Storage 讀取錯誤:', error);
    return null;
  }
};

/**
 * 中文說明：從 Chrome Storage 移除認證資料（登出時使用）
 * @returns Promise<boolean> - 移除是否成功
 */
export const removeAuthData = async (): Promise<boolean> => {
  try {
    // 中文說明：從 Chrome Storage 刪除認證資料
    await new Promise<void>((resolve, reject) => {
      chrome.storage.local.remove([AUTH_STORAGE_KEY], () => {
        if (chrome.runtime.lastError) {
          console.error('移除認證資料失敗:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('認證資料已成功移除');
          resolve();
        }
      });
    });
    return true;
  } catch (error) {
    console.error('Chrome Storage 移除錯誤:', error);
    return false;
  }
};

/**
 * 中文說明：檢查儲存的 token 是否仍然有效（未過期）
 * @returns Promise<boolean> - token 是否有效
 */
export const isTokenValid = async (): Promise<boolean> => {
  try {
    const authData = await loadAuthData();
    
    if (!authData) {
      console.log('沒有儲存的認證資料');
      return false;
    }

    const now = Date.now();
    const isValid = authData.expires_at > now;
    
    if (!isValid) {
      console.log('Token 已過期:', {
        expired_at: new Date(authData.expires_at).toLocaleString(),
        current_time: new Date(now).toLocaleString()
      });
      // 中文說明：token 過期時自動清除
      await removeAuthData();
    } else {
      const remainingTime = Math.floor((authData.expires_at - now) / 1000 / 60);
      console.log(`Token 仍有效，剩餘時間: ${remainingTime} 分鐘`);
    }
    
    return isValid;
  } catch (error) {
    console.error('檢查 token 有效性時發生錯誤:', error);
    return false;
  }
};

/**
 * 中文說明：取得儲存的 access token（用於 API 呼叫）
 * @returns Promise<string | null> - access token 或 null
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const authData = await loadAuthData();
    
    if (!authData) {
      return null;
    }

    // 中文說明：再次確認 token 未過期
    const isValid = await isTokenValid();
    if (!isValid) {
      return null;
    }

    return authData.access_token;
  } catch (error) {
    console.error('取得 access token 時發生錯誤:', error);
    return null;
  }
}; 