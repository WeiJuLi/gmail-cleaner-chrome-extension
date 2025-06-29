import React, { useEffect, useState } from "react";
import "./sideBar.css";
import SubscriptionsPanel from "./SubscriptionsPanel";
import ModeSettingsPanel from "./ModeSettingsPanel";

// This is a reusable function to load your Custom Font
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
  // Login
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  //Tab <'subscriptions' | 'mode' 裡面只接受這兩種值> 預設 'subscriptions'
  const [activeTab, setActiveTab] = useState<"subscriptions" | "mode">(
    "subscriptions"
  );

  useEffect(() => {
    loadCustomFont("Dela Gothic One", "fonts/DelaGothicOne-Regular.ttf");
    // keep adding another custon fonts...

    // check wether local storage has access token
    chrome.storage.local.get(["accessToken"], (result) => {
      if (result.accessToken) {
        setIsLoggedIn(true);
      }
    });

    // 2. 監聽 storage 當 accessToken 被改變（新增或刪除）時自動更新狀態
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && "accessToken" in changes) {
        const newValue = changes.accessToken?.newValue;
        setIsLoggedIn(!!newValue); // 有值 => true，沒值 => false
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
          <p>Please login with Google to continue.❤️</p>
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
