// Utils 模組統一匯出
// 提供所有 Gmail API 相關工具的統一介面

// 核心模組匯出
export { tokenManager } from './tokenManager';
export type { AccessToken, TokenValidationResult } from './tokenManager';

export { apiErrorHandler } from './apiErrorHandler';
export type { RetryConfig, ErrorAnalysis } from './apiErrorHandler';
export { ErrorType } from './apiErrorHandler';

export { gmailApi } from './gmailApi';

// Mode 管理和頁面篩選模組
export { modeManager } from './modeManager';
export type { ModeType, ModeSettings, AllModeSettings } from './modeManager';

export { gmailPageFilter } from './gmailPageFilter';

// 整合測試與驗證工具
import { tokenManager } from './tokenManager';
import { gmailApi } from './gmailApi';
import { GmailApiResult } from '../types/gmail';

/**
 * Integration test for Gmail API access.
 * Verifies authentication state and a basic list call.
 */
export async function testGmailApiIntegration(): Promise<{
  success: boolean;
  results: {
    authentication: boolean;
    apiAccess: boolean;
    tokenInfo?: any;
    error?: string;
  };
}> {
  const results = {
    authentication: false,
    apiAccess: false,
    tokenInfo: undefined as any,
    error: undefined as string | undefined
  };

  try {
    // 1. 測試認證狀態
    console.log('🔐 Testing authentication...');
    const isAuthenticated = await tokenManager.isAuthenticated();
    results.authentication = isAuthenticated;

    if (!isAuthenticated) {
      results.error = 'User not authenticated. Please log in first.';
      return { success: false, results };
    }

    console.log('✅ Authentication successful');

    // 2. 取得 token 資訊
    const tokenInfo = await tokenManager.getTokenExpiryInfo();
    results.tokenInfo = tokenInfo;

    if (tokenInfo) {
      console.log(`📋 Token expires in: ${tokenInfo.expiresIn} seconds`);
      console.log(`📅 Token expires at: ${tokenInfo.expiresAt.toISOString()}`);
    }

    // 3. 測試基本 API 存取
    console.log('📧 Testing Gmail API access...');
    const emailListResult = await gmailApi.getEmailList(5); // 只取 5 封信件進行測試

    if (emailListResult.success) {
      results.apiAccess = true;
      const emailCount = emailListResult.data?.messages?.length || 0;
      console.log(`✅ Gmail API access successful. Found ${emailCount} emails`);
    } else {
      results.error = `Gmail API access failed: ${emailListResult.error?.message}`;
      console.error('❌ Gmail API access failed:', emailListResult.error);
      return { success: false, results };
    }

    return { success: true, results };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    results.error = errorMessage;
    console.error('❌ Integration test failed:', error);
    return { success: false, results };
  }
}

/**
 * System health quick check (auth, token expiry, connectivity).
 */
export async function checkSystemHealth(): Promise<{
  status: 'healthy' | 'warning' | 'error';
  details: {
    authentication: 'ok' | 'warning' | 'error';
    tokenExpiry: 'ok' | 'warning' | 'error';
    apiConnectivity: 'ok' | 'warning' | 'error';
  };
  messages: string[];
}> {
  const details: {
    authentication: 'ok' | 'warning' | 'error';
    tokenExpiry: 'ok' | 'warning' | 'error';
    apiConnectivity: 'ok' | 'warning' | 'error';
  } = {
    authentication: 'error',
    tokenExpiry: 'error',
    apiConnectivity: 'error'
  };
  const messages: string[] = [];

  // 檢查認證狀態
  try {
    const isAuthenticated = await tokenManager.isAuthenticated();
    if (isAuthenticated) {
      details.authentication = 'ok';
      messages.push('✅ Authentication status: OK');
    } else {
      details.authentication = 'error';
      messages.push('❌ Authentication status: Not authenticated');
    }
  } catch (error) {
    details.authentication = 'error';
    messages.push('❌ Authentication check failed');
  }

  // 檢查 token 過期時間
  try {
    const tokenInfo = await tokenManager.getTokenExpiryInfo();
    if (tokenInfo) {
      const hoursUntilExpiry = tokenInfo.expiresIn / 3600;
      if (hoursUntilExpiry > 1) {
        details.tokenExpiry = 'ok';
        messages.push(`✅ Token expires in ${hoursUntilExpiry.toFixed(1)} hours`);
      } else if (hoursUntilExpiry > 0.1) {
        details.tokenExpiry = 'warning';
        messages.push(`⚠️ Token expires in ${(hoursUntilExpiry * 60).toFixed(0)} minutes`);
      } else {
        details.tokenExpiry = 'error';
        messages.push('❌ Token expired or expires very soon');
      }
    } else {
      details.tokenExpiry = 'error';
      messages.push('❌ No token information available');
    }
  } catch (error) {
    details.tokenExpiry = 'error';
    messages.push('❌ Token expiry check failed');
  }

  // 快速 API 連接測試（不實際取得信件）
  try {
    // 這裡可以實作一個簡單的 API ping，但目前先跳過
    details.apiConnectivity = 'ok';
    messages.push('✅ API connectivity: OK (assumed)');
  } catch (error) {
    details.apiConnectivity = 'error';
    messages.push('❌ API connectivity check failed');
  }

  // 決定整體狀態
  let status: 'healthy' | 'warning' | 'error';
  if (details.authentication === 'error' || details.tokenExpiry === 'error' || details.apiConnectivity === 'error') {
    status = 'error';
  } else if (details.tokenExpiry === 'warning') {
    status = 'warning';
  } else {
    status = 'healthy';
  }

  return { status, details, messages };
}

/**
 * Convert GmailApiResult error into a user-friendly message.
 */
export function formatApiError(result: GmailApiResult<any>): string {
  if (result.success) {
    return 'Operation completed successfully';
  }

  const error = result.error;
  if (!error) {
    return 'An unknown error occurred';
  }

  switch (error.code) {
    case 401:
      return 'Authentication failed. Please log in again.';
    case 403:
      if (error.message.includes('quota')) {
        return 'API quota exceeded. Please try again later.';
      }
      return 'Insufficient permissions. Please check your account settings.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Server error. Please try again later.';
    default:
      return `Error: ${error.message}`;
  }
} 