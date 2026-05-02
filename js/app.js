// NoteBase Frontend Application - Entry Point

import { state, elements, loadTabsFromStorage, saveTabs, createTab } from './state.js';
import { createNewTab, switchToTab, renderSidebarTabs, setExportContentRef } from './tabs.js';
import { updateUI } from './ui.js';
import { bindEvents } from './events.js';
import { exportContent } from './export.js';

// Initialize
function init() {
  // Prevent double initialization
  if (state.isInitialized) return;
  state.isInitialized = true;

  // Initialize TurndownService
  if (typeof TurndownService !== 'undefined') {
    state.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*'
    });
  }

  // Set up export content reference for tabs.js
  setExportContentRef(exportContent);

  // Load tabs first to get state
  const savedData = loadTabsFromStorage();
  state.tabs = savedData.tabs;
  state.activeTabId = savedData.activeTabId;
  state.sidebarWidth = savedData.sidebarWidth;

  // Ensure at least one tab
  if (state.tabs.length === 0) {
    state.tabs.push(createTab());
  }

  // Ensure active tab exists
  if (!state.activeTabId || !state.tabs.find(t => t.id === state.activeTabId)) {
    state.activeTabId = state.tabs[0].id;
  }

  // Update sidebar width
  elements.sidebar.style.width = state.sidebarWidth + 'px';

  // Render sidebar tabs
  renderSidebarTabs();

  // Then bind events and switch to tab
  bindEvents();
  switchToTab(state.activeTabId);
  updateUI();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}