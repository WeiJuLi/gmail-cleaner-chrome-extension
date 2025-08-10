import React, { useState, useEffect } from 'react';
import SwitchButton from './SwitchButton';
import '../styles/ModeSettingsPanel.css';
import { gmailApi } from '../utils/gmailApi';
import { ProcessedEmail } from '../types/gmail';
import { modeManager } from '../utils/modeManager';

// Extended ProcessedEmail type with email count
// Note: This UI currently shows sender name, sender email, relative date, and a count badge.
// It intentionally does not render subject/snippet to keep the panel concise.
interface ProcessedEmailWithCount extends ProcessedEmail {
    emailCount?: number;
}

// React.FC is short for React.FunctionComponent, providing default type definitions
// ModeSettingsPanel is responsible for displaying different mode settings pages
const ModeSettingsPanel: React.FC = () => {
    // Working mode state management
    const [workingModeOn, setWorkingModeOn] = useState(false);
    const [workingEmailListOpen, setWorkingEmailListOpen] = useState(false);
    const [workingEmailList, setWorkingEmailList] = useState<string[]>([]);
    const [workingInputEmail, setWorkingInputEmail] = useState('');
    const [workingDetectedEmails, setWorkingDetectedEmails] = useState<ProcessedEmailWithCount[]>([]);
    const [workingLoading, setWorkingLoading] = useState(false);

    // Shopping mode state management
    const [shoppingModeOn, setShoppingModeOn] = useState(false);
    const [shoppingEmailListOpen, setShoppingEmailListOpen] = useState(false);
    const [shoppingEmailList, setShoppingEmailList] = useState<string[]>([]);
    const [shoppingInputEmail, setShoppingInputEmail] = useState('');
    const [shoppingDetectedEmails, setShoppingDetectedEmails] = useState<ProcessedEmailWithCount[]>([]);
    const [shoppingLoading, setShoppingLoading] = useState(false);

    // Job Hunting mode state management
    const [jobModeOn, setJobModeOn] = useState(false);
    const [jobEmailListOpen, setJobEmailListOpen] = useState(false);
    const [jobEmailList, setJobEmailList] = useState<string[]>([]);
    const [jobInputEmail, setJobInputEmail] = useState('');
    const [jobDetectedEmails, setJobDetectedEmails] = useState<ProcessedEmailWithCount[]>([]);
    const [jobLoading, setJobLoading] = useState(false);

    // Initialize component with data from modeManager
    useEffect(() => {
        // Load initial settings from modeManager
        const loadInitialSettings = () => {
            const allSettings = modeManager.getAllSettings();
            
            // Working mode
            setWorkingModeOn(allSettings.working.enabled);
            setWorkingEmailList([...allSettings.working.whiteListEmails]);
            
            // Shopping mode
            setShoppingModeOn(allSettings.shopping.enabled);
            setShoppingEmailList([...allSettings.shopping.whiteListEmails]);
            
            // Job Hunting mode
            setJobModeOn(allSettings.jobHunting.enabled);
            setJobEmailList([...allSettings.jobHunting.whiteListEmails]);
        };

        loadInitialSettings();

        // Listen for settings changes
        const handleSettingsChange = (settings: any) => {
            setWorkingModeOn(settings.working.enabled);
            setWorkingEmailList([...settings.working.whiteListEmails]);
            
            setShoppingModeOn(settings.shopping.enabled);
            setShoppingEmailList([...settings.shopping.whiteListEmails]);
            
            setJobModeOn(settings.jobHunting.enabled);
            setJobEmailList([...settings.jobHunting.whiteListEmails]);
        };

        modeManager.addListener(handleSettingsChange);

        return () => {
            modeManager.removeListener(handleSettingsChange);
        };
    }, []);

    // Function to fetch relevant emails
    // Fetch strategy:
    // 1) Build a simple keyword query per mode
    // 2) Search up to 50 emails (configurable; trade-off between speed and relevance)
    // 3) Batch-load details, normalize via gmailApi.processRawEmail
    // 4) Categorize and count by sender, display top 5 senders
    const fetchRelevantEmails = async (category: 'working' | 'shopping' | 'jobHunting', setEmails: React.Dispatch<React.SetStateAction<ProcessedEmailWithCount[]>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>) => {
        console.log(`🔍 Starting to fetch ${category} related emails...`);
        setLoading(true);
        try {
            // Create search query based on different modes
            let searchQuery = '';
            switch (category) {
                case 'working':
                    searchQuery = 'job OR career OR work OR interview OR meeting OR project OR team OR company OR business';
                    break;
                case 'shopping':
                    searchQuery = 'order OR purchase OR shipping OR delivery OR payment OR receipt OR invoice OR shop OR store OR buy';
                    break;
                case 'jobHunting':
                    searchQuery = 'application OR cv OR resume OR opportunity OR vacancy OR recruitment OR hiring OR position';
                    break;
            }
            
            console.log(`📝 Search query: ${searchQuery}`);

            // Check if gmailApi is available
            if (typeof gmailApi === 'undefined') {
                console.error('❌ gmailApi is undefined');
                return;
            }

            // Search recent emails (limit 50 for balanced performance)
            console.log('🔍 Starting email search...');
            const searchResult = await gmailApi.searchEmails({
                q: searchQuery,
                maxResults: 50 // Search more emails to get better statistics
            });

            console.log('🔍 Search results:', searchResult);

            if (searchResult.success && searchResult.data?.messages) {
                console.log(`✅ Found ${searchResult.data.messages.length} emails matching criteria`);
                
                // Batch get email details
                const messageIds = searchResult.data.messages.map(msg => msg.id);
                console.log('📦 Starting batch email details retrieval...');
                const emailsResult = await gmailApi.getEmailBatch(messageIds.slice(0, 50));

                console.log('📦 Batch retrieval results:', emailsResult);

                if (emailsResult.success && emailsResult.data) {
                    console.log(`✅ Successfully retrieved ${emailsResult.data.length} email details`);
                    
                    // Process emails and convert to ProcessedEmail format
                    console.log('🔄 Starting email data processing...');
                    const processedEmails = await Promise.all(
                        emailsResult.data.map(async (email, index) => {
                            try {
                                const processed = await gmailApi.processRawEmail(email);
                                console.log(`📧 Processed email ${index + 1}:`, {
                                    subject: processed.subject,
                                    from: processed.from,
                                    category: processed.category
                                });
                                return processed;
                            } catch (error) {
                                console.error(`❌ Failed to process email ${index + 1}:`, error);
                                return null;
                            }
                        })
                    );

                    // Filter out failed emails
                    const validEmails = processedEmails.filter(email => email !== null) as ProcessedEmail[];
                    console.log(`✅ Successfully processed ${validEmails.length} emails`);

                    // Filter relevant emails
                    const relevantEmails = validEmails
                        .filter(email => {
                            const isRelevant = email.category === category;
                            console.log(`📧 Email "${email.subject}" category: ${email.category}, relevant: ${isRelevant}`);
                            return isRelevant;
                        });

                    // Count emails by sender and sort by count
                    const senderCounts = new Map<string, { email: ProcessedEmail; count: number }>();
                    relevantEmails.forEach(email => {
                        const senderKey = email.fromEmail.toLowerCase();
                        if (senderCounts.has(senderKey)) {
                            senderCounts.get(senderKey)!.count++;
                        } else {
                            senderCounts.set(senderKey, { email, count: 1 });
                        }
                    });

                    // Sort by count (descending) and get top 5
                    const sortedSenders = Array.from(senderCounts.values())
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5);

                    const finalEmails = sortedSenders.map(sender => ({
                        ...sender.email,
                        // Add email count to the email object for display
                        emailCount: sender.count
                    }));

                    console.log(`🎯 Final found ${finalEmails.length} top senders by email count:`, 
                        finalEmails.map(e => ({ from: e.from, count: e.emailCount })));
                    
                    setEmails(finalEmails);

                    // Update detected emails in modeManager
                    const detectedEmailAddresses = finalEmails.map(email => email.fromEmail);
                    await modeManager.updateDetectedEmails(category, detectedEmailAddresses);
                    
                    // If no relevant emails found, try showing all emails (for debugging)
                    if (finalEmails.length === 0) {
                        console.log('⚠️ No emails found matching category, showing top 5 senders for debugging');
                        const allSenderCounts = new Map<string, { email: ProcessedEmail; count: number }>();
                        validEmails.forEach(email => {
                            const senderKey = email.fromEmail.toLowerCase();
                            if (allSenderCounts.has(senderKey)) {
                                allSenderCounts.get(senderKey)!.count++;
                            } else {
                                allSenderCounts.set(senderKey, { email, count: 1 });
                            }
                        });

                        const debugEmails = Array.from(allSenderCounts.values())
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 5)
                            .map(sender => ({
                                ...sender.email,
                                emailCount: sender.count
                            }));

                        console.log('🔍 Debug emails by count:', debugEmails.map(e => ({
                            from: e.from,
                            category: e.category,
                            count: e.emailCount
                        })));
                        setEmails(debugEmails);

                        // Update with debug emails
                        const debugEmailAddresses = debugEmails.map(email => email.fromEmail);
                        await modeManager.updateDetectedEmails(category, debugEmailAddresses);
                    }
                } else {
                    console.error('❌ Failed to batch retrieve email details:', emailsResult.error);
                }
            } else {
                console.error('❌ Failed to search emails:', searchResult.error);
                if (searchResult.data?.messages?.length === 0) {
                    console.log('ℹ️ No emails found matching search criteria');
                }
            }
        } catch (error) {
            console.error(`❌ Failed to fetch ${category} emails:`, error);
        } finally {
            setLoading(false);
            console.log(`🏁 ${category} email fetching completed`);
        }
    };

  // Build a Gmail native search query for broad coverage across pages
  const buildGmailSearchQuery = (category: 'working' | 'shopping' | 'jobHunting'): string => {
      const settings = modeManager.getAllSettings();
      const whitelist = settings[category].whiteListEmails || [];
      const detected = settings[category].detectedEmails || [];
      const allSenders = Array.from(new Set([...whitelist, ...detected]))
          .filter(Boolean)
          .map(e => `from:${e}`);

      let keywordQuery = '';
      if (category === 'working') keywordQuery = '(job OR career OR work OR interview OR meeting OR project OR team OR company OR business)';
      if (category === 'shopping') keywordQuery = '(order OR purchase OR shipping OR delivery OR payment OR receipt OR invoice OR shop OR store OR buy)';
      if (category === 'jobHunting') keywordQuery = '(application OR cv OR resume OR opportunity OR vacancy OR recruitment OR hiring OR position)';

      const parts: string[] = [];
      if (allSenders.length) parts.push(`(${allSenders.join(' OR ')})`);
      if (keywordQuery) parts.push(keywordQuery);
      return parts.join(' OR ');
  };

  // Navigate Gmail to the search view using SPA hash
  // Track whether native search is currently applied (simple heuristic: hash starts with #search/ and contains our keywords)
  const isSearchApplied = (category: 'working' | 'shopping' | 'jobHunting') => {
      const q = buildGmailSearchQuery(category);
      const current = decodeURIComponent(window.location.hash || '');
      return current.startsWith('#search/') && (q ? current.includes(q.split(' ')[0]) : false);
  };

  const applyGmailSearch = (category: 'working' | 'shopping' | 'jobHunting') => {
      const q = buildGmailSearchQuery(category);
      if (!q) return;
      const encoded = encodeURIComponent(q);
      window.location.hash = `#search/${encoded}`;
  };

  const clearGmailSearch = () => {
      // Navigate back to inbox
      window.location.hash = '#inbox';
  };

    // Working mode event handlers
    const handleWorkingSwitchChange = async (newValue: boolean) => {
        setWorkingModeOn(newValue);
        await modeManager.setModeEnabled('working', newValue);
        
        if (!newValue) {
            setWorkingEmailListOpen(false);
            setWorkingDetectedEmails([]);
        } else {
            // Automatically fetch relevant emails when mode is enabled
            fetchRelevantEmails('working', setWorkingDetectedEmails, setWorkingLoading);
        }
    };

    const handleWorkingAddListClick = () => {
        setWorkingEmailListOpen((prev) => !prev);
    };

    const handleWorkingAddEmail = async () => {
        if (workingInputEmail && /.+@.+\..+/.test(workingInputEmail) && !workingEmailList.includes(workingInputEmail)) {
            const success = await modeManager.addWhiteListEmail('working', workingInputEmail);
            if (success) {
                setWorkingInputEmail('');
            }
        }
    };

    // Shopping mode event handlers
    const handleShoppingSwitchChange = async (newValue: boolean) => {
        setShoppingModeOn(newValue);
        await modeManager.setModeEnabled('shopping', newValue);
        
        if (!newValue) {
            setShoppingEmailListOpen(false);
            setShoppingDetectedEmails([]);
        } else {
            // Automatically fetch relevant emails when mode is enabled
            fetchRelevantEmails('shopping', setShoppingDetectedEmails, setShoppingLoading);
        }
    };

    const handleShoppingAddListClick = () => {
        setShoppingEmailListOpen((prev) => !prev);
    };

    const handleShoppingAddEmail = async () => {
        if (shoppingInputEmail && /.+@.+\..+/.test(shoppingInputEmail) && !shoppingEmailList.includes(shoppingInputEmail)) {
            const success = await modeManager.addWhiteListEmail('shopping', shoppingInputEmail);
            if (success) {
                setShoppingInputEmail('');
            }
        }
    };

    // Job Hunting mode event handlers
    const handleJobSwitchChange = async (newValue: boolean) => {
        setJobModeOn(newValue);
        await modeManager.setModeEnabled('jobHunting', newValue);
        
        if (!newValue) {
            setJobEmailListOpen(false);
            setJobDetectedEmails([]);
        } else {
            // Automatically fetch relevant emails when mode is enabled
            fetchRelevantEmails('jobHunting', setJobDetectedEmails, setJobLoading);
        }
    };

    const handleJobAddListClick = () => {
        setJobEmailListOpen((prev) => !prev);
    };

    const handleJobAddEmail = async () => {
        if (jobInputEmail && /.+@.+\..+/.test(jobInputEmail) && !jobEmailList.includes(jobInputEmail)) {
            const success = await modeManager.addWhiteListEmail('jobHunting', jobInputEmail);
            if (success) {
                setJobInputEmail('');
            }
        }
    };

    // Format date display
    const formatDate = (date: Date): string => {
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US');
        }
    };

    // Render detected email list - only show sender information with email count
    const renderDetectedEmails = (emails: ProcessedEmailWithCount[], loading: boolean) => {
        if (loading) {
            return (
                <div className="detected-emails-section">
                    <h4 className="detected-emails-title">🔍 Related Emails (Loading...)</h4>
                    <div className="loading-spinner">Loading...</div>
                </div>
            );
        }

        if (emails.length === 0) {
            return (
                <div className="detected-emails-section">
                    <h4 className="detected-emails-title">🔍 Related Emails</h4>
                    <div className="no-emails-message">No related emails found</div>
                </div>
            );
        }

        return (
            <div className="detected-emails-section">
                <h4 className="detected-emails-title">🔍 Top Email Senders ({emails.length})</h4>
                <div className="detected-emails-list">
                    {emails.map((email, index) => (
                        <div key={email.id} className="detected-email-item">
                            <div className="email-header">
                                <div className="email-from">
                                    <span className="email-from-text">#{index + 1} {email.from}</span>
                                    {email.emailCount && (
                                        <span className="email-count-badge">{email.emailCount}</span>
                                    )}
                                </div>
                                <div className="email-date">{formatDate(email.date)}</div>
                            </div>
                            <div className="email-address" title={email.fromEmail}>
                                {email.fromEmail}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="mode-settings-tab">
            <div className="mode-settings-header">
                <h4>Choose Mode you like</h4>
            </div>
            <div className="mode-settings-content">
                {/* Working Mode */}
                <div className={`mode-1 ${workingModeOn ? 'expanded' : ''}`}>
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
                    {/* Working mode content when enabled */}
                    <div className={`mode-1-extra ${workingModeOn ? 'show' : ''}`}>
                        {/* Display detected related emails */}
                        {renderDetectedEmails(workingDetectedEmails, workingLoading)}
                        {/* Apply Gmail native search (broader coverage across pages) */}
                        <div className="apply-search-row">
                            {isSearchApplied('working') ? (
                                <button className="apply-search-btn active" onClick={clearGmailSearch} title="Clear Gmail search and return to Inbox">
                                    Clear Gmail search
                                </button>
                            ) : (
                                <button className="apply-search-btn" onClick={() => applyGmailSearch('working')} title="Open Gmail search view with Working filters">
                                    Apply Gmail search
                                </button>
                            )}
                        </div>
                        
                        {/* Manual email addition section */}
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
                                        title="Add email"
                                    >
                                        +
                                    </button>
                                </div>
                                <div>
                                    {workingEmailList.length === 0 ? (
                                        <div style={{ fontSize: 14, color: '#aaa' }}>(No emails added yet)</div>
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
                </div>

                {/* Shopping Mode */}
                <div className={`mode-2 ${shoppingModeOn ? 'expanded' : ''}`}>
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
                    {/* Shopping mode content when enabled */}
                    <div className={`mode-1-extra ${shoppingModeOn ? 'show' : ''}`}>
                        {/* Display detected related emails */}
                        {renderDetectedEmails(shoppingDetectedEmails, shoppingLoading)}
                        <div className="apply-search-row">
                            {isSearchApplied('shopping') ? (
                                <button className="apply-search-btn active" onClick={clearGmailSearch} title="Clear Gmail search and return to Inbox">
                                    Clear Gmail search
                                </button>
                            ) : (
                                <button className="apply-search-btn" onClick={() => applyGmailSearch('shopping')} title="Open Gmail search view with Shopping filters">
                                    Apply Gmail search
                                </button>
                            )}
                        </div>
                        
                        {/* Manual email addition section */}
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
                                        title="Add email"
                                    >
                                        +
                                    </button>
                                </div>
                                <div>
                                    {shoppingEmailList.length === 0 ? (
                                        <div style={{ fontSize: 14, color: '#aaa' }}>(No emails added yet)</div>
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
                </div>

                {/* Job Hunting Mode */}
                <div className={`mode-3 ${jobModeOn ? 'expanded' : ''}`}>
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
                    {/* Job Hunting mode content when enabled */}
                    <div className={`mode-1-extra ${jobModeOn ? 'show' : ''}`}>
                        {/* Display detected related emails */}
                        {renderDetectedEmails(jobDetectedEmails, jobLoading)}
                        <div className="apply-search-row">
                            {isSearchApplied('jobHunting') ? (
                                <button className="apply-search-btn active" onClick={clearGmailSearch} title="Clear Gmail search and return to Inbox">
                                    Clear Gmail search
                                </button>
                            ) : (
                                <button className="apply-search-btn" onClick={() => applyGmailSearch('jobHunting')} title="Open Gmail search view with Job Hunting filters">
                                    Apply Gmail search
                                </button>
                            )}
                        </div>
                        
                        {/* Manual email addition section */}
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
                                        title="Add email"
                                    >
                                        +
                                    </button>
                                </div>
                                <div>
                                    {jobEmailList.length === 0 ? (
                                        <div style={{ fontSize: 14, color: '#aaa' }}>(No emails added yet)</div>
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
                </div>
            </div>
        </div>
    );
};

export default ModeSettingsPanel;