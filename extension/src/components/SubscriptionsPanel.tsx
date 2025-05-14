import React from 'react';

const SubscriptionsPanel: React.FC = () => {
  return (
    <div className="subscriptions-tab">
      <div className="search-bar">
        <input type="text" placeholder="Search..." />
        <span className="search-icon">🔍</span>
      </div>

      <div className="subscription-list">
        <div className="subscription-item selected">
          <div className="sender-icon" />
          <div className="sender-info">
            <div className="sender-name">SHEIM</div>
            <div className="sender-email">sheim@email.com</div>
          </div>
          <div className="email-count">999</div>
          <input type="checkbox" checked readOnly />
        </div>

        <div className="subscription-item">
          <div className="sender-icon" />
          <div className="sender-info">
            <div className="sender-name">Apolo</div>
            <div className="sender-email">apolo@email.com</div>
          </div>
          <div className="email-count">734</div>
          <input type="checkbox" />
        </div>

        <div className="subscription-item">
          <div className="sender-icon" />
          <div className="sender-info">
            <div className="sender-name">Apolo</div>
            <div className="sender-email">apolo@email.com</div>
          </div>
          <div className="email-count">734</div>
          <input type="checkbox" />
        </div>
      </div>
      <div className="action-buttons">
        <button className="unsubscribe-btn">Unsubscribe</button>
        <button className="delete-btn">Delete</button>
      </div>
    </div>
  );
};

export default SubscriptionsPanel;
