import React from 'react';
import SwitchButton from './SwitchButton';
import '../styles/ModeSettingsPanel.css';

// React.FC 是 React.FunctionComponent 的簡寫，提供了預設的類型定義
const ModeSettingsPanel: React.FC = () => {
    return (
        <div className="mode-settings-tab">
            <div className="mode-settings-header">
                <h4>Choose Mode you like</h4>
            </div>
            <div className="mode-settings-content">
                <div className="mode-1">
                    <div className="mode-info">
                    <h2>Working</h2>
                    <p>Focus on Work!</p>
                    </div>
                    <SwitchButton
                        initialValue={false}
                        onChange={(newValue) => {
                            console.log('Working mode is now:', newValue);
                        }}
                    />
                </div>
                <div className="mode-2">
                <div className="mode-info">
                    <h2>Shopping</h2>
                    <p>See all the promotions!</p>
                    </div>
                    <SwitchButton
                        initialValue={false}
                        onChange={(newValue) => {
                            console.log('Shopping mode is now:', newValue);
                        }}
                    />
                </div>
                <div className="mode-3">
                <div className="mode-info">
                    <h2>Job Hunting</h2>
                    <p>Tracking for future jobs!</p>
                    </div>
                    <SwitchButton
                        initialValue={false}
                        onChange={(newValue) => {
                            console.log('Job Hunting mode is now:', newValue);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ModeSettingsPanel;