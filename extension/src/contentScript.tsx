import ReactDOM from 'react-dom/client';
import Sidebar from './components/sideBar'

// 1. 目標節點：整個 <body>
const targetNode: HTMLElement = document.body;
console.log("[KickYouAds] contentScript.tsx injected and running");



// 2. 觀察選項：childList 需要觀察子節點，也要觀察子節點的子樹 subtree
const config: MutationObserverInit = {
  childList: true, 
  subtree: true
};

// 3. 回呼函式
const callback: MutationCallback = (mutationsList: MutationRecord[], observer: MutationObserver) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      const targetContainer = document.querySelector('.gb_v.gb_ie.bGJ') as HTMLElement | null;
      // .gb_v gb_ie bGJ	被解析成巢狀子元素：.gb_v > gb_ie > bGJ，錯！
      // .gb_v.gb_ie.bGJ	對的寫法，表示同一個元素擁有三個 class
      
      const alreadyAdded = document.querySelector('.custom-extension-button');

      if (targetContainer && !alreadyAdded) {
        console.log('找到 Gmail 按鈕區，準備插入按鈕');

        const customButton = document.createElement('div');
        customButton.className = 'custom-extension-button';
        customButton.style.marginLeft = '8px';
        customButton.style.cursor = 'pointer';

        const img = document.createElement('img');
        img.src = chrome.runtime.getURL('icons/K.png');
        img.style.width = '30px';
        img.style.height = '30px';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '5px';

        customButton.onclick = () => {
          toggleSider();
        };

        customButton.appendChild(img);
        targetContainer.appendChild(customButton);

        // 插入成功後停止觀察，因為gmail icon bar 基本上不會變動了（避免重複插入）
        observer.disconnect();
      } else {
        console.log('沒找到 Gmail 按扭區');
      }
    }
  }
};

// 4. 建立 observer 並啟動監聽
const observer = new MutationObserver(callback);
observer.observe(targetNode, config);


// 5. 設置插入的sidebar

const SIDEBAR_ID = 'gmail-cleaner-sidebar';

function toggleSider() {

  //6. If icon clicked and tiggle exists, then close.
  const existing = document.getElementById(SIDEBAR_ID);
  if (existing) {
    existing.remove();
    return;
  }

  const container = document.createElement('div');
  container.id = SIDEBAR_ID;
  container.style.position = 'fixed';
  container.style.top = '65px';
  container.style.right = '55px';
  container.style.width = '360px';
  container.style.height = '100vh';
  container.style.backgroundColor = '#fff';
  container.style.zIndex = '999999';
  container.style.boxShadow =  '0 2px 4px 4px rgba(229, 192, 192, 0.25)';
  container.style.borderRadius = '15px';

  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(<Sidebar/>);
}

