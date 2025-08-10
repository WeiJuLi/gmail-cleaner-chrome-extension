// Gmail Page Filter - Hide/show Gmail threads in-page based on active modes.
// It listens to modeManager changes and DOM mutations to keep the view filtered.
import { modeManager } from './modeManager';

interface EmailRowInfo {
  element: HTMLElement;
  fromEmail: string;
  fromName: string;
  subject: string;
  isVisible: boolean;
}

class GmailPageFilter {
  private isActive: boolean = false;
  private emailRows: EmailRowInfo[] = [];
  private observer: MutationObserver | null = null;
  private filterStatusElement: HTMLElement | null = null;

  constructor() {
    // 監聽 mode 設定變化
    modeManager.addListener(() => {
      this.handleModeSettingsChange();
    });
  }

  /**
   * 處理 mode 設定變化
   */
  private handleModeSettingsChange(): void {
    const activeModes = modeManager.getActiveModes();
    
    if (activeModes.length > 0) {
      if (!this.isActive) {
        this.startFiltering();
      } else {
        this.applyFilters();
      }
    } else {
      if (this.isActive) {
        this.stopFiltering();
      }
    }
  }

  /**
   * 開始篩選
   */
  private startFiltering(): void {
    console.log('🔍 Starting Gmail page filtering...');
    this.isActive = true;
    
    // 創建狀態指示器
    this.createFilterStatusIndicator();
    
    // 開始監控 Gmail 頁面變化
    this.startObserving();
    
    // 立即掃描現有的 email
    this.scanExistingEmails();
    
    // 應用篩選
    this.applyFilters();
  }

  /**
   * 停止篩選
   */
  private stopFiltering(): void {
    console.log('🛑 Stopping Gmail page filtering...');
    this.isActive = false;
    
    // 停止觀察
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // 移除狀態指示器
    if (this.filterStatusElement) {
      this.filterStatusElement.remove();
      this.filterStatusElement = null;
    }
    
    // 顯示所有隱藏的 email
    this.showAllEmails();
    
    // 清空 email 列表
    this.emailRows = [];
  }

