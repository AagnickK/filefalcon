# FileFalcon — PDF Detector & Downloader

A Chrome extension that automatically detects and downloads PDF files from any website.

## Features

- Detects PDFs via URL patterns and `Content-Type` response headers
- Displays detected PDFs with filename, domain, and file size
- Download individual PDFs or all at once
- Open PDFs in a new tab without downloading
- Filter PDFs by filename or domain
- Auto-download toggle for hands-free operation
- Clears detected PDFs on page navigation or tab close

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `FileFalcon` folder
5. The extension icon will appear in your Chrome toolbar

## Project Structure

```
FileFalcon/
├── manifest.json     # Extension configuration
├── background.js     # Service worker — intercepts requests & detects PDFs
├── popup.html        # Extension popup UI
├── popup.js          # Popup logic — rendering, filtering, downloading
└── icon.png          # Extension icon
```

## How It Works

- `background.js` listens to all network requests using `chrome.webRequest.onHeadersReceived`
- A PDF is detected if the URL contains `.pdf` or the response has `Content-Type: application/pdf`
- Detected PDFs are stored per-tab using `chrome.storage.local`
- The popup reads from storage and renders the list in real time

## Permissions Used

| Permission | Reason |
|---|---|
| `webRequest` | Intercept network requests to detect PDFs |
| `downloads` | Trigger file downloads |
| `storage` | Store detected PDFs per tab |
| `tabs` | Identify the active tab and open PDFs |
| `webNavigation` | Clear PDF list on page navigation |
