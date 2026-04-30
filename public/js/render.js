// Content rendering
import { state, elements, getCurrentTab, turndownService, selectIdCounter } from './state.js';
import { handleElementClick } from './selection.js';

// Get domain from URL (helper)
function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// Render current view
export function renderCurrentView() {
  const tab = getCurrentTab();

  if (tab.currentHtml.length === 0) {
    elements.contentArea.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <p>输入网址开始抓取内容</p>
      </div>
    `;
    return;
  }

  renderHtmlView();
}

// Render HTML view (editable)
export function renderHtmlView() {
  const tab = getCurrentTab();
  const container = document.createElement('div');
  container.className = 'editable-content';

  container.innerHTML = tab.currentHtml;
  assignIdsAndLineNumbers(container);
  tab.currentHtml = container.innerHTML; // Persist IDs

  elements.contentArea.innerHTML = '';
  elements.contentArea.appendChild(container);
}

// Assign IDs and line numbers to selectable elements
export function assignIdsAndLineNumbers(container) {
  const selectableTags = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article', 'aside', 'ul', 'ol', 'li', 'table', 'blockquote', 'pre', 'figure', 'figcaption'];
  let lineNumber = 0;

  function processElement(element, isTopLevel) {
    const tagName = element.tagName.toLowerCase();

    if (selectableTags.includes(tagName) && element.children.length > 0) {
      const textContent = element.textContent.trim();
      if (textContent.length > 0) {
        if (isTopLevel) {
          element.dataset.lineNumber = ++lineNumber;
          element.dataset.selectId = ++selectIdCounter;
          element.classList.add('selectable');
          element.addEventListener('click', handleElementClick);
        }
      }
    }

    Array.from(element.children).forEach(child => processElement(child, false));
  }

  Array.from(container.children).forEach(child => processElement(child, true));
}

// Export for tabs.js
export { getDomainFromUrl };