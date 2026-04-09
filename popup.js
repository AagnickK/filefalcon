let currentTabId = null;
let allPdfs = [];

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab.id;

  const storageKey = `pdfs_${currentTabId}`;
  
  // Load settings and data
  chrome.storage.local.get([storageKey, 'autoDownload'], (data) => {
    allPdfs = data[storageKey] || [];
    
    const toggle = document.getElementById('auto-download-toggle');
    toggle.checked = data.autoDownload || false;
    
    toggle.addEventListener('change', (e) => {
      chrome.storage.local.set({ autoDownload: e.target.checked });
    });

    renderPdfs(allPdfs);
  });

  // Handle Search Filter
  document.getElementById('filter-input').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allPdfs.filter(pdf => 
      pdf.filename.toLowerCase().includes(term) || 
      pdf.domain.toLowerCase().includes(term)
    );
    renderPdfs(filtered);
  });

  // Handle Download All
  document.getElementById('download-all-btn').addEventListener('click', () => {
    allPdfs.forEach(pdf => {
      chrome.downloads.download({ url: pdf.url, filename: pdf.filename, saveAs: false });
    });
  });

  // Listen for new PDFs dynamically detected while the popup is open
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[storageKey]) {
      allPdfs = changes[storageKey].newValue || [];
      const term = document.getElementById('filter-input').value.toLowerCase();
      const filtered = allPdfs.filter(pdf => 
        pdf.filename.toLowerCase().includes(term) || 
        pdf.domain.toLowerCase().includes(term)
      );
      renderPdfs(filtered);
    }
  });
});

function renderPdfs(pdfs) {
  const container = document.getElementById('pdf-list');
  const countBadge = document.getElementById('count-badge');
  const downloadAllBtn = document.getElementById('download-all-btn');
  
  container.innerHTML = '';
  countBadge.textContent = `${pdfs.length} Found`;

  if (pdfs.length === 0) {
    container.innerHTML = '<div class="empty-state">No PDFs detected on this page.</div>';
    downloadAllBtn.disabled = true;
    downloadAllBtn.style.opacity = '0.5';
    downloadAllBtn.style.cursor = 'not-allowed';
    return;
  }

  downloadAllBtn.disabled = false;
  downloadAllBtn.style.opacity = '1';
  downloadAllBtn.style.cursor = 'pointer';

  pdfs.forEach((pdf, index) => {
    const item = document.createElement('div');
    item.className = 'pdf-item';
    
    item.innerHTML = `
      <div class="pdf-info">
        <div class="pdf-name">${pdf.filename}</div>
        <div class="pdf-meta">
          <span>${pdf.domain}</span>
          <span>${pdf.size}</span>
        </div>
      </div>
      <div class="btn-group">
        <button class="btn-primary" id="dl-${index}">Download</button>
        <button class="btn-secondary" id="open-${index}">Open</button>
      </div>
    `;
    container.appendChild(item);

    // Event Listeners for buttons
    document.getElementById(`dl-${index}`).addEventListener('click', () => {
      chrome.downloads.download({ url: pdf.url, filename: pdf.filename, saveAs: false });
    });

    document.getElementById(`open-${index}`).addEventListener('click', () => {
      chrome.tabs.create({ url: pdf.url, active: false });
    });
  });
}