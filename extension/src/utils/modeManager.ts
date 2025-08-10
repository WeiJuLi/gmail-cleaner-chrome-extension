// Mode Manager - Manage per-mode state and whitelists for page filtering.
// Stores settings in chrome.storage.local and notifies listeners on change.
export type ModeType = 'working' | 'shopping' | 'jobHunting';

export interface ModeSettings {
  enabled: boolean;
  detectedEmails: string[]; // 自動檢測到的相關 email 地址
  whiteListEmails: string[]; // 用戶手動添加的 email 地址
  lastUpdated: number;
}

export interface AllModeSettings {
  working: ModeSettings;
  shopping: ModeSettings;
  jobHunting: ModeSettings;
}

const STORAGE_KEY = 'gmail_cleaner_mode_settings';

class ModeManager {
  private settings: AllModeSettings;
  private listeners: Set<(settings: AllModeSettings) => void> = new Set();

  constructor() {
    this.settings = {
      working: {
        enabled: false,
        detectedEmails: [],
        whiteListEmails: [],
        lastUpdated: 0
      },
      shopping: {
        enabled: false,
        detectedEmails: [],
        whiteListEmails: [],
        lastUpdated: 0
      },
      jobHunting: {
        enabled: false,
        detectedEmails: [],
        whiteListEmails: [],
        lastUpdated: 0
      }
    };
    
    this.loadFromStorage();
  }

  /**
   * 載入設定從 Chrome Storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      if (result[STORAGE_KEY]) {
        this.settings = { ...this.settings, ...result[STORAGE_KEY] };
        console.log('📂 Mode settings loaded from storage:', this.settings);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('❌ Failed to load mode settings:', error);
    }
  }

  /**
   * 儲存設定到 Chrome Storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEY]: this.settings
      });
      console.log('💾 Mode settings saved to storage');
    } catch (error) {
      console.error('❌ Failed to save mode settings:', error);
    }
  }

  /**
   * 通知所有監聽器狀態變化
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.settings);
      } catch (error) {
        console.error('❌ Error in mode settings listener:', error);
      }
    });
  }

  /**
   * 添加狀態變化監聽器
   */
  addListener(listener: (settings: AllModeSettings) => void): void {
    this.listeners.add(listener);
    // 立即觸發一次，提供當前狀態
    listener(this.settings);
  }

  /**
   * 移除狀態變化監聽器
   */
  removeListener(listener: (settings: AllModeSettings) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * 獲取所有模式設定
   */
  getAllSettings(): AllModeSettings {
    return { ...this.settings };
  }

  /**
   * 獲取特定模式設定
   */
  getModeSettings(mode: ModeType): ModeSettings {
    return { ...this.settings[mode] };
  }

  /**
   * 設定模式開關狀態
   */
  async setModeEnabled(mode: ModeType, enabled: boolean): Promise<void> {
    this.settings[mode].enabled = enabled;
    this.settings[mode].lastUpdated = Date.now();
    await this.saveToStorage();
    this.notifyListeners();
    console.log(`🔄 Mode ${mode} ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 更新檢測到的 emails
   */
  async updateDetectedEmails(mode: ModeType, emails: string[]): Promise<void> {
    this.settings[mode].detectedEmails = [...emails];
    this.settings[mode].lastUpdated = Date.now();
    await this.saveToStorage();
    this.notifyListeners();
    console.log(`📧 Updated detected emails for ${mode}:`, emails);
  }

  /**
   * 添加手動 email 到白名單
   */
  async addWhiteListEmail(mode: ModeType, email: string): Promise<boolean> {
    if (!email || !/.+@.+\..+/.test(email)) {
      console.warn('❌ Invalid email format:', email);
      return false;
    }

    if (this.settings[mode].whiteListEmails.includes(email)) {
      console.warn('⚠️ Email already in whitelist:', email);
      return false;
    }

    this.settings[mode].whiteListEmails.push(email);
    this.settings[mode].lastUpdated = Date.now();
    await this.saveToStorage();
    this.notifyListeners();
    console.log(`✅ Added email to ${mode} whitelist:`, email);
    return true;
  }

  /**
   * 從白名單移除 email
   */
  async removeWhiteListEmail(mode: ModeType, email: string): Promise<boolean> {
    const index = this.settings[mode].whiteListEmails.indexOf(email);
    if (index === -1) {
      console.warn('⚠️ Email not found in whitelist:', email);
      return false;
    }

    this.settings[mode].whiteListEmails.splice(index, 1);
    this.settings[mode].lastUpdated = Date.now();
    await this.saveToStorage();
    this.notifyListeners();
    console.log(`🗑️ Removed email from ${mode} whitelist:`, email);
    return true;
  }

  /**
   * 獲取所有相關 emails（檢測的 + 白名單）
   */
  getAllRelevantEmails(mode: ModeType): string[] {
    const settings = this.settings[mode];
    const allEmails = [...settings.detectedEmails, ...settings.whiteListEmails];
    // 去重並返回
    return [...new Set(allEmails)];
  }

  /**
   * 檢查某個 email 是否在當前啟用的模式中
   */
  isEmailRelevantToActiveMode(email: string): { isRelevant: boolean; mode?: ModeType } {
    const normalizedEmail = email.toLowerCase();
    
    for (const mode of ['working', 'shopping', 'jobHunting'] as ModeType[]) {
      if (this.settings[mode].enabled) {
        const relevantEmails = this.getAllRelevantEmails(mode);
        if (relevantEmails.some(relevantEmail => 
          normalizedEmail.includes(relevantEmail.toLowerCase()) || 
          relevantEmail.toLowerCase().includes(normalizedEmail)
        )) {
          return { isRelevant: true, mode };
        }
      }
    }
    
    return { isRelevant: false };
  }

  /**
   * 獲取當前啟用的模式
   */
  getActiveModes(): ModeType[] {
    return (Object.keys(this.settings) as ModeType[])
      .filter(mode => this.settings[mode].enabled);
  }

  /**
   * 清除特定模式的所有資料
   */
  async clearModeData(mode: ModeType): Promise<void> {
    this.settings[mode] = {
      enabled: false,
      detectedEmails: [],
      whiteListEmails: [],
      lastUpdated: Date.now()
    };
    await this.saveToStorage();
    this.notifyListeners();
    console.log(`🧹 Cleared all data for ${mode} mode`);
  }
}

// 單例模式
export const modeManager = new ModeManager(); 