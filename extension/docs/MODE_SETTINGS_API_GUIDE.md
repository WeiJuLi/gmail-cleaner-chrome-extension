# Mode Settings API 使用指南

## 概述

Gmail Cleaner 的 Mode Settings 系統提供了一個完整的 API 來管理不同模式的電子郵件篩選設定。本文件詳細說明了檔案結構、設定方式以及 API 的使用方法。

## 檔案結構

### 核心檔案

```
src/utils/
├── modeManager.ts          # 模式管理核心
├── gmailPageFilter.ts      # Gmail 頁面篩選邏輯
└── index.ts               # 統一匯出介面

src/components/
└── ModeSettingsPanel.tsx  # UI 介面組件

src/contentScript.tsx      # 內容腳本整合
```

## 資料結構

### 1. 基本型別定義

```typescript
// 支援的模式類型
export type ModeType = 'working' | 'shopping' | 'jobHunting';

// 單一模式設定
export interface ModeSettings {
  enabled: boolean;           // 模式是否啟用
  detectedEmails: string[];   // 自動檢測到的相關 email 地址
  whiteListEmails: string[];  // 用戶手動添加的 email 地址
  lastUpdated: number;        // 最後更新時間戳
}

// 所有模式設定
export interface AllModeSettings {
  working: ModeSettings;
  shopping: ModeSettings;
  jobHunting: ModeSettings;
}
```

### 2. 儲存結構（Storage schema）

設定資料儲存在 Chrome Storage Local 中，使用以下結構：

```json
{
  "gmail_cleaner_mode_settings": {
    "working": {
      "enabled": true,
      "detectedEmails": [
        "hr@company.com",
        "noreply@slack.com",
        "team@project.com"
      ],
      "whiteListEmails": [
        "boss@company.com",
        "important@client.com"
      ],
      "lastUpdated": 1703123456789
    },
    "shopping": {
      "enabled": false,
      "detectedEmails": [],
      "whiteListEmails": [],
      "lastUpdated": 0
    },
    "jobHunting": {
      "enabled": false,
      "detectedEmails": [],
      "whiteListEmails": [],
      "lastUpdated": 0
    }
  }
}
```

## API 使用方式（How to use the API）

### 1. 模式管理器 (ModeManager)

#### 匯入方式

```typescript
import { modeManager, ModeType, ModeSettings, AllModeSettings } from '../utils/modeManager';
```

#### 核心方法

##### 獲取設定

```typescript
// 獲取所有模式設定
const allSettings: AllModeSettings = modeManager.getAllSettings();

// 獲取特定模式設定
const workingSettings: ModeSettings = modeManager.getModeSettings('working');

// 獲取當前啟用的模式列表
const activeModes: ModeType[] = modeManager.getActiveModes();
```

##### 模式控制

```typescript
// 啟用/停用模式
await modeManager.setModeEnabled('working', true);
await modeManager.setModeEnabled('shopping', false);

// 清除模式所有資料
await modeManager.clearModeData('working');
```

##### Email 管理

```typescript
// 更新自動檢測的 emails
const detectedEmails = ['hr@company.com', 'team@project.com'];
await modeManager.updateDetectedEmails('working', detectedEmails);

// 添加手動 email 到白名單
const success = await modeManager.addWhiteListEmail('working', 'boss@company.com');

// 從白名單移除 email
const removed = await modeManager.removeWhiteListEmail('working', 'old@company.com');

// 獲取所有相關 emails（檢測的 + 白名單）
const allRelevantEmails: string[] = modeManager.getAllRelevantEmails('working');
```

##### 狀態監聽

```typescript
// 添加狀態變化監聽器
const handleSettingsChange = (settings: AllModeSettings) => {
  console.log('設定已更新:', settings);
  // 更新 UI 或執行其他邏輯
};

modeManager.addListener(handleSettingsChange);

// 移除監聽器
modeManager.removeListener(handleSettingsChange);
```

