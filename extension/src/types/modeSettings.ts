// ModeSettings 功能相關的 TypeScript 型別定義
// 定義三種模式的設定、篩選規則與掃描結果

import { ProcessedEmail, EmailCategory } from './gmail';

// 模式類型
export type ModeType = 'working' | 'shopping' | 'jobHunting';

// 模式顯示資訊
export interface ModeDisplayInfo {
  id: ModeType;
  name: string;
  icon: string;
  description: string;
  color: string;
}

// 關鍵字配置
export interface KeywordConfig {
  include: string[];           // 必須包含的關鍵字
  exclude: string[];           // 排除的關鍵字
  weight: {                    // 關鍵字權重設定
    high: string[];            // 高權重關鍵字 (權重 3)
    medium: string[];          // 中權重關鍵字 (權重 2)
    low: string[];             // 低權重關鍵字 (權重 1)
  };
}

// 域名配置
export interface DomainConfig {
  trusted: string[];           // 信任的域名
  suspicious: string[];        // 可疑的域名
  whitelist: string[];         // 白名單域名
  blacklist: string[];         // 黑名單域名
}

// 自動規則配置
export interface AutoRulesConfig {
  enableDomainAnalysis: boolean;      // 啟用域名分析
  enableFrequencyAnalysis: boolean;   // 啟用頻率分析
  enableContentAnalysis: boolean;     // 啟用內容分析
  enableUnsubscribeDetection: boolean; // 啟用退訂連結檢測
  minConfidenceScore: number;         // 最小信心分數 (0-1)
}

// 完整的模式配置
export interface ModeConfig {
  id: ModeType;
  enabled: boolean;
  displayInfo: ModeDisplayInfo;
  
  // 使用者手動設定
  whitelist: string[];         // 使用者手動新增的 email 白名單
  blacklist: string[];         // 使用者手動新增的 email 黑名單
  
  // 智慧篩選規則
  keywords: KeywordConfig;
  domains: DomainConfig;
  autoRules: AutoRulesConfig;
  
  // 設定時間戳
  createdAt: Date;
  updatedAt: Date;
  lastScanAt?: Date;
}

// 掃描統計資訊
export interface ScanStatistics {
  total: number;                      // 總信件數
  processed: number;                  // 已處理數量
  
  // 按分類統計
  byCategory: { [key in EmailCategory]?: number };
  
  // 按域名統計
  byDomain: { [domain: string]: number };
  
  // 按日期統計
  byDate: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    older: number;
  };
  
  // 按來源統計
  bySource: {
    whitelist: number;         // 白名單匹配
    keywords: number;          // 關鍵字匹配
    domainAnalysis: number;    // 域名分析
    smartRules: number;        // 智慧規則
  };
}

// 掃描建議
export interface ScanSuggestions {
  potentialSpam: ProcessedEmail[];           // 疑似垃圾信
  unsubscribeRecommendations: {              // 退訂建議
    email: string;
    domain: string;
    count: number;
    lastReceived: Date;
    unsubscribeLink?: string;
  }[];
  frequentSenders: {                         // 頻繁寄件者
    email: string;
    domain: string;
    count: number;
    avgPerDay: number;
    category: EmailCategory;
  }[];
  newDomainSuggestions: {                    // 新域名建議
    domain: string;
    count: number;
    suggestedAction: 'whitelist' | 'blacklist' | 'monitor';
    confidence: number;
  }[];
}

// 信件篩選結果
export interface EmailFilterResult {
  mode: ModeType;
  emails: ProcessedEmail[];
  statistics: ScanStatistics;
  suggestions: ScanSuggestions;
  scanDuration: number;              // 掃描耗時 (ms)
  scannedAt: Date;
  hasMore: boolean;                  // 是否還有更多結果
  nextPageToken?: string;            // 下一頁 token
}

// 掃描狀態
export type ScanStatus = 
  | 'idle'          // 閒置
  | 'scanning'      // 掃描中
  | 'processing'    // 處理中
  | 'completed'     // 完成
  | 'error'         // 錯誤
  | 'cancelled';    // 已取消

// 掃描進度
export interface ScanProgress {
  status: ScanStatus;
  progress: number;                  // 進度百分比 (0-100)
  currentStep: string;               // 當前步驟描述
  estimatedTimeRemaining?: number;   // 預估剩餘時間 (ms)
  totalEmails?: number;              // 總信件數
  processedEmails?: number;          // 已處理信件數
}

// 批次操作類型
export type BatchActionType = 
  | 'delete'        // 刪除
  | 'markAsRead'    // 標記為已讀
  | 'addLabel'      // 加入標籤
  | 'removeLabel'   // 移除標籤
  | 'archive'       // 歸檔
  | 'unsubscribe';  // 退訂

// 批次操作請求
export interface BatchActionRequest {
  action: BatchActionType;
  emailIds: string[];
  options?: {
    labels?: string[];             // 用於標籤操作
    confirmationRequired?: boolean; // 是否需要確認
  };
}

// 批次操作結果
export interface BatchActionResult {
  action: BatchActionType;
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: string[];
  executedAt: Date;
}

// 模式配置的預設值
export const DEFAULT_MODE_CONFIGS: { [key in ModeType]: Partial<ModeConfig> } = {
  working: {
    displayInfo: {
      id: 'working',
      name: 'Working Mode',
      icon: '💼',
      description: '工作相關信件管理',
      color: '#3B82F6'
    },
    keywords: {
      include: ['work', 'job', 'career', 'professional'],
      exclude: ['promotion', 'sale', 'discount'],
      weight: {
        high: ['job application', 'interview', 'position', 'hiring'],
        medium: ['career', 'opportunity', 'resume', 'CV'],
        low: ['work', 'professional', 'linkedin']
      }
    },
    domains: {
      trusted: ['linkedin.com', 'indeed.com', 'glassdoor.com'],
      suspicious: [],
      whitelist: [],
      blacklist: ['promo.com', 'deals.com']
    }
  },
  
  shopping: {
    displayInfo: {
      id: 'shopping',
      name: 'Shopping Mode',
      icon: '🛒',
      description: '購物與促銷信件管理',
      color: '#10B981'
    },
    keywords: {
      include: ['order', 'purchase', 'buy', 'shop'],
      exclude: ['job', 'career', 'work'],
      weight: {
        high: ['order confirmation', 'purchase', 'payment', 'receipt'],
        medium: ['sale', 'discount', 'offer', 'deal'],
        low: ['shop', 'store', 'product']
      }
    },
    domains: {
      trusted: ['amazon.com', 'shopee.tw', 'momo.com'],
      suspicious: [],
      whitelist: [],
      blacklist: []
    }
  },
  
  jobHunting: {
    displayInfo: {
      id: 'jobHunting',
      name: 'Job Hunting Mode',
      icon: '🎯',
      description: '求職相關信件管理',
      color: '#8B5CF6'
    },
    keywords: {
      include: ['application', 'resume', 'CV', 'opportunity'],
      exclude: ['shopping', 'promotion', 'sale'],
      weight: {
        high: ['interview invitation', 'job offer', 'application status'],
        medium: ['application', 'resume', 'CV', 'opportunity'],
        low: ['career', 'job', 'hiring']
      }
    },
    domains: {
      trusted: ['linkedin.com', 'indeed.com', '104.com.tw'],
      suspicious: [],
      whitelist: [],
      blacklist: []
    }
  }
}; 