  /**
   * 創建篩選狀態指示器
   */
  private createFilterStatusIndicator(): void {
    // 移除現有的指示器
    if (this.filterStatusElement) {
      this.filterStatusElement.remove();
    }

    const activeModes = modeManager.getActiveModes();
    if (activeModes.length === 0) return;

    const indicator = document.createElement('div');
    indicator.id = 'gmail-filter-status';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #ffb6e6, #ff8ec7);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(255, 182, 230, 0.3);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    const modeText = activeModes.map(mode => {
      switch (mode) {
        case 'working': return '💼 Working';
        case 'shopping': return '🛍️ Shopping';
        case 'jobHunting': return '🔍 Job Hunting';
        default: return mode;
      }
    }).join(' + ');
    
    indicator.textContent = `🎯 Filter Active: ${modeText}`;
    
    document.body.appendChild(indicator);
    this.filterStatusElement = indicator;
  }

  /**
   * 開始監控 Gmail 頁面變化
   */
  private startObserving(): void {
    // 停止現有的觀察器
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      let needsUpdate = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // 檢查是否有新的 email 行被添加
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              if (this.isEmailRow(element)) {
                needsUpdate = true;
                break;
              }
              // 也檢查子元素
              const emailRows = element.querySelectorAll(this.getEmailRowSelector());
              if (emailRows.length > 0) {
                needsUpdate = true;
                break;
              }
            }
          }
        }
      }
      
      if (needsUpdate) {
        // 延遲更新，避免過於頻繁的掃描
        setTimeout(() => {
          this.scanExistingEmails();
          this.applyFilters();
        }, 500);
      }
    });

    // 觀察整個 Gmail 主要內容區域
    const gmailContent = document.querySelector('[role="main"]') || document.body;
    this.observer.observe(gmailContent, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 獲取 email 行的選擇器
   */
  private getEmailRowSelector(): string {
    // Gmail 的 email 行有多種可能的選擇器
    return [
      'tr[jsaction*="click"]',  // 主要的 email 行
      '[role="listitem"]',      // 新版 Gmail
      '.zA',                    // 經典選擇器
      '[data-legacy-thread-id]' // 包含 thread ID 的元素
    ].join(', ');
  }

  /**
   * 檢查元素是否為 email 行
   */
  private isEmailRow(element: HTMLElement): boolean {
    // 檢查多種可能的 email 行特徵
    return (
      element.matches(this.getEmailRowSelector()) ||
      element.querySelector('[email]') !== null ||
      element.querySelector('[title*="@"]') !== null ||
      (element.tagName === 'TR' && element.querySelector('td[role="gridcell"]') !== null)
    );
  }

  /**
   * 掃描現有的 emails
   */
  private scanExistingEmails(): void {
    const emailElements = document.querySelectorAll(this.getEmailRowSelector());
    console.log(`📊 Found ${emailElements.length} email elements`);

    this.emailRows = [];

    emailElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const emailInfo = this.extractEmailInfo(htmlElement);
      
      if (emailInfo) {
        this.emailRows.push({
          element: htmlElement,
          fromEmail: emailInfo.fromEmail,
          fromName: emailInfo.fromName,
          subject: emailInfo.subject,
          isVisible: true
        });
      }
    });

    console.log(`📧 Extracted info from ${this.emailRows.length} emails`);
  }

  /**
   * 從 email 元素中提取資訊
   */
  private extractEmailInfo(element: HTMLElement): { fromEmail: string; fromName: string; subject: string } | null {
    try {
      // 嘗試多種方法提取 email 資訊
      let fromEmail = '';
      let fromName = '';
      let subject = '';

      // 方法 1: 尋找 email 屬性
      const emailElement = element.querySelector('[email]');
      if (emailElement) {
        fromEmail = emailElement.getAttribute('email') || '';
      }

      // 方法 2: 尋找包含 @ 的 title 屬性
      if (!fromEmail) {
        const titleElements = element.querySelectorAll('[title*="@"]');
        for (const titleElement of titleElements) {
          const title = titleElement.getAttribute('title') || '';
          const emailMatch = title.match(/([^<>\s]+@[^<>\s]+)/);
          if (emailMatch) {
            fromEmail = emailMatch[1];
            break;
          }
        }
      }

      // 方法 3: 在文本內容中尋找 email
      if (!fromEmail) {
        const textContent = element.textContent || '';
        const emailMatch = textContent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          fromEmail = emailMatch[1];
        }
      }

      // 提取發件人名稱
      const nameElement = element.querySelector('[name][title]') || 
                          element.querySelector('.yW span[title]') ||
                          element.querySelector('.yX span[title]');
      if (nameElement) {
        fromName = nameElement.getAttribute('title') || nameElement.textContent || '';
      }

      // 提取主題
      const subjectElement = element.querySelector('[data-thread-id]') ||
                            element.querySelector('.bog') ||
                            element.querySelector('.y6 span[title]');
      if (subjectElement) {
        subject = subjectElement.getAttribute('title') || subjectElement.textContent || '';
      }

      if (fromEmail) {
        return {
          fromEmail: fromEmail.toLowerCase(),
          fromName: fromName.trim(),
          subject: subject.trim()
        };
      }

      return null;
    } catch (error) {
      console.warn('⚠️ Failed to extract email info:', error);
      return null;
    }
  }

  /**
   * 應用篩選規則
   */
  private applyFilters(): void {
    if (!this.isActive) return;

    const activeModes = modeManager.getActiveModes();
    if (activeModes.length === 0) {
      this.showAllEmails();
      return;
    }

    let visibleCount = 0;
    let hiddenCount = 0;

    this.emailRows.forEach((emailRow) => {
      let shouldShow = false;

      // 檢查是否匹配任何啟用的模式
      for (const mode of activeModes) {
        const relevantEmails = modeManager.getAllRelevantEmails(mode);
        
        // 檢查發件人 email 是否匹配
        const isMatch = relevantEmails.some(relevantEmail => {
          const normalizedRelevant = relevantEmail.toLowerCase();
          const normalizedFrom = emailRow.fromEmail;
          
          return normalizedFrom.includes(normalizedRelevant) || 
                 normalizedRelevant.includes(normalizedFrom) ||
                 normalizedFrom === normalizedRelevant;
        });

        if (isMatch) {
          shouldShow = true;
          break;
        }
      }

      // 顯示或隱藏 email
      if (shouldShow) {
        this.showEmail(emailRow);
        visibleCount++;
      } else {
        this.hideEmail(emailRow);
        hiddenCount++;
      }
    });

    console.log(`📊 Filtering results: ${visibleCount} visible, ${hiddenCount} hidden`);
    
    // 更新狀態指示器
    this.updateFilterStatusIndicator(visibleCount, hiddenCount);
  }

  /**
   * 顯示 email
   */
  private showEmail(emailRow: EmailRowInfo): void {
    if (!emailRow.isVisible) {
      emailRow.element.style.display = '';
      emailRow.element.style.opacity = '1';
      emailRow.isVisible = true;
    }
  }

  /**
   * 隱藏 email
   */
  private hideEmail(emailRow: EmailRowInfo): void {
    if (emailRow.isVisible) {
      emailRow.element.style.display = 'none';
      emailRow.isVisible = false;
    }
  }

  /**
   * 顯示所有 emails
   */
  private showAllEmails(): void {
    this.emailRows.forEach((emailRow) => {
      this.showEmail(emailRow);
    });
  }

  /**
   * 更新篩選狀態指示器
   */
  private updateFilterStatusIndicator(visibleCount: number, hiddenCount: number): void {
    if (this.filterStatusElement) {
      const activeModes = modeManager.getActiveModes();
      const modeText = activeModes.map(mode => {
        switch (mode) {
          case 'working': return '💼 Working';
          case 'shopping': return '🛍️ Shopping';
          case 'jobHunting': return '🔍 Job Hunting';
          default: return mode;
        }
      }).join(' + ');
      
      this.filterStatusElement.textContent = 
        `🎯 ${modeText} | 📧 Showing ${visibleCount} emails (${hiddenCount} hidden)`;
    }
  }

  /**
   * 手動重新掃描和篩選
   */
  public refresh(): void {
    if (this.isActive) {
      this.scanExistingEmails();
      this.applyFilters();
    }
  }

  /**
   * 獲取當前狀態
   */
  public getStatus(): { isActive: boolean; emailCount: number; visibleCount: number } {
    const visibleCount = this.emailRows.filter(row => row.isVisible).length;
    return {
      isActive: this.isActive,
      emailCount: this.emailRows.length,
      visibleCount
    };
  }
}

// 單例模式
export const gmailPageFilter = new GmailPageFilter(); 