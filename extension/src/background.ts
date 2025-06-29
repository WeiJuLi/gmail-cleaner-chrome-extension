const CLIENT_ID = '1047463995054-qkbrj0sb99domvcvggspu957ij3o5ee9.apps.googleusercontent.com';

// ✅ 修改 redirect URI 為 extension 專用 URI
const REDIRECT_URI = 'https://bnggbbacdkoimohaoflmeolfkeadffgb.chromiumapp.org/'; // ← 請替換為你的 Extension ID 對應 URI
const encodedRedirectUri = encodeURIComponent(REDIRECT_URI); 

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
  console.log(authUrl)
  
  chrome.identity.launchWebAuthFlow(
    {
      url: authUrl,
      interactive: true,
    },
    async (redirectUrl) => {
      if (chrome.runtime.lastError || !redirectUrl) {
        console.error('OAuth failed:', chrome.runtime.lastError);
        return;
      }

      const url = new URL(redirectUrl);
      const code = url.searchParams.get('code');

      if (!code) {
        console.error('No code found in redirect URL');
        return;
      }

      // ✅ 發送 code 給本地 server 換取 access token
      try {
        const res = await fetch('http://localhost:8080/oauth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        chrome.storage.local.set({ accessToken: data.access_token }, () => {
          console.log('✅ Access token saved.');
        });
      } catch (error) {
        console.error('Token exchange failed:', error);
      }
    }
  );
}
