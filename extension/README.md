# Gmail Cleaner Chrome Extension (English)

This is a Chrome Extension that filters Gmail based on modes (Working, Shopping, Job Hunting), supports an email whitelist, and offers batch cleanup actions.

Key docs:
- Quick usage: `docs/USAGE_GUIDE.md`
- Mode Settings API: `docs/MODE_SETTINGS_API_GUIDE.md`
- Type system: `docs/type-definitions-guide.md`
- Gmail integration summary: `docs/implementation-summary.md`
- Gmail button troubleshooting: `docs/gmail-button-troubleshooting.md`

Official references:
- Gmail API: https://developers.google.com/gmail/api
- OAuth 2.0: https://developers.google.com/identity/protocols/oauth2
- Chrome Identity API: https://developer.chrome.com/docs/extensions/reference/identity

Development:
- Frontend: React + TypeScript + Vite
- Background service worker and content scripts follow MV3
- Local backend for OAuth token exchange at `extension/server`
