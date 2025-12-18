import ReactDOM from "react-dom/client";
import Sidebar from "./components/sideBar";

// 1. 目標節點：整個 <body>
const targetNode: HTMLElement = document.body;
console.log("[KickYouAds] contentScript.tsx injected and running");

// Gmail 按鈕區的多種可能選擇器（Gmail 經常更新其 DOM 結構）
const GMAIL_BUTTON_SELECTORS = [
  ".gb_v.gb_ie.bGJ", // 舊版選擇器
  ".gb_v.gb_ie", // 簡化版本
  ".gb_v", // 更簡化版本
  '[role="banner"] .gb_v', // 使用 role 屬性
  ".gb_Qe.gb_h", // 新版可能的選擇器
  ".gb_Qe", // 新版簡化
  ".gb_h", // 另一種可能
  "header .gb_v", // 在 header 中尋找
  "[data-ved] .gb_v", // 使用 data 屬性
  ".gb_Tc.gb_Uc.gb_Vc", // 另一種可能的組合
];

// 2. 觀察選項：childList 需要觀察子節點，也要觀察子節點的子樹 subtree
const config: MutationObserverInit = {
  childList: true,
  subtree: true,
};

// 尋找 Gmail 按鈕區的函數
function findGmailButtonContainer(): HTMLElement | null {
  // 嘗試所有可能的選擇器
  for (const selector of GMAIL_BUTTON_SELECTORS) {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (element) {
      console.log(`[KickYouAds] 找到 Gmail 按鈕區，使用選擇器: ${selector}`);
      return element;
    }
  }

  // 如果都找不到，嘗試通用的方法
  const fallbackSelectors = [
    'div[role="banner"]',
    "header",
    ".gb_g",
    ".gb_i",
    '[class*="gb_"]',
  ];

  for (const selector of fallbackSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      // 檢查元素是否看起來像按鈕容器（有一定的寬度和高度）
      const rect = element.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 30 && rect.top < 100) {
        console.log(`[KickYouAds] 使用備用選擇器找到容器: ${selector}`);
        return element as HTMLElement;
      }
    }
  }

  return null;
}

// 檢查是否已經添加了按鈕
function isButtonAlreadyAdded(): boolean {
  return !!document.querySelector(".custom-extension-button");
}

// 創建自定義按鈕
function createCustomButton(): HTMLElement {
  const customButton = document.createElement("div");
  customButton.className = "custom-extension-button";
  customButton.style.marginLeft = "8px";
  customButton.style.cursor = "pointer";
  customButton.style.display = "inline-flex";
  customButton.style.alignItems = "center";
  customButton.style.justifyContent = "center";
  customButton.style.padding = "4px";
  customButton.style.borderRadius = "4px";
  customButton.style.transition = "background-color 0.2s";

  // 加入 hover 效果
  customButton.onmouseenter = () => {
    customButton.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
  };
  customButton.onmouseleave = () => {
    customButton.style.backgroundColor = "transparent";
  };

  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("icons/K.png");
  img.style.width = "30px";
  img.style.height = "30px";
  img.style.objectFit = "contain";
  img.style.borderRadius = "5px";
  img.alt = "Gmail Cleaner";
  img.title = "Gmail Cleaner - Open email management tool";

  customButton.onclick = () => {
    toggleSider();
  };

  customButton.appendChild(img);
  return customButton;
}

// 嘗試插入按鈕
function tryInsertButton(): boolean {
  if (isButtonAlreadyAdded()) {
    console.log("[KickYouAds] 按鈕已存在，跳過插入");
    return true;
  }

  const targetContainer = findGmailButtonContainer();

  if (targetContainer) {
    console.log("[KickYouAds] 找到 Gmail 按鈕區，準備插入按鈕");

    const customButton = createCustomButton();
    targetContainer.appendChild(customButton);

    console.log("[KickYouAds] 按鈕插入成功");
    return true;
  } else {
    // 更詳細的調試資訊
    console.log("[KickYouAds] 沒找到 Gmail 按鈕區");
    console.log("[KickYouAds] 當前頁面 URL:", window.location.href);
    console.log("[KickYouAds] 頁面標題:", document.title);

    // 列出頁面中所有可能相關的元素
    const possibleElements = document.querySelectorAll('[class*="gb_"]');
    console.log(
      `[KickYouAds] 找到 ${possibleElements.length} 個可能相關的元素`
    );

    if (possibleElements.length > 0) {
      console.log("[KickYouAds] 前5個元素的類名:");
      Array.from(possibleElements)
        .slice(0, 5)
        .forEach((el, index) => {
          console.log(`  ${index + 1}. ${el.className}`);
        });
    }

    return false;
  }
}

// 3. 回呼函式
const callback: MutationCallback = (
  mutationsList: MutationRecord[],
  observer: MutationObserver
) => {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      const success = tryInsertButton();

      if (success) {
        // 插入成功後停止觀察，避免重複插入
        observer.disconnect();
        console.log("[KickYouAds] 停止 DOM 觀察");
        break;
      }
    }
  }
};

// 4. 建立 observer 並啟動監聽
const observer = new MutationObserver(callback);
observer.observe(targetNode, config);

// 5. 立即嘗試一次插入（如果頁面已經載入完成）
setTimeout(() => {
  console.log("[KickYouAds] 立即嘗試插入按鈕");
  const success = tryInsertButton();
  if (success) {
    observer.disconnect();
    console.log("[KickYouAds] 立即插入成功，停止觀察");
  }
}, 1000);

// 6. 設置插入的sidebar
const SIDEBAR_ID = "gmail-cleaner-sidebar";

function toggleSider() {
  console.log("[KickYouAds] 切換側邊欄");

  // 如果已存在則關閉
  const existing = document.getElementById(SIDEBAR_ID);
  if (existing) {
    console.log("[KickYouAds] 關閉側邊欄");
    existing.remove();
    return;
  }

  console.log("[KickYouAds] 開啟側邊欄");
  const container = document.createElement("div");
  container.id = SIDEBAR_ID;
  container.style.position = "fixed";
  container.style.top = "65px";
  container.style.right = "55px";
  container.style.width = "360px";
  container.style.height = "calc(100vh - 70px)";
  container.style.backgroundColor = "#fff";
  container.style.zIndex = "999999";
  container.style.boxShadow = "0 2px 4px 4px rgba(229, 192, 192, 0.25)";
  container.style.borderRadius = "15px";
  container.style.overflow = "hidden";

  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(<Sidebar />);
}
