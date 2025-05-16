import React, {useState} from 'react';
import SubscriptionItem from './SubscriptionItem';
import './SubscriptionsPanel.css';

const dummyData = [
    { brand: 'SHEIM', email: 'sheim@email.com', count: 999, logoUrl: chrome.runtime.getURL('icons/K.png') },
    { brand: 'Apolo', email: 'apolo@email.com', count: 734, logoUrl: chrome.runtime.getURL('icons/K.png') },
    { brand: 'Lensb', email: 'lensb@email.com', count: 541, logoUrl: chrome.runtime.getURL('icons/K.png') },
    { brand: 'Linkedout', email: 'linkedout@email.com', count: 249, logoUrl: chrome.runtime.getURL('icons/K.png') },
    { brand: 'Linkedout', email: 'linkedout@email.com', count: 249, logoUrl: chrome.runtime.getURL('icons/K.png') },
    { brand: 'Linkedout', email: 'linkedout@email.com', count: 249, logoUrl: chrome.runtime.getURL('icons/K.png') },
    { brand: 'Linkedout', email: 'linkedout@email.com', count: 249, logoUrl: chrome.runtime.getURL('icons/K.png') },
    { brand: 'Linkedout', email: 'linkedout@email.com', count: 249, logoUrl: chrome.runtime.getURL('icons/K.png') },
  ];

const SubscriptionsPanel: React.FC = () => {
    const [checkedList, setCheckedList] = useState<boolean[]>(Array(dummyData.length).fill(false));
    // 只是 在 TypeScript 裡強制你標註「index 是數字的型態」
    const toggle = (index: number) => {
        const updated = [...checkedList];
        updated[index] = !updated[index];
        setCheckedList(updated);
    };

  return (
    <div className="subscriptions-tab">
      <div className="search-bar">
        <input type="text" placeholder="Search..." />
        <span className="search-icon">🔍</span>
      </div>
      {/* checked={true} → ✅ 勾選
      checked={false} → ☐ 沒勾選
      你用 JavaScript 的變數去「控制它目前是不是被勾起來」。 
      
      checked={checkedList[index]}
      只要 checkedList 有新的 reference（記憶體位置改變），React 就會 re-render。
      */}
      <div className="subscription-list-scrollable">
        {dummyData.map((item, index) => (
            <SubscriptionItem
            key={index}
            brand={item.brand}
            email={item.email}
            count={item.count}
            logoUrl={item.logoUrl}
            checked={checkedList[index]}
            onToggle={() => toggle(index)}
            />
        ))}
      </div>
      <div className="action-buttons">
        <button className="unsubscribe-btn">Unsubscribe</button>
        <button className="delete-btn">Delete</button>
      </div>
    </div>
  );
};

export default SubscriptionsPanel;
