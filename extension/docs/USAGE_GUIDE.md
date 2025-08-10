# Gmail Cleaner - Mode-Based Email Filtering (English)

## Overview

Gmail Cleaner now supports intelligent mode-based email filtering that automatically shows only relevant emails on your Gmail page based on your selected mode.

## Features

### 1. Three Smart Modes
- **💼 Working Mode**: Shows work-related emails (meetings, projects, business correspondence)
- **🛍️ Shopping Mode**: Shows shopping-related emails (orders, receipts, deliveries, promotions)
- **🔍 Job Hunting Mode**: Shows job-related emails (applications, recruitments, opportunities)

### 2. Two Types of Email Sources
- **Auto-Detected Emails**: Automatically finds relevant emails using AI categorization
- **Manual White List**: Add specific email addresses you always want to see in this mode

### 3. Real-Time Gmail Page Filtering
When you enable a mode, Gmail Cleaner will:
- Hide irrelevant emails from your Gmail inbox view
- Show a visual filter indicator at the top of the page
- Display email count (visible/hidden)
- Work across all Gmail views (Inbox, Sent, etc.)

## How to Use

### Step 1: Enable a Mode
1. Click the Gmail Cleaner button (K icon) in your Gmail toolbar
2. In the side panel, choose your desired mode:
   - Click the toggle switch next to "Working", "Shopping", or "Job Hunting"
3. The system will automatically:
   - Search for relevant emails in your account
   - Show top 5 email senders for that category
   - Start filtering your Gmail page immediately

### Step 2: Review Auto-Detected Emails
After enabling a mode, you'll see:
- **Top Email Senders**: List of the most frequent senders for this category
- **Email Count Badge**: Shows how many emails from each sender
- **Ranking**: Numbered from #1 (most emails) to #5 (least emails)

### Step 3: Add Manual White List (Optional)
1. Click "Add email lists ▼" to expand the manual section
2. Type an email address you want to always see in this mode
3. Click the "+" button to add it
4. These emails will be included alongside auto-detected ones

### Step 4: See Filtered Results
Once a mode is active:
- Gmail page will show only relevant emails
- A pink filter indicator appears at the top: "🎯 Filter Active: [Mode Name]"
- Counter shows: "📧 Showing X emails (Y hidden)"
- All irrelevant emails are hidden from view

## Advanced Features

### Multiple Modes
- You can enable multiple modes simultaneously
- Filter indicator will show: "💼 Working + 🛍️ Shopping"
- Emails matching ANY active mode will be visible

### Navigation Support
- Filtering works across all Gmail sections (Inbox, Sent, Drafts, etc.)
- Automatically refreshes when you navigate between Gmail pages
- Maintains filter state during your session

### Manual Refresh
- Press `Ctrl+Shift+F` to manually refresh the filter
- Useful if new emails arrive or filter seems outdated

### Filter Management
- Turn off all modes to see all emails again
- Settings are automatically saved and persist between sessions
- Each mode remembers its own detected emails and white list

## Visual Indicators

### Filter Status Bar
When filtering is active, you'll see a pink bar at the top of Gmail:
```
🎯 Working | 📧 Showing 25 emails (147 hidden)
```

### Mode Panel States
- **Mode OFF**: Gray toggle, collapsed content
- **Mode ON**: Pink toggle, expanded content showing detected emails
- **Loading**: Shows "Loading..." when scanning for emails

### Email Display
- **Visible emails**: Normal display
- **Hidden emails**: Completely hidden from view
- **Detected emails**: Shown in side panel with sender count badges

## Troubleshooting

### No Emails Detected
If no emails are found for a mode:
1. Check if you have emails matching that category
2. Try a different search query in Gmail to verify
3. Add known relevant emails to the manual white list

### Filter Not Working
1. Press `Ctrl+Shift+F` to manually refresh
2. Turn the mode off and on again
3. Check browser console for any error messages
4. Ensure you're logged into Gmail with proper permissions

### Performance
- Initial email scanning may take 10-30 seconds
- Filtering is instant once emails are detected
- Large inboxes (>10,000 emails) may have slower initial scan

## Tips for Best Results

1. **Start with one mode** to understand how it works
2. **Review auto-detected emails** before relying fully on filtering
3. **Add important senders manually** to ensure they're never hidden
4. **Use multiple modes** when you need to see different types of emails
5. **Turn off all modes** when you need to see everything

## Technical Notes
Official documentation links:
- Gmail API overview: https://developers.google.com/gmail/api
- messages.list: https://developers.google.com/gmail/api/reference/rest/v1/users.messages/list
- messages.get: https://developers.google.com/gmail/api/reference/rest/v1/users.messages/get
- messages.batchModify: https://developers.google.com/gmail/api/reference/rest/v1/users.messages/batchModify
- Google OAuth 2.0: https://developers.google.com/identity/protocols/oauth2
- Chrome Identity API: https://developer.chrome.com/docs/extensions/reference/identity

- Settings are stored locally in Chrome storage
- No emails are modified or deleted - only hidden from view
- Works with all Gmail views and layouts
- Compatible with Gmail's single-page application navigation
- Respects Gmail's existing filters and labels 