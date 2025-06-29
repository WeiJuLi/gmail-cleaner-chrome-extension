import React, { useState } from 'react';
import SwitchButton from './SwitchButton';
import '../styles/ModeSettingsPanel.css';

// React.FC 是 React.FunctionComponent 的簡寫，提供了預設的類型定義
// ModeSettingsPanel 主要負責顯示不同模式的設定頁面
const ModeSettingsPanel: React.FC = () => {
    // 中文說明：Working 模式的狀態管理
    const [workingModeOn, setWorkingModeOn] = useState(false);
    const [workingEmailListOpen, setWorkingEmailListOpen] = useState(false);
    const [workingEmailList, setWorkingEmailList] = useState<string[]>([]);
    const [workingInputEmail, setWorkingInputEmail] = useState('');

    // 中文說明：Shopping 模式的狀態管理
    const [shoppingModeOn, setShoppingModeOn] = useState(false);
    const [shoppingEmailListOpen, setShoppingEmailListOpen] = useState(false);
    const [shoppingEmailList, setShoppingEmailList] = useState<string[]>([]);
    const [shoppingInputEmail, setShoppingInputEmail] = useState('');

    // 中文說明：Job Hunting 模式的狀態管理
    const [jobModeOn, setJobModeOn] = useState(false);
    const [jobEmailListOpen, setJobEmailListOpen] = useState(false);
    const [jobEmailList, setJobEmailList] = useState<string[]>([]);
    const [jobInputEmail, setJobInputEmail] = useState('');

    // 中文說明：Working 模式的事件處理
    const handleWorkingSwitchChange = (newValue: boolean) => {
        setWorkingModeOn(newValue);
        if (!newValue) setWorkingEmailListOpen(false);
    };

    const handleWorkingAddListClick = () => {
        setWorkingEmailListOpen((prev) => !prev);
    };

    const handleWorkingAddEmail = () => {
        if (workingInputEmail && /.+@.+\..+/.test(workingInputEmail) && !workingEmailList.includes(workingInputEmail)) {
            setWorkingEmailList([...workingEmailList, workingInputEmail]);
            setWorkingInputEmail('');
        }
    };

    // 中文說明：Shopping 模式的事件處理
    const handleShoppingSwitchChange = (newValue: boolean) => {
        setShoppingModeOn(newValue);
        if (!newValue) setShoppingEmailListOpen(false);
    };

    const handleShoppingAddListClick = () => {
        setShoppingEmailListOpen((prev) => !prev);
    };

    const handleShoppingAddEmail = () => {
        if (shoppingInputEmail && /.+@.+\..+/.test(shoppingInputEmail) && !shoppingEmailList.includes(shoppingInputEmail)) {
            setShoppingEmailList([...shoppingEmailList, shoppingInputEmail]);
            setShoppingInputEmail('');
        }
    };

    // 中文說明：Job Hunting 模式的事件處理
    const handleJobSwitchChange = (newValue: boolean) => {
        setJobModeOn(newValue);
        if (!newValue) setJobEmailListOpen(false);
    };

    const handleJobAddListClick = () => {
        setJobEmailListOpen((prev) => !prev);
    };

    const handleJobAddEmail = () => {
        if (jobInputEmail && /.+@.+\..+/.test(jobInputEmail) && !jobEmailList.includes(jobInputEmail)) {
            setJobEmailList([...jobEmailList, jobInputEmail]);
            setJobInputEmail('');
        }
    };

    return (
        <div className="mode-settings-tab">
            <div className="mode-settings-header">
                <h4>Choose Mode you like</h4>
            </div>
            <div className="mode-settings-content">
                {/* Working 模式 */}
                <div className="mode-1">
                    <div className="mode-row">
                        <div className="mode-info">
                            <h2>Working</h2>
                            <p style={{ color: '#aaa' }}>
                                {workingModeOn ? 'Working Mode is ON!' : 'Focus on Work!'}
                            </p>
                        </div>
                        <SwitchButton
                            initialValue={workingModeOn}
                            onChange={handleWorkingSwitchChange}
                        />
                    </div>
                    {/* 中文說明：Working 模式開啟時顯示 email lists 區塊 */}
                    {workingModeOn && (
                        <div className="mode-1-extra">
                            <div
                                className="add-email-list-btn"
                                onClick={handleWorkingAddListClick}
                            >
                                Add email lists {workingEmailListOpen ? '▲' : '▼'}
                            </div>
                            {workingEmailListOpen && (
                                <div style={{ marginTop: 8 }}>
                                    <div className="email-input-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                        <input
                                            type="text"
                                            placeholder="Emails you like to see"
                                            value={workingInputEmail}
                                            onChange={e => setWorkingInputEmail(e.target.value)}
                                            style={{
                                                flex: 1,
                                                border: '1.5px solid #ffb6e6',
                                                borderRadius: 8,
                                                padding: '6px 12px',
                                                background: 'rgba(255,182,230,0.08)',
                                                color: '#ffb6e6',
                                                outline: 'none',
                                                marginRight: 8
                                            }}
                                        />
                                        <button
                                            onClick={handleWorkingAddEmail}
                                            style={{
                                                background: '#ffb6e6',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: 32,
                                                height: 32,
                                                fontSize: 20,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="新增 email"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div>
                                        {workingEmailList.length === 0 ? (
                                            <div style={{ fontSize: 14, color: '#aaa' }}>（目前尚未加入任何 email）</div>
                                        ) : (
                                            workingEmailList.map((email, idx) => (
                                                <div key={email + idx} className="email-list-item">
                                                    {email}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Shopping 模式 */}
                <div className="mode-2">
                    <div className="mode-row">
                        <div className="mode-info">
                            <h2>Shopping</h2>
                            <p style={{ color: '#aaa' }}>
                                {shoppingModeOn ? 'Shopping Mode is ON!' : 'See all the promotions!'}
                            </p>
                        </div>
                        <SwitchButton
                            initialValue={shoppingModeOn}
                            onChange={handleShoppingSwitchChange}
                        />
                    </div>
                    {/* 中文說明：Shopping 模式開啟時顯示 email lists 區塊 */}
                    {shoppingModeOn && (
                        <div className="mode-1-extra">
                            <div
                                className="add-email-list-btn"
                                onClick={handleShoppingAddListClick}
                            >
                                Add email lists {shoppingEmailListOpen ? '▲' : '▼'}
                            </div>
                            {shoppingEmailListOpen && (
                                <div style={{ marginTop: 8 }}>
                                    <div className="email-input-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                        <input
                                            type="text"
                                            placeholder="Emails you like to see"
                                            value={shoppingInputEmail}
                                            onChange={e => setShoppingInputEmail(e.target.value)}
                                            style={{
                                                flex: 1,
                                                border: '1.5px solid #ffb6e6',
                                                borderRadius: 8,
                                                padding: '6px 12px',
                                                background: 'rgba(255,182,230,0.08)',
                                                color: '#ffb6e6',
                                                outline: 'none',
                                                marginRight: 8
                                            }}
                                        />
                                        <button
                                            onClick={handleShoppingAddEmail}
                                            style={{
                                                background: '#ffb6e6',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: 32,
                                                height: 32,
                                                fontSize: 20,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="新增 email"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div>
                                        {shoppingEmailList.length === 0 ? (
                                            <div style={{ fontSize: 14, color: '#aaa' }}>（目前尚未加入任何 email）</div>
                                        ) : (
                                            shoppingEmailList.map((email, idx) => (
                                                <div key={email + idx} className="email-list-item">
                                                    {email}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Job Hunting 模式 */}
                <div className="mode-3">
                    <div className="mode-row">
                        <div className="mode-info">
                            <h2>Job Hunting</h2>
                            <p style={{ color: '#aaa' }}>
                                {jobModeOn ? 'Job Hunting Mode is ON!' : 'Tracking for future jobs!'}
                            </p>
                        </div>
                        <SwitchButton
                            initialValue={jobModeOn}
                            onChange={handleJobSwitchChange}
                        />
                    </div>
                    {/* 中文說明：Job Hunting 模式開啟時顯示 email lists 區塊 */}
                    {jobModeOn && (
                        <div className="mode-1-extra">
                            <div
                                className="add-email-list-btn"
                                onClick={handleJobAddListClick}
                            >
                                Add email lists {jobEmailListOpen ? '▲' : '▼'}
                            </div>
                            {jobEmailListOpen && (
                                <div style={{ marginTop: 8 }}>
                                    <div className="email-input-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                        <input
                                            type="text"
                                            placeholder="Emails you like to see"
                                            value={jobInputEmail}
                                            onChange={e => setJobInputEmail(e.target.value)}
                                            style={{
                                                flex: 1,
                                                border: '1.5px solid #ffb6e6',
                                                borderRadius: 8,
                                                padding: '6px 12px',
                                                background: 'rgba(255,182,230,0.08)',
                                                color: '#ffb6e6',
                                                outline: 'none',
                                                marginRight: 8
                                            }}
                                        />
                                        <button
                                            onClick={handleJobAddEmail}
                                            style={{
                                                background: '#ffb6e6',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: 32,
                                                height: 32,
                                                fontSize: 20,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="新增 email"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div>
                                        {jobEmailList.length === 0 ? (
                                            <div style={{ fontSize: 14, color: '#aaa' }}>（目前尚未加入任何 email）</div>
                                        ) : (
                                            jobEmailList.map((email, idx) => (
                                                <div key={email + idx} className="email-list-item">
                                                    {email}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModeSettingsPanel;