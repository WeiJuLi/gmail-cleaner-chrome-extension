/**
 * SwitchButton 組件
 * 
 * 這是一個可重用的開關按鈕組件，具有以下特點：
 * 1. 支持自定義初始狀態
 * 2. 支持狀態變化回調
 * 3. 支持可選的標籤文字
 * 4. 包含平滑的過渡動畫
 */

import { useState } from 'react';
import '../styles/SwitchButton.css';
/**
 * 組件的 Props 介面定義
 * @interface SwitchButtonProps
 * @property {boolean} [initialValue] - 開關的初始狀態，可選
 * @property {function} [onChange] - 狀態改變時的回調函數，可選
 * @property {string} [label] - 按鈕的標籤文字，可選
 */

// 運用 interface 清楚定義：屬性的名稱、屬性的類型、是否為可選（使用 ? 標記）
interface SwitchButtonProps {
  initialValue?: boolean;
  onChange?: (value: boolean) => void;
  label?: string;
}


/**
 * SwitchButton 組件實現
 * 使用 React.FC 類型定義，並指定 props 的類型為 SwitchButtonProps
 */
const SwitchButton: React.FC<SwitchButtonProps> = ({ 
  initialValue = false,  // 預設值為 false
  onChange,             // 狀態變化回調函數
  label                 // 可選的標籤文字
}) => {
  // 使用 useState Hook 管理開關狀態
  const [isOn, setIsOn] = useState(initialValue);

  /**
   * 處理開關切換事件
   * 更新狀態並調用 onChange 回調（如果提供）
   */
  const handleToggle = () => {
    const newValue = !isOn;        // 切換狀態
    setIsOn(newValue);            // 更新狀態
    onChange?.(newValue);         // 通知外部
  };

  return (
    // 最外層容器：使用 flex 布局，垂直居中對齊，元素間距為 2
    <div className="flex items-center gap-2">
      {/* 條件渲染標籤：只有當 label 存在時才顯示 */}
      {label && <span className="text-sm">{label}</span>}
      
      {/* 開關按鈕：使用 button 元素實現 */}
      <button
        type="button"           // 告訴瀏覽器這是一個按鈕
        role="switch"           // 告訴螢幕閱讀器這是一個開關
        aria-checked={isOn}     // 告訴螢幕閱讀器開關的狀態
        onClick={handleToggle}  // 當按鈕被點擊時要做的事
        className={`
            w-12 h-7 flex items-center rounded-full p-1
            transition-colors duration-200
            ${isOn ? 'bg-blue-500' : 'bg-gray-300'}
          `}
      >
        {/* 開關滑塊：使用 span 元素實現 */}
        <span
          className={`
            w-5 h-5 bg-white rounded-full shadow-md transform
            transition-transform duration-200
            ${isOn ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

export default SwitchButton; 