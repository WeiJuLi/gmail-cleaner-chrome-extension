// 中文說明：OAuth 認證相關的 TypeScript 型別定義
// 這個檔案定義了整個認證系統會用到的所有資料結構

// 中文說明：儲存在 Chrome Storage 中的認證資料格式
export interface StoredAuthData {
  access_token: string;        // Google OAuth 存取權杖
  expires_at: number;          // 權杖過期時間 (timestamp)
  user_email: string;          // 使用者 Gmail 地址
  user_name?: string;          // 使用者姓名（可選）
  avatar_url?: string;         // 使用者頭像 URL（可選）
}

// 中文說明：使用者基本資訊
export interface UserInfo {
  email: string;               // Gmail 地址
  name: string;                // 顯示名稱
  picture?: string;            // 頭像圖片 URL
  verified_email?: boolean;    // 是否已驗證 email
}

// 中文說明：認證狀態的三種可能值
export type AuthState = 
  | 'loading'                  // 載入中：檢查現有登入狀態
  | 'authenticated'            // 已認證：使用者已成功登入
  | 'unauthenticated';         // 未認證：需要使用者登入

// 中文說明：OAuth 流程中可能發生的錯誤類型
export interface AuthError {
  type: 'oauth_cancelled' |    // 使用者取消 OAuth 流程
        'permission_denied' |   // 使用者拒絕權限
        'network_error' |      // 網路連線錯誤
        'token_invalid' |      // Token 無效或過期
        'api_error';           // Gmail API 呼叫錯誤
  message: string;             // 錯誤描述訊息
  details?: any;               // 詳細錯誤資訊（用於除錯）
}

// 中文說明：Gmail API 回應的使用者資料格式（參考 Google People API）
export interface GoogleUserProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

// 中文說明：OAuth 流程的設定參數
export interface OAuthConfig {
  clientId: string;            // Google Client ID
  scope: string;               // 權限範圍
  redirectUri: string;         // 重新導向 URI
} 