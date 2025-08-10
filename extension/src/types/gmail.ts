// Gmail API 相關的 TypeScript 型別定義
// 參考 Gmail API v1 文檔: https://developers.google.com/gmail/api/reference/rest

// Gmail 信件列表 API 回應格式
export interface GmailMessageListResponse {
  messages?: GmailMessageItem[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

// Gmail 信件基本項目
export interface GmailMessageItem {
  id: string;
  threadId: string;
}

// Gmail 信件完整詳情
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: GmailMessagePart;
  sizeEstimate?: number;
  historyId?: string;
  internalDate?: string;
}

// Gmail 信件內容部分
export interface GmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: GmailMessagePartBody;
  parts?: GmailMessagePart[];
}

// Gmail 信件標頭
export interface GmailHeader {
  name: string;
  value: string;
}

// Gmail 信件內容主體
export interface GmailMessagePartBody {
  attachmentId?: string;
  size?: number;
  data?: string; // Base64 編碼的內容
}

// 處理後的信件資料（我們內部使用的格式）
export interface ProcessedEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromEmail: string;
  fromDomain: string;
  to: string[];
  date: Date;
  snippet: string;
  isRead: boolean;
  labels: string[];
  hasUnsubscribe: boolean;
  unsubscribeLink?: string;
  category?: EmailCategory;
  importance?: EmailImportance;
}

// 信件分類
export type EmailCategory = 
  | 'working'           // 工作相關
  | 'shopping'          // 購物相關
  | 'jobHunting'        // 求職相關
  | 'promotional'       // 促銷信件
  | 'social'            // 社交媒體
  | 'newsletter'        // 電子報
  | 'notification'      // 通知信件
  | 'unknown';          // 未分類

// 信件重要性
export type EmailImportance = 'high' | 'medium' | 'low';

// Gmail API 搜尋參數
export interface GmailSearchParams {
  q: string;                    // 搜尋查詢字串
  maxResults?: number;          // 最大結果數量 (預設 100)
  pageToken?: string;           // 分頁 token
  labelIds?: string[];          // 標籤篩選
  includeSpamTrash?: boolean;   // 是否包含垃圾信與已刪除
}

// Gmail API 批次操作參數
export interface GmailBatchRequest {
  messageIds: string[];
  addLabels?: string[];
  removeLabels?: string[];
}

// Gmail API 錯誤回應
export interface GmailApiError {
  code: number;
  message: string;
  status: string;
  details?: any;
}

// API 操作結果
export interface GmailApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: GmailApiError;
  quota?: {
    used: number;
    limit: number;
  };
} 