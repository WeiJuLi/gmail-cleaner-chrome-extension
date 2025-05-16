import React from 'react';
import './sideBar.css';

type Props = {
  brand: string;
  email: string;
  count: number;
  logoUrl: string;
  checked: boolean;
  onToggle: () => void;
};

const SubscriptionItem: React.FC<Props> = ({ brand, email, count, logoUrl, checked, onToggle }) => {
  return (
    <div className="subscription-item">
      <div className="sender-icon">
        <img src={logoUrl} alt={brand} />
      </div>
      <div className="sender-info">
        <div className="sender-name">{brand}</div>
        <div className="sender-email">{email}</div>
      </div>
      <div className="email-count">{count}</div>
      <input type="checkbox" checked={checked} onChange={onToggle} />
    </div>
  );
};

export default SubscriptionItem;
