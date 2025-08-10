# Gmail Cleaner Extension - 型別定義系統說明文件

## 概述

本文件詳細說明 Gmail Cleaner Chrome Extension 中新建立的型別定義系統，包含三個核心型別檔案：`gmail.ts`、`modeSettings.ts` 和 `filter.ts`。這套型別系統為整個專案提供了完整的 TypeScript 型別支援，確保程式碼的型別安全性和開發體驗。

## 建立背景與原因

### 為什麼需要型別定義系統？

1. **型別安全**：確保在編譯時期就能發現型別錯誤，減少執行時期的 bug
2. **開發體驗**：提供 IntelliSense 自動完成、型別檢查和重構支援
3. **API 一致性**：標準化 Gmail API 的資料格式和內部資料結構
4. **可維護性**：清楚定義各模組間的資料介面，降低維護成本
5. **團隊協作**：提供統一的型別規範，讓團隊成員能快速理解專案結構

### 系統架構設計原則

- **模組化設計**：每個檔案專注於特定功能領域
- **層次化架構**：從 API 層到業務邏輯層的完整覆蓋
- **擴展性考量**：預留未來功能擴展的空間
- **實用性導向**：基於實際業務需求設計型別結構

---

## 檔案結構與功能分工

```
src/types/
├── gmail.ts          # Gmail API 相關型別定義
├── modeSettings.ts   # 模式設定與掃描結果型別
└── filter.ts         # 篩選規則與分析結果型別
```

---

## 1. Gmail API 型別定義 (`gmail.ts`)

### 建立目的

- 標準化 Gmail API v1 的回應格式
- 定義內部使用的信件資料結構
- 提供 API 操作相關的型別支援

### 核心型別結構

#### Gmail API 原生型別
```typescript
// Gmail API 回應格式
GmailMessageListResponse  // 信件列表 API 回應
GmailMessage             // 信件完整詳情
GmailMessagePart         // 信件內容部分
GmailHeader              // 信件標頭
```

#### 內部處理型別
```typescript
// 處理後的信件資料
ProcessedEmail           // 標準化的信件格式
EmailCategory           // 信件分類枚舉
EmailImportance         // 信件重要性等級
```

#### API 操作型別
```typescript
GmailSearchParams       // 搜尋參數
GmailBatchRequest       // 批次操作請求
GmailApiResult          // API 操作結果包裝
```

### 使用方法（Usage）

#### 1. API 呼叫時的型別標註
```typescript
import { GmailMessageListResponse, GmailSearchParams } from '@/types/gmail';

async function searchEmails(params: GmailSearchParams): Promise<GmailMessageListResponse> {
  // Gmail API 呼叫邏輯
}
```

#### 2. 信件資料處理
```typescript
import { GmailMessage, ProcessedEmail } from '@/types/gmail';

function processEmailData(gmailMessage: GmailMessage): ProcessedEmail {
  // 轉換邏輯
  return {
    id: gmailMessage.id,
    subject: extractSubject(gmailMessage),
    // ... 其他欄位
  };
}
```

#### 3. 批次操作
```typescript
import { GmailBatchRequest, GmailApiResult } from '@/types/gmail';

async function batchDeleteEmails(messageIds: string[]): Promise<GmailApiResult> {
  const request: GmailBatchRequest = {
    messageIds,
    addLabels: ['TRASH']
  };
  // 執行批次操作
}
```

### 重要特性（Highlights）

- **完整的 Gmail API 覆蓋**：涵蓋所有需要的 API 回應格式
- **標準化資料格式**：`ProcessedEmail` 提供統一的內部資料結構
- **錯誤處理支援**：`GmailApiError` 和 `GmailApiResult` 提供完整的錯誤處理
- **分類系統**：`EmailCategory` 支援多種信件分類

---

## 2. 模式設定型別定義 (`modeSettings.ts`)

### 建立目的（Goals）

- 定義三種模式（Working、Shopping、Job Hunting）的配置結構
- 提供掃描結果與統計資訊的型別支援
- 標準化批次操作的資料格式

### 核心型別結構

#### 模式配置型別
```typescript
ModeType                // 模式類型枚舉
ModeDisplayInfo         // 模式顯示資訊
ModeConfig             // 完整模式配置
KeywordConfig          // 關鍵字配置
DomainConfig           // 域名配置
AutoRulesConfig        // 自動規則配置
```

