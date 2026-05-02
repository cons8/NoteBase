// Tab management
import { state, elements, createTab, getCurrentTab, saveTabs } from './state.js';
import { renderCurrentView, getDomainFromUrl } from './render.js';
import { updateUI, showToast } from './ui.js';
import { fetchContent } from './fetch.js';
import { MAX_TABS } from './config.js';

// We import exportContent lazily to avoid circular dependency
let exportContentRef = null;
export function setExportContentRef(fn) {
  exportContentRef = fn;
}

// Create new tab
export function createNewTab() {
  if (state.tabs.length >= MAX_TABS) {
    showToast(`最多只能打开 ${MAX_TABS} 个标签页`, 'error');
    return;
  }
  const tab = createTab();
  state.tabs.push(tab);
  switchToTab(tab.id);
  saveTabs();
}

// Switch to tab
export function switchToTab(tabId) {
  // Exit any active edit mode first
  const editingEl = document.querySelector('.selectable.editing');
  if (editingEl) {
    editingEl.contentEditable = 'false';
    editingEl.classList.remove('editing');
  }

  state.activeTabId = tabId;
  const tab = getCurrentTab();

  // Update URL input
  elements.urlInput.value = tab.url || '';
  elements.keepImages.checked = tab.keepImages !== false;

  // Update sidebar tab styling
  renderSidebarTabs();

  // Render content
  renderCurrentView();
  updateUI();
  saveTabs();
}

// Close tab
export function closeTab(tabId, e) {
  if (e) e.stopPropagation();

  const index = state.tabs.findIndex(t => t.id === tabId);
  if (index === -1) return;

  const tab = state.tabs[index];
  const hasContent = tab.currentHtml && tab.currentHtml.length > 0;

  // Don't close if it's the last tab - reset instead
  if (state.tabs.length === 1) {
    if (hasContent) {
      // Show confirmation modal
      state.pendingCloseTabId = tabId;
      showCloseConfirmationModal();
    } else {
      // Reset the tab
      Object.assign(tab, createTab());
      switchToTab(tab.id);
      saveTabs();
    }
    return;
  }

  // If has content, show confirmation
  if (hasContent) {
    state.pendingCloseTabId = tabId;
    showCloseConfirmationModal();
    return;
  }

  // No content, close directly
  performCloseTab(tabId);
}

// Perform actual tab close
function performCloseTab(tabId) {
  const index = state.tabs.findIndex(t => t.id === tabId);
  if (index === -1) return;

  state.tabs.splice(index, 1);

  // If closing active tab, switch to another
  if (state.activeTabId === tabId) {
    const newIndex = Math.min(index, state.tabs.length - 1);
    state.activeTabId = state.tabs[newIndex].id;
  }

  renderSidebarTabs();
  switchToTab(state.activeTabId);
  saveTabs();
}

// Show close confirmation modal
function showCloseConfirmationModal() {
  elements.closeModalMessage.textContent = '这个标签页有未保存的内容，确定要关闭吗？';
  elements.closeModal.classList.add('show');
}

// Handle save and close
export function saveAndClose() {
  const tab = state.tabs.find(t => t.id === state.pendingCloseTabId);
  if (tab) {
    // Download first, then close
    if (exportContentRef) {
      exportContentRef(true);
    }
  }
  elements.closeModal.classList.remove('show');
  // Close after download
  const tabIdToClose = state.pendingCloseTabId;
  state.pendingCloseTabId = null;
  performCloseTab(tabIdToClose);
}

// Handle discard and close
export function discardAndClose() {
  elements.closeModal.classList.remove('show');
  if (state.pendingCloseTabId) {
    performCloseTab(state.pendingCloseTabId);
    state.pendingCloseTabId = null;
  }
}

// Handle cancel close
export function cancelClose() {
  elements.closeModal.classList.remove('show');
  state.pendingCloseTabId = null;
}

// Render sidebar tabs
export function renderSidebarTabs() {
  elements.sidebarTabs.innerHTML = '';

  state.tabs.forEach(tab => {
    const tabEl = document.createElement('div');
    tabEl.className = 'sidebar-tab' + (tab.id === state.activeTabId ? ' active' : '');
    tabEl.dataset.tabId = tab.id;

    const title = document.createElement('span');
    title.className = 'sidebar-tab-title' + (!tab.title ? ' empty' : '');
    title.textContent = tab.title || '新标签页';
    title.dataset.tabId = tab.id;

    // Double-click to rename
    title.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startTabRename(tab.id);
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'sidebar-tab-close';
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    closeBtn.addEventListener('click', (e) => closeTab(tab.id, e));

    // Right-click context menu
    tabEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, tab.id);
    });

    tabEl.appendChild(title);
    tabEl.appendChild(closeBtn);
    tabEl.addEventListener('click', () => switchToTab(tab.id));

    elements.sidebarTabs.appendChild(tabEl);
  });
}

// Start tab rename
function startTabRename(tabId) {
  const titleEl = document.querySelector(`[data-tab-id="${tabId}"].sidebar-tab-title`);
  if (!titleEl) return;

  const currentTitle = titleEl.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'sidebar-tab-title-input';
  input.value = currentTitle === '新标签页' ? '' : currentTitle;

  titleEl.replaceWith(input);
  input.focus();
  input.select();

  const finishRename = () => {
    const newTitle = input.value.trim();
    const tab = state.tabs.find(t => t.id === tabId);
    if (tab && newTitle) {
      tab.title = newTitle;
      saveTabs();
    }
    renderSidebarTabs();
  };

  input.addEventListener('blur', finishRename);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      input.blur();
    } else if (e.key === 'Escape') {
      renderSidebarTabs();
    }
  });
}

// Show context menu
export function showContextMenu(x, y, tabId) {
  state.pendingContextTabId = tabId;
  elements.contextMenu.style.left = x + 'px';
  elements.contextMenu.style.top = y + 'px';
  elements.contextMenu.classList.add('show');
}

// Hide context menu
export function hideContextMenu() {
  elements.contextMenu.classList.remove('show');
}

// Handle context menu action
export function handleContextMenuAction(e) {
  const action = e.target.closest('.context-menu-item')?.dataset.action;
  if (!action) return;

  const tabId = state.pendingContextTabId;
  const tab = state.tabs.find(t => t.id === tabId);

  switch (action) {
    case 'close':
      closeTab(tabId, null);
      break;
    case 'closeOthers':
      // Close all tabs except the selected one
      state.tabs = state.tabs.filter(t => t.id === tabId);
      if (state.tabs.length === 0) {
        state.tabs.push(createTab());
      }
      state.activeTabId = state.tabs[0].id;
      renderSidebarTabs();
      switchToTab(state.activeTabId);
      saveTabs();
      break;
    case 'reload':
      if (tab && tab.url) {
        elements.urlInput.value = tab.url;
        fetchContent();
      }
      break;
    case 'copyUrl':
      if (tab && tab.url) {
        navigator.clipboard.writeText(tab.url);
        showToast('网址已复制', 'success');
      }
      break;
    case 'rename':
      startTabRename(tabId);
      break;
  }

  hideContextMenu();
}