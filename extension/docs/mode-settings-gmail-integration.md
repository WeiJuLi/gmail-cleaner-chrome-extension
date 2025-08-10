# Mode Settings Gmail Integration - User Guide (English)

## Overview

When you turn on any mode (Working / Shopping / Job Hunting) in the side panel, the extension automatically searches your mailbox for relevant emails and shows the top senders for that category. This helps you focus your inbox view and curate a whitelist easily.

## What you get

- Auto-detected relevant emails per mode (up to 5 top senders)
- Real-time Gmail page filtering based on detected and whitelisted addresses
- Batch-friendly Gmail API integration under the hood

## What is displayed per detected sender

- Sender name (e.g., "LinkedIn")
- Sender email address (e.g., "noreply@linkedin.com")
- Count badge indicating how many emails came from this sender
- Relative date (Today / Yesterday / N days ago)

Note: Subject and snippet are not displayed in the current UI to keep it concise.

## Smart categorization (search queries)

- Working: `job OR career OR work OR interview OR meeting OR project OR team OR company OR business`
- Shopping: `order OR purchase OR shipping OR delivery OR payment OR receipt OR invoice OR shop OR store OR buy`
- Job Hunting: `application OR cv OR resume OR opportunity OR vacancy OR recruitment OR hiring OR position`

## How to use

1) Click the K icon in your Gmail toolbar to open the side panel
2) Go to the "Mode Settings" tab
3) Toggle ON a mode (e.g., Working). The UI will fetch and display top senders
4) Optionally add manual whitelist emails via "Add email lists"

## Performance and limits

- Search limit per fetch: up to 50 recent emails (configurable in code)
- Display limit: up to 5 top senders per mode
- Uses batched Gmail details calls to minimize API requests

## Testing

Manual testing:
- Ensure you are logged in (OAuth completed)
- Toggle each mode and observe the detected senders list
- Add/remove manual whitelist entries and see page filtering update

Integration testing helper (from code):
- Open devtools Console and run `import("/src/utils/index.ts")` in your extension build context or call the exported helpers wired in your app. A convenient method exists:
  - `testGmailApiIntegration()` — validates authentication and basic Gmail access

## Security and permissions

- OAuth 2.0 with authorization code flow via Chrome Identity + local backend token exchange
- Minimal necessary Gmail scopes (read/modify/settings.basic)
- All email content processing is kept local in the extension

## Official documentation references

- Gmail API overview: https://developers.google.com/gmail/api
- messages.list: https://developers.google.com/gmail/api/reference/rest/v1/users.messages/list
- messages.get: https://developers.google.com/gmail/api/reference/rest/v1/users.messages/get
- messages.batchModify: https://developers.google.com/gmail/api/reference/rest/v1/users.messages/batchModify
- Gmail labels: https://developers.google.com/gmail/api/reference/rest/v1/users.labels
- Google OAuth 2.0 (installed apps): https://developers.google.com/identity/protocols/oauth2
- Chrome Identity API: https://developer.chrome.com/docs/extensions/reference/identity

## FAQ

- Nothing shows up?
  - Make sure OAuth is completed and scopes granted
  - You may not have emails matching the search queries yet
  - Check network status and API quota

- Loading seems slow?
  - Fetching and processing emails may take a few seconds, especially the first time

- Categorization looks off?
  - Categorization is keyword-based and intentionally simple. Use the manual whitelist to refine results

## Change log

- Current: Auto-detection per mode, top sender display, live filtering, robust error handling and retries

Last updated: 2024