##### Email 相關性檢查

```typescript
// 檢查某個 email 是否在當前啟用的模式中
const result = modeManager.isEmailRelevantToActiveMode('hr@company.com');
// 返回: { isRelevant: boolean; mode?: ModeType }

if (result.isRelevant) {
  console.log(`Email 屬於 ${result.mode} 模式`);
}
```

### 2. Gmail 頁面篩選器 (GmailPageFilter)

#### 匯入方式

```typescript
import { gmailPageFilter } from '../utils/gmailPageFilter';
```

#### 主要方法

```typescript
// 手動重新整理篩選
gmailPageFilter.refresh();

// 獲取當前狀態
const status = gmailPageFilter.getStatus();
// 返回: { isActive: boolean; emailCount: number; visibleCount: number }

console.log(`篩選器狀態: ${status.isActive ? '啟用' : '停用'}`);
console.log(`總共 ${status.emailCount} 封信件，顯示 ${status.visibleCount} 封`);
```

### 3. 在 React 組件中使用

#### 基本使用範例

```typescript
import React, { useState, useEffect } from 'react';
import { modeManager, ModeType } from '../utils/modeManager';

const MyComponent: React.FC = () => {
  const [workingMode, setWorkingMode] = useState(false);
  const [detectedEmails, setDetectedEmails] = useState<string[]>([]);

  useEffect(() => {
    // 載入初始設定
    const settings = modeManager.getAllSettings();
    setWorkingMode(settings.working.enabled);
    setDetectedEmails(settings.working.detectedEmails);

    // 監聽設定變化
    const handleChange = (newSettings: any) => {
      setWorkingMode(newSettings.working.enabled);
      setDetectedEmails(newSettings.working.detectedEmails);
    };

    modeManager.addListener(handleChange);

    return () => {
      modeManager.removeListener(handleChange);
    };
  }, []);

  const handleToggleMode = async (enabled: boolean) => {
    await modeManager.setModeEnabled('working', enabled);
  };

  const handleAddEmail = async (email: string) => {
    const success = await modeManager.addWhiteListEmail('working', email);
    if (success) {
      console.log('Email 已添加到白名單');
    }
  };

  return (
    <div>
      <button onClick={() => handleToggleMode(!workingMode)}>
        {workingMode ? '停用工作模式' : '啟用工作模式'}
      </button>
      
      <div>
        檢測到的 Emails:
        {detectedEmails.map(email => (
          <div key={email}>{email}</div>
        ))}
      </div>
    </div>
  );
};
```

## 進階使用（Advanced）

### 1. 批次操作

```typescript
// 批次設定多個模式
const modes: ModeType[] = ['working', 'shopping'];
for (const mode of modes) {
  await modeManager.setModeEnabled(mode, true);
}

// 批次添加 emails 到白名單
const emails = ['email1@company.com', 'email2@company.com'];
for (const email of emails) {
  await modeManager.addWhiteListEmail('working', email);
}
```

### 2. 條件篩選

```typescript
// 檢查是否有任何模式啟用
const activeModes = modeManager.getActiveModes();
if (activeModes.length > 0) {
  console.log('有模式正在啟用:', activeModes);
  gmailPageFilter.refresh(); // 重新整理篩選
}

// 根據 email 數量決定是否顯示
const workingEmails = modeManager.getAllRelevantEmails('working');
if (workingEmails.length > 0) {
  console.log(`工作模式有 ${workingEmails.length} 個相關 emails`);
}
```

### 3. 錯誤處理

```typescript
try {
  await modeManager.setModeEnabled('working', true);
} catch (error) {
  console.error('設定模式時發生錯誤:', error);
}

// 檢查 email 格式
const emailPattern = /.+@.+\..+/;
if (!emailPattern.test(email)) {
  console.warn('Email 格式不正確:', email);
  return;
}
```

### 4. 除錯和監控

