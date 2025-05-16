import React from 'react';
import SwitchButton from './SwitchButton';

// React.FC 是 React.FunctionComponent 的簡寫，提供了預設的類型定義
const ModeSettingsPanel: React.FC = () => {
    return (
        <div className="mode-settings-tab">
            <div className="mode-settings-header">
                <h3>Choose Mode you like</h3>
            </div>
            <div className="mode-settings-content">
                <div className="mode-1">
                    <h2>Working</h2>
                    <p>Focus on Work!</p>
                    <SwitchButton />
                </div>
                <div className="mode-2">
                    <h2>Shopping</h2>
                    <p>See all the promotions!</p>
                    <SwitchButton />
                </div>
                <div className="mode-3">
                    <h2>Job Hunting</h2>
                    <p>Tracking for future jobs!</p>
                    <SwitchButton />
                </div>
            </div>
        </div>
    );
};

export default ModeSettingsPanel;