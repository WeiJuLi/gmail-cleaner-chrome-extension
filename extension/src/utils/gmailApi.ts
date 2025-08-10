// Gmail API - Complete wrapper for Gmail operations.
// Integrates token management, error handling and retry logic.
// Official docs:
// - API overview: https://developers.google.com/gmail/api
// - messages.list: https://developers.google.com/gmail/api/reference/rest/v1/users.messages/list
// - messages.get: https://developers.google.com/gmail/api/reference/rest/v1/users.messages/get
// - messages.batchModify: https://developers.google.com/gmail/api/reference/rest/v1/users.messages/batchModify

import {
  GmailApiResult,
  GmailMessage,
  GmailMessageListResponse,
  GmailSearchParams,
  GmailBatchRequest,
  ProcessedEmail,
  GmailHeader,
  EmailCategory,
  EmailImportance
} from '../types/gmail';
import { tokenManager } from './tokenManager';
import { apiErrorHandler, RetryConfig } from './apiErrorHandler';

// Gmail API 基礎 URL
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

// API 請求配置
interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  params?: Record<string, string | number | boolean>;
  body?: any;
  retryConfig?: Partial<RetryConfig>;
}

// 批次處理配置
interface BatchConfig {
  batchSize: number;
  concurrency: number;
  progressCallback?: (processed: number, total: number) => void;
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  batchSize: 50,
  concurrency: 3
};

class GmailApiService {
  private isInitialized = false;

  /**
   * 初始化 Gmail API 服務
   */
  async initialize(): Promise<GmailApiResult<void>> {
    if (this.isInitialized) {
      return { success: true };
    }

    // 檢查認證狀態
    const isAuthenticated = await tokenManager.isAuthenticated();
    if (!isAuthenticated) {
      return {
        success: false,
        error: {
          code: 401,
          message: 'User not authenticated. Please log in first.',
          status: 'UNAUTHENTICATED'
        }
      };
    }

    this.isInitialized = true;
    return { success: true };
  }

  // ==================== 信件查詢功能 ====================

  /**
   * Search messages with Gmail query parameters.
   * See messages.list docs for query syntax.
   */
  async searchEmails(params: GmailSearchParams): Promise<GmailApiResult<GmailMessageListResponse>> {
    const initResult = await this.initialize();
    if (!initResult.success) {
      return {
        success: false,
        error: initResult.error!
      };
    }

    const queryParams: Record<string, string | number | boolean> = {
      q: params.q
    };

    if (params.maxResults) queryParams.maxResults = params.maxResults;
    if (params.pageToken) queryParams.pageToken = params.pageToken;
    if (params.labelIds?.length) queryParams.labelIds = params.labelIds.join(',');
    if (params.includeSpamTrash !== undefined) queryParams.includeSpamTrash = params.includeSpamTrash;

    return this.makeApiRequest<GmailMessageListResponse>({
      method: 'GET',
      path: '/messages',
      params: queryParams
    });
  }

  /** Get recent messages (thin wrapper around searchEmails). */
  async getEmailList(maxResults: number = 100, pageToken?: string): Promise<GmailApiResult<GmailMessageListResponse>> {
    return this.searchEmails({
      q: '',
      maxResults,
      pageToken
    });
  }

  /** Get a single message with full format. */
  async getEmailDetails(messageId: string): Promise<GmailApiResult<GmailMessage>> {
    const initResult = await this.initialize();
    if (!initResult.success) {
      return {
        success: false,
        error: initResult.error!
      };
    }

    return this.makeApiRequest<GmailMessage>({
      method: 'GET',
      path: `/messages/${messageId}`,
      params: { format: 'full' }
    });
  }