```typescript
// 啟用詳細日誌
console.log('當前模式設定:', modeManager.getAllSettings());
console.log('篩選器狀態:', gmailPageFilter.getStatus());

// 監聽所有變化
modeManager.addListener((settings) => {
  console.log('設定變更日誌:', {
    timestamp: new Date().toISOString(),
    settings: settings
  });
});
```

## 最佳實踐

### 1. 性能優化

```typescript
// 避免頻繁的狀態更新
let updateTimeout: NodeJS.Timeout;
const debouncedUpdate = (callback: () => void) => {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(callback, 300);
};

// 批次處理設定變更
const batchUpdateSettings = async (updates: Array<() => Promise<void>>) => {
  for (const update of updates) {
    await update();
  }
  gmailPageFilter.refresh(); // 只在最後刷新一次
};
```

### 2. 狀態同步

```typescript
// 確保 UI 狀態與儲存狀態同步
useEffect(() => {
  const syncState = () => {
    const settings = modeManager.getAllSettings();
    // 更新所有相關的 state
    setWorkingMode(settings.working.enabled);
    setShoppingMode(settings.shopping.enabled);
    setJobHuntingMode(settings.jobHunting.enabled);
  };

  modeManager.addListener(syncState);
  syncState(); // 初始同步

  return () => modeManager.removeListener(syncState);
}, []);
```

### 3. 錯誤恢復

```typescript
// 提供設定重置功能
const resetAllSettings = async () => {
  const modes: ModeType[] = ['working', 'shopping', 'jobHunting'];
  for (const mode of modes) {
    await modeManager.clearModeData(mode);
  }
  console.log('所有設定已重置');
};

// 驗證設定完整性
const validateSettings = (settings: AllModeSettings): boolean => {
  const modes: ModeType[] = ['working', 'shopping', 'jobHunting'];
  return modes.every(mode => 
    settings[mode] && 
    typeof settings[mode].enabled === 'boolean' &&
    Array.isArray(settings[mode].detectedEmails) &&
    Array.isArray(settings[mode].whiteListEmails)
  );
};
```

## 開發工具（Developer tools）

### 手動測試命令（Manual testing）

在瀏覽器 Console 中可以使用以下命令進行測試：

```javascript
// 匯入 API (在 Extension 環境中)
// 這些變數在 contentScript 中已經可用

// 查看當前設定
console.log('Current settings:', modeManager.getAllSettings());

// 手動刷新篩選器 (或使用快捷鍵 Ctrl+Shift+F)
gmailPageFilter.refresh();

// 查看篩選器狀態
console.log('Filter status:', gmailPageFilter.getStatus());

// 測試模式切換
modeManager.setModeEnabled('working', true);
```

### 除錯指南（Debugging）

1. **檢查 Chrome Storage**：
   ```javascript
   chrome.storage.local.get('gmail_cleaner_mode_settings', (result) => {
     console.log('Storage data:', result);
   });
   ```

2. **監控狀態變化**：
   ```javascript
   modeManager.addListener((settings) => {
     console.log('Settings changed:', settings);
   });
   ```

3. **檢查篩選器運作**：
   - 確認頁面頂部是否有粉色狀態條
   - 查看 Console 中的篩選日誌
   - 使用 `Ctrl+Shift+F` 手動重新整理

## 故障排除（Troubleshooting）

### 常見問題

1. **設定沒有儲存**：
   - 檢查 Chrome Storage 權限
   - 確認 `await` 正確使用

2. **篩選器沒有作用**：
   - 確認模式已啟用
   - 檢查是否有相關 emails
   - 使用手動重新整理

3. **UI 狀態不同步**：
   - 確認監聽器正確設定
   - 檢查組件生命週期

4. **性能問題**：
   - 避免過於頻繁的 API 呼叫
   - 使用 debounce 處理狀態更新

這份指南涵蓋了 Mode Settings API 的完整使用方式，從基本操作到進階功能都有詳細說明。 