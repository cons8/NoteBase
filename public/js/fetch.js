// Content fetching
import { state, elements, getCurrentTab, saveTabs } from './state.js';
import { showError, hideError, setLoading, showToast, updateUI } from './ui.js';
import { renderCurrentView } from './render.js';
import { renderSidebarTabs } from './tabs.js';

// Validate URL
export function isValidUrl(string) {
  try {
    const url = new URL(string);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (_) {
    return false;
  }
}

// Get domain from URL
export function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// Fetch Content
export async function fetchContent() {
  const tab = getCurrentTab();
  const url = elements.urlInput.value.trim();
  const keepImages = elements.keepImages.checked;

  if (!url) {
    showError('请输入网址');
    return;
  }

  if (!isValidUrl(url)) {
    showError('请输入有效的网址，以 http:// 或 https:// 开头');
    return;
  }

  setLoading(true);
  hideError();

  try {
    const response = await fetch('/api/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, keepImages })
    });

    const data = await response.json();

    if (!data.success) {
      showError(data.error || '获取内容失败');
      return;
    }

    // Update tab state
    tab.url = url;
    tab.title = data.title || getDomainFromUrl(url);
    tab.currentHtml = data.content;
    tab.selectedIds = [];
    tab.history = [];
    tab.historyIndex = -1;
    tab.keepImages = keepImages;
    state.editingId = null;

    // Update URL input and keepImages checkbox
    elements.urlInput.value = url;
    elements.keepImages.checked = keepImages;

    renderSidebarTabs();
    renderCurrentView();
    updateUI();
    saveTabs();
    showToast('内容抓取成功', 'success');

  } catch (error) {
    showError('网络错误，请检查连接后重试');
    console.error('Fetch error:', error);
  } finally {
    setLoading(false);
  }
}