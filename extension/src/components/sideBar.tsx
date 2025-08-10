import React, { useEffect, useState } from "react";
import "./sideBar.css";
import SubscriptionsPanel from "./SubscriptionsPanel";
import ModeSettingsPanel from "./ModeSettingsPanel";

// This is a reusable function to load your Custom Font
// UI language: English only. Update copy below if localization is added later.
// format = 'truetype' 參數的預設值
// 這是 JavaScript 中的模板字串語法: '${fontName}'
// `` 支援多行, '' 支援單行
// textContext等同於設定<style>標籤裡面的text文字，等同如下格式
{
  /* <style>
  @font-face {
    font-family: 'Dela Gothic One';
    src: url('chrome-extension://xxx/fonts/DelaGothicOne-Regular.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
</style> */
}
// loadedFonts 避免重複載入相同的字體
const loadedFonts = new Set<string>();

export function loadCustomFont(
  fontName: string,
  filePath: string,
  format = "truetype"
) {
  if (loadedFonts.has(fontName)) return;
  const fontURL = chrome.runtime.getURL(filePath);
  const style = document.createElement("style");
  style.textContent = `
    @font-face {
      font-family: '${fontName}';
      src: url('${fontURL}') format('${format}');
      font-weight: normal;
      font-style: normal;
    }
  `;
  document.head.appendChild(style);
  loadedFonts.add(fontName);
}

const Sidebar: React.FC = () => {
  // Login state derived from storage keys used by tokenManager/background
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  //Tab <'subscriptions' | 'mode' 裡面只接受這兩種值> 預設 'subscriptions'
  const [activeTab, setActiveTab] = useState<"subscriptions" | "mode">(
    "subscriptions"
  );

  useEffect(() => {
    loadCustomFont("Dela Gothic One", "fonts/DelaGothicOne-Regular.ttf");
    // keep adding another custon fonts...

    // Check if a valid access token exists (must match tokenManager storage keys)
    chrome.storage.local.get(["gmail_access_token", "gmail_token_expires_at"], (result) => {
      const hasToken = !!result.gmail_access_token;
      const expiresAt = result.gmail_token_expires_at ? parseInt(result.gmail_token_expires_at) : 0;
      const isExpired = expiresAt <= Date.now();
      
      console.log('🔐 檢查認證狀態:', {
        hasToken,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : 'N/A',
        isExpired
      });
      
      setIsLoggedIn(hasToken && !isExpired);
    });

    // 2) Listen for storage changes to keep login UI in sync
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && ("gmail_access_token" in changes || "gmail_token_expires_at" in changes)) {
        const accessTokenChange = changes.gmail_access_token;
        const expiresAtChange = changes.gmail_token_expires_at;
        
        // 取得最新的值
        const newToken = accessTokenChange?.newValue;
        const newExpiresAt = expiresAtChange?.newValue ? parseInt(expiresAtChange.newValue) : 0;
        const isExpired = newExpiresAt <= Date.now();
        
        console.log('🔄 Storage 變更:', {
          hasToken: !!newToken,
          expiresAt: newExpiresAt ? new Date(newExpiresAt).toISOString() : 'N/A',
          isExpired
        });
        
        setIsLoggedIn(!!newToken && !isExpired);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleSideBarClose = () => {
    const sideBarElement = document.getElementById("gmail-cleaner-sidebar");
    if (sideBarElement) {
      sideBarElement.remove();
    }
  };

  const handleLogin = () => {
    chrome.runtime.sendMessage({ action: "start-oauth" });
  };

  return (
    <div className="kickyouads-container">
      {/* Row 1 */}
      <div className="kickyouads-header">
        <div className="logo-title">
          {/* chrome.runtime.getURL 是 chrome extension特有的檔案讀取方式，請見 https://hackmd.io/irGikO4YRsKH6B8gSskc2w?view=&stext=1516%3A21%3A0%3A1747161282%3AEvwP9z */}
          <div className="logo">
            <img src={chrome.runtime.getURL("icons/K.png")}></img>
          </div>
          <div className="title" style={{ fontFamily: "Dela Gothic One" }}>
            Kick You Ads
          </div>
        </div>
        <div className="settings-close-btn">
          <button className="settings-btn">🛠️</button>
          <button className="close-btn" onClick={handleSideBarClose}>
            ✖️
          </button>
        </div>
      </div>

      {/* Content */}
      {!isLoggedIn ? (
        <div className="login-section">
           <p>Please log in with Google to continue. ❤️</p>
          <button className="login-btn" onClick={handleLogin}>
            Login with Google
          </button>
        </div>
      ) : (
        <>
          {/* Tab Switch */}
          <div className="tab-switch">
            <div className={`tab-slider ${activeTab}`}></div>
            <div
              className={`tab ${activeTab === "subscriptions" ? "active" : ""}`}
              onClick={() => setActiveTab("subscriptions")}
            >
             <span className="tab-label">Subscriptions</span>
            </div>
            <div
              className={`tab ${activeTab === "mode" ? "active" : ""}`}
              onClick={() => setActiveTab("mode")}
            >
             <span className="tab-label">Mode Settings</span>
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === "subscriptions" && <SubscriptionsPanel />}
            {activeTab === "mode" && <ModeSettingsPanel />}
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