#### 掃描與分析型別
```typescript
ScanStatistics         // 掃描統計資訊
ScanSuggestions       // 掃描建議
EmailFilterResult     // 信件篩選結果
ScanProgress          // 掃描進度
```

#### 批次操作型別
```typescript
BatchActionType       // 批次操作類型
BatchActionRequest    // 批次操作請求
BatchActionResult     // 批次操作結果
```

### 使用方法（Usage）

#### 1. 初始化模式配置
```typescript
import { ModeConfig, DEFAULT_MODE_CONFIGS, ModeType } from '@/types/modeSettings';

function initializeModeConfig(mode: ModeType): ModeConfig {
  const defaultConfig = DEFAULT_MODE_CONFIGS[mode];
  return {
    ...defaultConfig,
    id: mode,
    enabled: true,
    whitelist: [],
    blacklist: [],
    createdAt: new Date(),
    updatedAt: new Date()
  } as ModeConfig;
}
```

#### 2. 處理掃描結果
```typescript
import { EmailFilterResult, ScanStatistics } from '@/types/modeSettings';

function displayScanResults(result: EmailFilterResult) {
  console.log(`模式: ${result.mode}`);
  console.log(`找到 ${result.emails.length} 封信件`);
  console.log(`掃描耗時: ${result.scanDuration}ms`);
  
  // 顯示統計資訊
  const stats = result.statistics;
  console.log(`總計: ${stats.total}, 已處理: ${stats.processed}`);
}
```

#### 3. 執行批次操作
```typescript
import { BatchActionRequest, BatchActionType } from '@/types/modeSettings';

async function performBatchAction(emailIds: string[], action: BatchActionType) {
  const request: BatchActionRequest = {
    action,
    emailIds,
    options: {
      confirmationRequired: true
    }
  };
  
  // 執行批次操作邏輯
}
```

### 預設配置說明（Defaults）

每種模式都有預設的配置模板：

- **Working Mode** 💼：專注於工作相關信件，包含 LinkedIn、Indeed 等專業網站
- **Shopping Mode** 🛒：管理購物與促銷信件，包含電商平台信件
- **Job Hunting Mode** 🎯：針對求職相關信件，強化面試、職位申請等關鍵字

---

## 3. 篩選規則型別定義 (`filter.ts`)

### 建立目的（Goals）

- 定義靈活的篩選條件與規則系統
- 提供信件分析與評分機制
- 支援複雜的篩選邏輯組合

### 核心型別結構

#### 篩選規則型別
```typescript
FilterConditionType     // 篩選條件類型
FilterOperator         // 篩選操作符
FilterCondition        // 單一篩選條件
FilterRule            // 篩選規則組合
FilterConfig          // 篩選器配置
```

#### 分析結果型別
```typescript
KeywordMatch          // 關鍵字匹配結果
DomainAnalysis        // 域名分析結果
ContentAnalysis       // 內容分析結果
FrequencyAnalysis     // 頻率分析結果
EmailAnalysisResult   // 信件分析結果
```

#### 執行結果型別
```typescript
FilterExecutionResult // 篩選執行結果
```

### 使用方法（Usage）

#### 1. 建立篩選條件
```typescript
import { FilterCondition, FilterRule } from '@/types/filter';

const jobKeywordCondition: FilterCondition = {
  type: 'keyword',
  operator: 'contains',
  value: ['job', 'career', 'interview'],
  weight: 8
};

const professionalDomainCondition: FilterCondition = {
  type: 'domain',
  operator: 'in',
  value: ['linkedin.com', 'indeed.com'],
  weight: 9
};
```

#### 2. 組合篩選規則
```typescript
const workingModeRule: FilterRule = {
  id: 'working-comprehensive',
  name: '工作模式綜合篩選',
  conditions: [jobKeywordCondition, professionalDomainCondition],
  logic: 'OR',
  enabled: true,
  priority: 10,
  createdAt: new Date(),
  updatedAt: new Date()
};
```