  /** Batch-load message details in chunks with limited concurrency. */
  async getEmailBatch(
    messageIds: string[],
    config: Partial<BatchConfig> = {}
  ): Promise<GmailApiResult<GmailMessage[]>> {
    const batchConfig = { ...DEFAULT_BATCH_CONFIG, ...config };
    const results: GmailMessage[] = [];
    const errors: string[] = [];

    // 分批處理
    for (let i = 0; i < messageIds.length; i += batchConfig.batchSize) {
      const batch = messageIds.slice(i, i + batchConfig.batchSize);
      
      // 並行處理當前批次
      const promises = batch.map(async (messageId) => {
        const result = await this.getEmailDetails(messageId);
        if (result.success) {
          return result.data!;
        } else {
          errors.push(`Failed to get email ${messageId}: ${result.error?.message}`);
          return null;
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults.filter(result => result !== null) as GmailMessage[]);

      // 進度回調
      if (batchConfig.progressCallback) {
        batchConfig.progressCallback(i + batch.length, messageIds.length);
      }
    }

    if (errors.length > 0) {
      console.warn('Some emails failed to load:', errors);
    }

    return { success: true, data: results };
  }

  // ==================== 信件操作功能 ====================

  /** Soft-delete (move to TRASH) via batchModify. */
  async deleteEmails(messageIds: string[]): Promise<GmailApiResult<void>> {
    return this.batchModifyEmails({
      messageIds,
      addLabels: ['TRASH']
    });
  }

  /** Mark as READ (remove UNREAD). */
  async markAsRead(messageIds: string[]): Promise<GmailApiResult<void>> {
    return this.batchModifyEmails({
      messageIds,
      removeLabels: ['UNREAD']
    });
  }

  /** Mark as UNREAD (add UNREAD). */
  async markAsUnread(messageIds: string[]): Promise<GmailApiResult<void>> {
    return this.batchModifyEmails({
      messageIds,
      addLabels: ['UNREAD']
    });
  }

  /** Add labels by id. */
  async addLabels(messageIds: string[], labels: string[]): Promise<GmailApiResult<void>> {
    return this.batchModifyEmails({
      messageIds,
      addLabels: labels
    });
  }

  /** Remove labels by id. */
  async removeLabels(messageIds: string[], labels: string[]): Promise<GmailApiResult<void>> {
    return this.batchModifyEmails({
      messageIds,
      removeLabels: labels
    });
  }

  /** Archive (remove INBOX). */
  async archiveEmails(messageIds: string[]): Promise<GmailApiResult<void>> {
    return this.batchModifyEmails({
      messageIds,
      removeLabels: ['INBOX']
    });
  }

  /**
   * 批次修改信件
   */
  private async batchModifyEmails(request: GmailBatchRequest): Promise<GmailApiResult<void>> {
    const initResult = await this.initialize();
    if (!initResult.success) return initResult;

    const body: any = {
      ids: request.messageIds
    };

    if (request.addLabels?.length) {
      body.addLabelIds = request.addLabels;
    }

    if (request.removeLabels?.length) {
      body.removeLabelIds = request.removeLabels;
    }

    const result = await this.makeApiRequest<any>({
      method: 'POST',
      path: '/messages/batchModify',
      body
    });

    return {
      success: result.success,
      error: result.error
    };
  }

  // ==================== 資料處理功能 ====================

  /** Parse common fields from Gmail headers. */
  parseEmailHeaders(headers: GmailHeader[]): {
    subject: string;
    from: string;
    fromEmail: string;
    fromDomain: string;
    to: string[];
    date: Date;
  } {
    const headerMap = new Map<string, string>();
    headers.forEach(header => {
      headerMap.set(header.name.toLowerCase(), header.value);
    });

    // 解析 subject
    const subject = headerMap.get('subject') || '';

    // 解析 from
    const fromHeader = headerMap.get('from') || '';
    const fromEmailMatch = fromHeader.match(/<([^>]+)>/);
    const fromEmail = fromEmailMatch ? fromEmailMatch[1] : fromHeader;
    const fromDomain = fromEmail.includes('@') ? fromEmail.split('@')[1] : '';
    const from = fromHeader.replace(/<[^>]+>/, '').trim().replace(/^["']|["']$/g, '') || fromEmail;

    // 解析 to
    const toHeader = headerMap.get('to') || '';
    const to = toHeader.split(',').map(addr => {
      const emailMatch = addr.match(/<([^>]+)>/);
      return emailMatch ? emailMatch[1] : addr.trim();
    }).filter(email => email);

    // 解析 date
    const dateHeader = headerMap.get('date') || '';
    const date = dateHeader ? new Date(dateHeader) : new Date();

    return {
      subject,
      from,
      fromEmail,
      fromDomain,
      to,
      date
    };
  }

  /** Extract text/plain parts content (best-effort). */
  extractEmailContent(message: GmailMessage): string {
    if (!message.payload) return '';

    // 遞迴搜尋文字內容
    const extractTextFromPart = (part: any): string => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        try {
          return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } catch (e) {
          return '';
        }
      }

      if (part.parts) {
        return part.parts.map(extractTextFromPart).join(' ');
      }

      return '';
    };

    return extractTextFromPart(message.payload);
  }

  /** Detect List-Unsubscribe header or unsubscribe links in content. */
  private hasUnsubscribeLink(content: string, headers: GmailHeader[]): { has: boolean; link?: string } {
    // 檢查標頭中的 List-Unsubscribe
    const unsubscribeHeader = headers.find(h => h.name.toLowerCase() === 'list-unsubscribe');
    if (unsubscribeHeader) {
      const linkMatch = unsubscribeHeader.value.match(/<(https?:[^>]+)>/);
      if (linkMatch) {
        return { has: true, link: linkMatch[1] };
      }
    }

    // 檢查內容中的退訂連結
    const unsubscribeRegex = /unsubscribe|取消訂閱/i;
    const linkRegex = /<a[^>]+href="([^"]*unsubscribe[^"]*)"[^>]*>/i;
    
    if (unsubscribeRegex.test(content)) {
      const linkMatch = content.match(linkRegex);
      if (linkMatch) {
        return { has: true, link: linkMatch[1] };
      }
      return { has: true };
    }

    return { has: false };
  }

  /** Naive categorization by keywords and known domains. */
  private categorizeEmail(
    subject: string,
    fromDomain: string,
    content: string
  ): EmailCategory {
    const subjectLower = subject.toLowerCase();
    const contentLower = content.toLowerCase();

    // 工作相關關鍵字
    const workingKeywords = ['job', 'career', 'interview', 'position', 'hiring', 'linkedin', 'resume'];
    if (workingKeywords.some(keyword => subjectLower.includes(keyword) || contentLower.includes(keyword))) {
      return 'working';
    }

    // 購物相關關鍵字
    const shoppingKeywords = ['order', 'purchase', 'shipping', 'delivery', 'payment', 'receipt', 'invoice'];
    if (shoppingKeywords.some(keyword => subjectLower.includes(keyword) || contentLower.includes(keyword))) {
      return 'shopping';
    }

    // 求職相關關鍵字
    const jobHuntingKeywords = ['application', 'cv', 'opportunity', 'vacancy', 'recruitment'];
    if (jobHuntingKeywords.some(keyword => subjectLower.includes(keyword) || contentLower.includes(keyword))) {
      return 'jobHunting';
    }

    // 社交媒體
    const socialDomains = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com'];
    if (socialDomains.some(domain => fromDomain.includes(domain))) {
      return 'social';
    }

    // 電子報/促銷
    const promotionalKeywords = ['newsletter', 'promotion', 'sale', 'discount', 'offer', 'deal'];
    if (promotionalKeywords.some(keyword => subjectLower.includes(keyword) || contentLower.includes(keyword))) {
      return 'promotional';
    }

    return 'unknown';
  }

  /** Normalize a GmailMessage into ProcessedEmail shape. */
  async processRawEmail(message: GmailMessage): Promise<ProcessedEmail> {
    const headers = message.payload?.headers || [];
    const parsedHeaders = this.parseEmailHeaders(headers);
    const content = this.extractEmailContent(message);
    const unsubscribeInfo = this.hasUnsubscribeLink(content, headers);

    return {
      id: message.id,
      threadId: message.threadId,
      subject: parsedHeaders.subject,
      from: parsedHeaders.from,
      fromEmail: parsedHeaders.fromEmail,
      fromDomain: parsedHeaders.fromDomain,
      to: parsedHeaders.to,
      date: parsedHeaders.date,
      snippet: message.snippet || '',
      isRead: !message.labelIds?.includes('UNREAD'),
      labels: message.labelIds || [],
      hasUnsubscribe: unsubscribeInfo.has,
      unsubscribeLink: unsubscribeInfo.link,
      category: this.categorizeEmail(parsedHeaders.subject, parsedHeaders.fromDomain, content),
      importance: this.assessImportance(parsedHeaders.subject, parsedHeaders.fromDomain, content)
    };
  }

  /** Naive importance assessment. */
  private assessImportance(subject: string, fromDomain: string, content: string): EmailImportance {
    const subjectLower = subject.toLowerCase();
    const contentLower = content.toLowerCase();

    // 高重要性關鍵字
    const highImportanceKeywords = ['urgent', 'important', 'deadline', 'interview', 'offer', 'contract'];
    if (highImportanceKeywords.some(keyword => subjectLower.includes(keyword) || contentLower.includes(keyword))) {
      return 'high';
    }

    // 來自信任域名
    const trustedDomains = ['gmail.com', 'outlook.com', 'company.com', 'linkedin.com'];
    if (trustedDomains.some(domain => fromDomain.includes(domain))) {
      return 'medium';
    }

    return 'low';
  }

  // ==================== 私有方法 ====================

  /** Low-level request with token injection and retries. */
  private async makeApiRequest<T>(config: ApiRequestConfig): Promise<GmailApiResult<T>> {
    return apiErrorHandler.executeWithRetry(async () => {
      // 取得有效的 access token
      const tokenResult = await tokenManager.getValidToken();
      if (!tokenResult.success) {
        throw new Error('Failed to get valid access token');
      }

      const token = tokenResult.data!;

      // 建構 URL
      let url = `${GMAIL_API_BASE}${config.path}`;
      if (config.params) {
        const searchParams = new URLSearchParams();
        Object.entries(config.params).forEach(([key, value]) => {
          searchParams.append(key, value.toString());
        });
        url += `?${searchParams.toString()}`;
      }

      // 準備請求
      const fetchOptions: RequestInit = {
        method: config.method,
        headers: {
          'Authorization': `${token.tokenType} ${token.token}`,
          'Content-Type': 'application/json'
        }
      };

      if (config.body) {
        fetchOptions.body = JSON.stringify(config.body);
      }

      // 發送請求
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw response;
      }

      // 解析回應
      const data = await response.json();
      return data as T;

    }, config.retryConfig);
  }
}

// 匯出單例實例
export const gmailApi = new GmailApiService(); 