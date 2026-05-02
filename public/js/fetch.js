// Content fetching (Pure Frontend with CORS Proxy)
import { state, elements, getCurrentTab, saveTabs } from './state.js';
import { showError, hideError, setLoading, showToast, updateUI } from './ui.js';
import { renderCurrentView } from './render.js';
import { renderSidebarTabs } from './tabs.js';
import { CORS_PROXIES, getRandomProxy } from './config.js';

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

// Clean HTML content (client-side)
function cleanHtml(html, keepImages = true) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove unwanted elements
  const removeSelectors = [
    'script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe',
    'noscript', 'svg', 'canvas', 'video', 'audio', 'form', 'input',
    'button', '.ad', '.advertisement', '.social-share', '.comments',
    '.related-posts', '.sidebar', '.menu', '.navigation', '.nav',
    '.footer', '.header', '[role="navigation"]', '[role="banner"]',
    '[role="contentinfo"]', 'iframe', 'embed', 'object'
  ];

  removeSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Remove inline scripts
  doc.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Remove images if keepImages is false
  if (!keepImages) {
    doc.querySelectorAll('img').forEach(el => el.remove());
  }

  // Extract title
  const title = doc.querySelector('h1')?.textContent?.trim() ||
                doc.querySelector('title')?.textContent?.trim() ||
                getDomainFromUrl(elements.urlInput.value);

  // Get main content
  let mainContent = '';
  const contentSelectors = [
    'article',
    '[role="main"]',
    'main',
    '.content',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.post',
    '.article',
    '#content',
    '.main-content'
  ];

  for (const selector of contentSelectors) {
    const element = doc.querySelector(selector);
    if (element && element.textContent.trim().length > 200) {
      mainContent = element.innerHTML;
      break;
    }
  }

  // Fallback to body
  if (!mainContent || mainContent.length < 200) {
    mainContent = doc.body?.innerHTML || doc.documentElement.innerHTML;
  }

  return { title, content: mainContent };
}

// Fetch content with CORS proxy
async function fetchWithProxy(url, keepImages) {
  // Try each proxy until one works
  for (const proxyBase of CORS_PROXIES) {
    try {
      const proxyUrl = proxyBase + encodeURIComponent(url);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) continue;
      return await response.text();
    } catch (e) {
      console.warn(`Proxy ${proxyBase} failed:`, e.message);
      continue;
    }
  }
  throw new Error('所有代理服务器均不可用');
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
    // Fetch via CORS proxy
    const html = await fetchWithProxy(url, keepImages);

    // Clean and parse HTML client-side
    const { title, content } = cleanHtml(html, keepImages);

    // Update tab state
    tab.url = url;
    tab.title = title || getDomainFromUrl(url);
    tab.currentHtml = content;
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
    showError(error.message || '网络错误，请检查连接后重试');
    console.error('Fetch error:', error);
  } finally {
    setLoading(false);
  }
}