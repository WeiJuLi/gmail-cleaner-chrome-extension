// Gmail API 測試腳本 - 在 Chrome Extension Console 中執行
// 複製整個檔案內容到 console 後按 Enter 執行

console.log('🚀 Gmail API 測試腳本載入中...');

// 全域測試函數
window.gmailApiTest = {
    
    // 檢查環境
    checkEnvironment() {
        console.log('🔧 檢查 Chrome Extension 環境...');
        
        const checks = {
            isChromeExtension: typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id,
            hasStorageAPI: typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local,
            hasIdentityAPI: typeof chrome !== 'undefined' && chrome.identity,
            extensionId: chrome?.runtime?.id || 'N/A'
        };
        
        console.log('環境檢查結果:', checks);
        
        if (checks.isChromeExtension) {
            console.log('✅ Chrome Extension 環境確認');
            return true;
        } else {
            console.error('❌ 不在 Chrome Extension 環境中');
            return false;
        }
    },

    // 檢查 OAuth Token
    async checkToken() {
        return new Promise((resolve) => {
            console.log('🔐 檢查 OAuth Token...');
            
            if (!chrome?.storage?.local) {
                console.error('❌ Chrome Storage API 不可用');
                resolve(false);
                return;
            }

            chrome.storage.local.get([
                'gmail_access_token',
                'gmail_refresh_token',
                'gmail_token_expires_at',
                'gmail_token_scope'
            ], (result) => {
                console.log('Storage 檢查結果:', result);
                
                const hasToken = !!result.gmail_access_token;
                const expiresAt = result.gmail_token_expires_at ? parseInt(result.gmail_token_expires_at) : 0;
                const isExpired = expiresAt < Date.now();
                
                const tokenInfo = {
                    hasToken,
                    isExpired,
                    expiresAt: expiresAt ? new Date(expiresAt).toLocaleString('zh-TW') : 'N/A',
                    expiresIn: hasToken && !isExpired ? Math.floor((expiresAt - Date.now()) / 60000) + ' 分鐘' : 'N/A',
                    scope: result.gmail_token_scope ? JSON.parse(result.gmail_token_scope) : [],
                    hasRefreshToken: !!result.gmail_refresh_token
                };
                
                console.log('Token 資訊:', tokenInfo);
                
                if (hasToken && !isExpired) {
                    console.log('✅ Token 有效');
                    resolve(true);
                } else if (hasToken && isExpired) {
                    console.log('⚠️ Token 已過期');
                    resolve(false);
                } else {
                    console.log('❌ 找不到 Token');
                    resolve(false);
                }
            });
        });
    },

    // 測試 Gmail API 連接
    async testAPIConnection() {
        return new Promise((resolve) => {
            console.log('📧 測試 Gmail API 連接...');
            
            chrome.storage.local.get(['gmail_access_token'], async (result) => {
                if (!result.gmail_access_token) {
                    console.error('❌ 找不到 Access Token');
                    resolve(false);
                    return;
                }

                try {
                    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
                        headers: {
                            'Authorization': `Bearer ${result.gmail_access_token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log('✅ Gmail API 連接成功!');
                        console.log('使用者資訊:', {
                            emailAddress: data.emailAddress,
                            messagesTotal: data.messagesTotal,
                            threadsTotal: data.threadsTotal
                        });
                        resolve(true);
                    } else {
                        const errorData = await response.json();
                        console.error('❌ API 連接失敗:', response.status, errorData);
                        resolve(false);
                    }
                } catch (error) {
                    console.error('❌ API 請求錯誤:', error);
                    resolve(false);
                }
            });
        });
    },

    // 測試搜尋信件
    async testSearchEmails() {
        return new Promise((resolve) => {
            console.log('🔍 測試信件搜尋...');
            
            chrome.storage.local.get(['gmail_access_token'], async (result) => {
                if (!result.gmail_access_token) {
                    console.error('❌ 找不到 Access Token');
                    resolve(false);
                    return;
                }

                try {
                    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
                        headers: {
                            'Authorization': `Bearer ${result.gmail_access_token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const emailCount = data.messages?.length || 0;
                        console.log(`✅ 搜尋成功! 找到 ${emailCount} 封信件`);
                        console.log('信件列表:', data.messages?.slice(0, 3)); // 顯示前3封
                        resolve(true);
                    } else {
                        const errorData = await response.json();
                        console.error('❌ 搜尋失敗:', response.status, errorData);
                        resolve(false);
                    }
                } catch (error) {
                    console.error('❌ 搜尋請求錯誤:', error);
                    resolve(false);
                }
            });
        });
    },

    // 測試信件詳情
    async testEmailDetails() {
        return new Promise((resolve) => {
            console.log('📄 測試信件詳情取得...');
            
            chrome.storage.local.get(['gmail_access_token'], async (result) => {
                if (!result.gmail_access_token) {
                    console.error('❌ 找不到 Access Token');
                    resolve(false);
                    return;
                }

                try {
                    // 先取得信件列表
                    const listResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1', {
                        headers: {
                            'Authorization': `Bearer ${result.gmail_access_token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!listResponse.ok) {
                        console.error('❌ 無法取得信件列表');
                        resolve(false);
                        return;
                    }

                    const listData = await listResponse.json();
                    if (!listData.messages || listData.messages.length === 0) {
                        console.log('⚠️ 信箱中沒有信件');
                        resolve(true); // 這不算錯誤
                        return;
                    }

                    // 取得第一封信件的詳情
                    const messageId = listData.messages[0].id;
                    const detailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
                        headers: {
                            'Authorization': `Bearer ${result.gmail_access_token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (detailResponse.ok) {
                        const message = await detailResponse.json();
                        
                        // 解析基本資訊
                        const headers = message.payload?.headers || [];
                        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || 'No subject';
                        const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown sender';
                        
                        console.log('✅ 信件詳情取得成功!');
                        console.log('信件資訊:', {
                            id: message.id,
                            subject,
                            from,
                            snippet: message.snippet,
                            labelIds: message.labelIds
                        });
                        
                        // 測試智慧分析
                        this.analyzeEmail(subject, from, message.snippet || '');
                        
                        resolve(true);
                    } else {
                        const errorData = await detailResponse.json();
                        console.error('❌ 詳情取得失敗:', detailResponse.status, errorData);
                        resolve(false);
                    }
                } catch (error) {
                    console.error('❌ 詳情測試錯誤:', error);
                    resolve(false);
                }
            });
        });
    },

    // 智慧分析信件
    analyzeEmail(subject, from, content) {
        console.log('🧠 執行智慧分析...');
        
        const subjectLower = subject.toLowerCase();
        const contentLower = content.toLowerCase();
        const fromDomain = from.includes('@') ? from.split('@')[1] : '';
        
        // 分類邏輯
        let category = 'unknown';
        if (['job', 'career', 'interview', 'position', 'hiring'].some(k => subjectLower.includes(k) || contentLower.includes(k))) {
            category = 'working';
        } else if (['order', 'purchase', 'shipping', 'payment'].some(k => subjectLower.includes(k) || contentLower.includes(k))) {
            category = 'shopping';
        } else if (['newsletter', 'unsubscribe', 'promotion'].some(k => subjectLower.includes(k) || contentLower.includes(k))) {
            category = 'newsletter';
        }
        
        // 重要性評估
        let importance = 'medium';
        if (['urgent', 'important', 'deadline'].some(k => subjectLower.includes(k))) {
            importance = 'high';
        } else if (['newsletter', 'promotion', 'ads'].some(k => subjectLower.includes(k))) {
            importance = 'low';
        }
        
        const analysis = {
            category,
            importance,
            fromDomain,
            hasUnsubscribe: contentLower.includes('unsubscribe') || contentLower.includes('取消訂閱'),
            isRead: true // 假設已讀（實際需要檢查 labelIds）
        };
        
        console.log('✅ 智慧分析完成:', analysis);
        return analysis;
    },

    // 執行完整測試
    async runFullTest() {
        console.log('🚀 開始執行完整測試...');
        console.log('=====================================');
        
        try {
            // 1. 環境檢查
            const envOk = this.checkEnvironment();
            if (!envOk) {
                console.log('❌ 環境檢查失敗，停止測試');
                return false;
            }
            
            console.log('=====================================');
            
            // 2. Token 檢查
            const tokenOk = await this.checkToken();
            if (!tokenOk) {
                console.log('❌ Token 檢查失敗，請先完成 OAuth 登入');
                return false;
            }
            
            console.log('=====================================');
            
            // 3. API 連接測試
            const apiOk = await this.testAPIConnection();
            if (!apiOk) {
                console.log('❌ API 連接失敗');
                return false;
            }
            
            console.log('=====================================');
            
            // 4. 搜尋測試
            const searchOk = await this.testSearchEmails();
            if (!searchOk) {
                console.log('❌ 搜尋測試失敗');
                return false;
            }
            
            console.log('=====================================');
            
            // 5. 詳情測試
            const detailsOk = await this.testEmailDetails();
            if (!detailsOk) {
                console.log('❌ 詳情測試失敗');
                return false;
            }
            
            console.log('=====================================');
            console.log('🎉 所有測試通過！Gmail API 功能正常運作。');
            console.log('📊 測試總結:');
            console.log('  ✅ 環境檢查');
            console.log('  ✅ Token 驗證');
            console.log('  ✅ API 連接');
            console.log('  ✅ 信件搜尋');
            console.log('  ✅ 信件詳情');
            console.log('  ✅ 智慧分析');
            console.log('=====================================');
            
            return true;
            
        } catch (error) {
            console.error('❌ 測試過程中發生錯誤:', error);
            return false;
        }
    }
};

// 自動執行測試
console.log('✅ 測試腳本載入完成！');
console.log('💡 使用方法:');
console.log('  - 執行完整測試: gmailApiTest.runFullTest()');
console.log('  - 檢查環境: gmailApiTest.checkEnvironment()');
console.log('  - 檢查 Token: gmailApiTest.checkToken()');
console.log('  - 測試 API: gmailApiTest.testAPIConnection()');
console.log('  - 搜尋信件: gmailApiTest.testSearchEmails()');
console.log('  - 信件詳情: gmailApiTest.testEmailDetails()');
console.log('');
console.log('🚀 3秒後自動開始完整測試...');

// 3秒後自動執行完整測試
setTimeout(() => {
    gmailApiTest.runFullTest();
}, 3000); 