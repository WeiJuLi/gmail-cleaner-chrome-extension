// 篩選規則與結果相關的 TypeScript 型別定義
// 定義各種篩選條件、規則引擎與分析結果

import { ProcessedEmail, EmailCategory } from './gmail';
import { ModeType } from './modeSettings';

// 篩選條件類型
export type FilterConditionType = 
  | 'sender'           // 寄件者
  | 'domain'           // 域名
  | 'subject'          // 主旨
  | 'content'          // 內容
  | 'keyword'          // 關鍵字
  | 'date'             // 日期
  | 'label'            // 標籤
  | 'frequency'        // 頻率
  | 'importance';      // 重要性

// 篩選操作符
export type FilterOperator = 
  | 'equals'           // 等於
  | 'contains'         // 包含
  | 'startsWith'       // 開始於
  | 'endsWith'         // 結束於
  | 'regex'            // 正則表達式
  | 'greaterThan'      // 大於
  | 'lessThan'         // 小於
  | 'between'          // 之間
  | 'in'               // 在清單中
  | 'notIn';           // 不在清單中

// 單一篩選條件
export interface FilterCondition {
  type: FilterConditionType;
  operator: FilterOperator;
  value: string | number | Date | string[];
  caseSensitive?: boolean;
  weight?: number;             // 條件權重 (1-10)
}

// 篩選規則組合
export interface FilterRule {
  id: string;
  name: string;
  description?: string;
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';         // 條件間的邏輯關係
  enabled: boolean;
  priority: number;            // 規則優先級
  createdAt: Date;
  updatedAt: Date;
}

// 篩選器配置
export interface FilterConfig {
  mode: ModeType;
  rules: FilterRule[];
  globalSettings: {
    maxResults: number;        // 最大結果數
    includeSpam: boolean;      // 包含垃圾信
    includeTrash: boolean;     // 包含已刪除
    dateRange?: {
      from?: Date;
      to?: Date;
    };
  };
}

// 關鍵字匹配結果
export interface KeywordMatch {
  keyword: string;
  field: 'subject' | 'content' | 'sender';
  position: number;
  context: string;             // 匹配的上下文
  weight: number;
}

// 域名分析結果
export interface DomainAnalysis {
  domain: string;
  trustScore: number;          // 信任分數 (0-1)
  category: EmailCategory;
  reputation: 'good' | 'neutral' | 'suspicious' | 'bad';
  characteristics: {
    isMarketing: boolean;
    isTransactional: boolean;
    isNewsletter: boolean;
    hasUnsubscribe: boolean;
  };
  frequency: {
    emailsPerDay: number;
    emailsPerWeek: number;
    emailsPerMonth: number;
  };
}

// 內容分析結果
export interface ContentAnalysis {
  language: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  keyPhrases: string[];
  hasUnsubscribeLink: boolean;
  unsubscribeLink?: string;
  containsImages: boolean;
  containsAttachments: boolean;
  spamIndicators: {
    excessiveCaps: boolean;
    multipleExclamations: boolean;
    suspiciousUrls: boolean;
    urgencyWords: boolean;
  };
}

// 頻率分析結果
export interface FrequencyAnalysis {
  sender: string;
  domain: string;
  totalEmails: number;
  timespan: {
    firstEmail: Date;
    lastEmail: Date;
    daysActive: number;
  };
  pattern: {
    avgPerDay: number;
    avgPerWeek: number;
    peakDays: string[];        // 最活躍的星期幾
    peakHours: number[];       // 最活躍的小時
  };
  trend: 'increasing' | 'decreasing' | 'stable' | 'irregular';
}

// 信件分析結果
export interface EmailAnalysisResult {
  email: ProcessedEmail;
  scores: {
    relevanceScore: number;    // 相關性分數 (0-1)
    trustScore: number;        // 信任分數 (0-1)
    spamScore: number;         // 垃圾信分數 (0-1)
    importanceScore: number;   // 重要性分數 (0-1)
    confidenceScore: number;   // 整體信心分數 (0-1)
  };
  matches: {
    keywordMatches: KeywordMatch[];
    ruleMatches: FilterRule[];
  };
  analysis: {
    domain: DomainAnalysis;
    content: ContentAnalysis;
    frequency: FrequencyAnalysis;
  };
  recommendations: {
    action: 'keep' | 'delete' | 'archive' | 'unsubscribe' | 'review';
    confidence: number;
    reasons: string[];
  };
}

// 篩選執行結果
export interface FilterExecutionResult {
  mode: ModeType;
  config: FilterConfig;
  results: EmailAnalysisResult[];
  summary: {
    totalProcessed: number;
    totalMatched: number;
    executionTime: number;     // 執行時間 (ms)
    
    // 按動作分組的統計
    actionSummary: {
      keep: number;
      delete: number;
      archive: number;
      unsubscribe: number;
      review: number;
    };
    
    // 按分數範圍統計
    scoreDistribution: {
      high: number;            // 0.8-1.0
      medium: number;          // 0.5-0.8
      low: number;             // 0.0-0.5
    };
  };
  errors: {
    message: string;
    emailId?: string;
    details?: any;
  }[];
  executedAt: Date;
}

// 預設篩選規則模板
export const DEFAULT_FILTER_RULES: { [key in ModeType]: FilterRule[] } = {
  working: [
    {
      id: 'working-job-keywords',
      name: '工作關鍵字篩選',
      description: '基於工作相關關鍵字的篩選',
      conditions: [
        {
          type: 'keyword',
          operator: 'contains',
          value: ['job', 'career', 'interview', 'position', 'hiring'],
          weight: 8
        }
      ],
      logic: 'OR',
      enabled: true,
      priority: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'working-professional-domains',
      name: '專業網站域名',
      description: '來自專業求職網站的信件',
      conditions: [
        {
          type: 'domain',
          operator: 'in',
          value: ['linkedin.com', 'indeed.com', 'glassdoor.com'],
          weight: 9
        }
      ],
      logic: 'OR',
      enabled: true,
      priority: 9,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  shopping: [
    {
      id: 'shopping-order-keywords',
      name: '購物訂單關鍵字',
      description: '基於購物訂單相關關鍵字的篩選',
      conditions: [
        {
          type: 'keyword',
          operator: 'contains',
          value: ['order', 'purchase', 'payment', 'receipt', 'confirmation'],
          weight: 9
        }
      ],
      logic: 'OR',
      enabled: true,
      priority: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  jobHunting: [
    {
      id: 'jobhunting-application-keywords',
      name: '求職申請關鍵字',
      description: '基於求職申請相關關鍵字的篩選',
      conditions: [
        {
          type: 'keyword',
          operator: 'contains',
          value: ['application', 'resume', 'CV', 'opportunity', 'interview'],
          weight: 9
        }
      ],
      logic: 'OR',
      enabled: true,
      priority: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
}; 