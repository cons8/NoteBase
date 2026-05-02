// History management
import { getCurrentTab, saveTabs } from './state.js';
import { renderCurrentView } from './render.js';
import { updateUI, showToast } from './ui.js';

// Save to history
export function saveHistory() {
  const tab = getCurrentTab();
  tab.history = tab.history.slice(0, tab.historyIndex + 1);
  tab.history.push(tab.currentHtml);
  tab.historyIndex++;

  if (tab.history.length > 50) {
    tab.history.shift();
    tab.historyIndex--;
  }
}

// Undo
export function undo() {
  const tab = getCurrentTab();
  if (tab.historyIndex < 0) return;

  tab.currentHtml = tab.history[tab.historyIndex];
  tab.historyIndex--;
  tab.selectedIds = [];

  renderCurrentView();
  updateUI();
  saveTabs();

  if (tab.historyIndex >= 0) {
    showToast('已撤销');
  } else {
    showToast('没有可撤销的操作');
  }
}