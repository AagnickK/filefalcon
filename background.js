// Utility: Format bytes into human-readable sizes
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return 'Unknown size';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ autoDownload: false });
});

// Clear stored PDFs for a tab when navigating to a new page
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) { // Main frame navigation
    chrome.storage.local.remove(`pdfs_${details.tabId}`);
  }
});

// Clear stored PDFs when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(`pdfs_${tabId}`);
});

// Intercept network requests to detect PDFs
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId < 0) return; // Ignore background-only requests

    let isPdf = false;
    let size = 'Unknown';
    const urlLowerCase = details.url.toLowerCase();

    // Check URL (ignore generic scripts named .pdf.js)
    if (urlLowerCase.includes('.pdf') && !urlLowerCase.includes('.pdf.js')) {
      isPdf = true;
    }

    // Check Response Headers for accurate content-type
    if (details.responseHeaders) {
      for (let header of details.responseHeaders) {
        const headerName = header.name.toLowerCase();
        if (headerName === 'content-type' && header.value.toLowerCase().includes('application/pdf')) {
          isPdf = true;
        }
        if (headerName === 'content-length') {
          size = formatBytes(parseInt(header.value, 10));
        }
      }
    }

    if (isPdf) {
      processPdfDetection(details.tabId, details.url, size);
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

async function processPdfDetection(tabId, url, size) {
  const storageKey = `pdfs_${tabId}`;
  const data = await chrome.storage.local.get([storageKey, 'autoDownload']);
  let pdfs = data[storageKey] || [];
  const autoDownload = data.autoDownload || false;

  // Avoid duplicates
  if (pdfs.some(pdf => pdf.url === url)) return;

  // Extract clean filename
  let filename = 'document.pdf';
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    
    if (lastPart && lastPart.toLowerCase().includes('.pdf')) {
      filename = decodeURIComponent(lastPart);
    } else {
      // Check query parameters (e.g., ?file=doc.pdf)
      const fileParam = urlObj.searchParams.get('file');
      if (fileParam && fileParam.toLowerCase().includes('.pdf')) {
        filename = decodeURIComponent(fileParam.split('/').pop());
      }
    }
  } catch (e) {
    filename = url.split('/').pop().split('?')[0] || 'document.pdf';
  }
  
  if (!filename.toLowerCase().endsWith('.pdf')) filename += '.pdf';

  // Extract domain for filtering
  let domain = 'unknown';
  try {
    domain = new URL(url).hostname;
  } catch (e) {}

  const pdfInfo = { url, filename, size, domain };
  pdfs.push(pdfInfo);

  // Update storage
  await chrome.storage.local.set({ [storageKey]: pdfs });

  // Trigger auto-download if enabled
  if (autoDownload) {
    chrome.downloads.download({ url: url, filename: filename, saveAs: false });
  }
}