#### 3. 處理分析結果
```typescript
import { EmailAnalysisResult } from '@/types/filter';

function processAnalysisResult(result: EmailAnalysisResult) {
  const { scores, recommendations } = result;
  
  console.log(`相關性分數: ${scores.relevanceScore}`);
  console.log(`建議動作: ${recommendations.action}`);
  console.log(`信心度: ${recommendations.confidence}`);
  
  // 根據分數決定處理方式
  if (scores.spamScore > 0.8) {
    return 'delete';
  } else if (scores.relevanceScore > 0.7) {
    return 'keep';
  }
  return 'review';
}
```

#### 4. 使用預設規則
```typescript
import { DEFAULT_FILTER_RULES } from '@/types/filter';

// 獲取特定模式的預設規則
const workingRules = DEFAULT_FILTER_RULES.working;
const shoppingRules = DEFAULT_FILTER_RULES.shopping;
```

### 篩選系統特性（Highlights）

- **多層級篩選**：支援關鍵字、域名、內容、頻率等多種篩選條件
- **權重系統**：每個條件可設定權重，影響最終評分
- **邏輯組合**：支援 AND/OR 邏輯組合複雜篩選規則
- **智慧分析**：提供域名分析、內容分析、頻率分析等智慧功能
- **評分機制**：為每封信件提供多維度評分（相關性、信任度、垃圾信機率等）

---

## 型別系統整體架構（Architecture）

### 資料流向（Data flow）

```
Gmail API Response (gmail.ts)
         ↓
   ProcessedEmail
         ↓
   Filter Analysis (filter.ts)
         ↓
   EmailAnalysisResult
         ↓
   Mode Processing (modeSettings.ts)
         ↓
   EmailFilterResult
```

### 模組間關係（Modules）

1. **gmail.ts** 是基礎層，定義 API 介面和基本資料結構
2. **filter.ts** 是邏輯層，定義篩選規則和分析機制  
3. **modeSettings.ts** 是應用層，整合前兩者提供完整的模式功能

### 擴展性設計（Extensibility）

- **型別聯合 (Union Types)**：方便新增新的類別或狀態
- **介面繼承**：支援型別的擴展和特化
- **泛型支援**：提供靈活的型別參數化
- **預設配置**：方便快速初始化和自訂

---

## 開發指南（Guidelines）

### 1. 新增型別時的注意事項

- 保持型別命名的一致性和描述性
- 為複雜型別提供註解說明
- 考慮型別的可選性 (`?`) 和預設值
- 遵循現有的命名慣例

### 2. 使用型別的最佳實踐

```typescript
// ✅ 好的做法：完整的型別標註
import { ProcessedEmail, EmailCategory } from '@/types/gmail';

function categorizeEmail(email: ProcessedEmail): EmailCategory {
  // 實作邏輯
}

// ❌ 避免：省略型別標註
function categorizeEmail(email: any): any {
  // 失去型別安全性
}
```

### 3. 型別檢查與驗證

```typescript
// 使用型別守衛 (Type Guards)
function isValidEmail(obj: any): obj is ProcessedEmail {
  return obj && 
         typeof obj.id === 'string' &&
         typeof obj.subject === 'string' &&
         obj.date instanceof Date;
}
```

### 4. 錯誤處理模式

```typescript
import { GmailApiResult } from '@/types/gmail';

async function safeApiCall<T>(apiCall: () => Promise<T>): Promise<GmailApiResult<T>> {
  try {
    const data = await apiCall();
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: {
        code: 500,
        message: error.message,
        status: 'INTERNAL_ERROR'
      }
    };
  }
}
```

---

## 總結

這套型別定義系統為 Gmail Cleaner Extension 提供了：

1. **完整的型別覆蓋**：從 API 層到 UI 層的全面型別支援
2. **模組化架構**：清晰的功能分工和介面定義
3. **擴展性設計**：支援未來功能的擴展和維護
4. **開發體驗**：提供優秀的 IntelliSense 和型別檢查
5. **團隊協作**：統一的型別規範和文件說明

通過這套型別系統，團隊可以更有效率地開發和維護程式碼，同時確保程式的穩定性和可靠性。

---

## 下一步計劃

完成型別定義後，接下來將進入 Phase 1 的第二部分：**Gmail API 基礎工具實作**，將基於這些型別定義實作具體的 API 操作功能。 