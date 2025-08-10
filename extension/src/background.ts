const CLIENT_ID = '1047463995054-qkbrj0sb99domvcvggspu957ij3o5ee9.apps.googleusercontent.com';

// ✅ 修改 redirect URI 為正確的 extension ID
const REDIRECT_URI = 'https://lblhefdhjlnbkhepladdholdlhmcildp.chromiumapp.org/';
const encodedRedirectUri = encodeURIComponent(REDIRECT_URI); 

// 與 tokenManager 一致的 storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'gmail_access_token',
  REFRESH_TOKEN: 'gmail_refresh_token',
  TOKEN_EXPIRES_AT: 'gmail_token_expires_at',
  TOKEN_SCOPE: 'gmail_token_scope'
} as const;

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'start-oauth') {
    startOAuthFlow();
  }
});

async function startOAuthFlow() {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.settings.basic',
  ];

  const encodedScope = encodeURIComponent(scopes.join(' '));
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${encodedScope}&access_type=offline&prompt=consent`;
  console.log('🔗 OAuth URL:', authUrl);
  
  chrome.identity.launchWebAuthFlow(
    {
      url: authUrl,
      interactive: true,
    },
    async (redirectUrl) => {
      if (chrome.runtime.lastError || !redirectUrl) {
        console.error('❌ OAuth failed:', chrome.runtime.lastError);
        return;
      }

      const url = new URL(redirectUrl);
      const code = url.searchParams.get('code');

      if (!code) {
        console.error('❌ No code found in redirect URL');
        return;
      }

      console.log('✅ 取得 authorization code，準備交換 token...');

      // ✅ 發送 code 給本地 server 換取 access token
      try {
        const res = await fetch('http://localhost:8080/oauth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log('✅ 成功取得 token 資料');

        // 計算過期時間
        const expiresAt = Date.now() + (data.expires_in * 1000);

        // 使用與 tokenManager 一致的格式儲存 token
        const storageData = {
          [STORAGE_KEYS.ACCESS_TOKEN]: data.access_token,
          [STORAGE_KEYS.REFRESH_TOKEN]: data.refresh_token,
          [STORAGE_KEYS.TOKEN_EXPIRES_AT]: expiresAt.toString(),
          [STORAGE_KEYS.TOKEN_SCOPE]: JSON.stringify(scopes)
        };

        chrome.storage.local.set(storageData, () => {
          if (chrome.runtime.lastError) {
            console.error('❌ 儲存 token 失敗:', chrome.runtime.lastError);
          } else {
            console.log('✅ Access token 已儲存到正確的 storage keys');
            console.log('📊 Token 資訊:', {
              hasAccessToken: !!data.access_token,
              hasRefreshToken: !!data.refresh_token,
              expiresIn: data.expires_in,
              expiresAt: new Date(expiresAt).toISOString()
            });
          }
        });
      } catch (error) {
        console.error('❌ Token exchange failed:', error);
      }
    }
  );
}
