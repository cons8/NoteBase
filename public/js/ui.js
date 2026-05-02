// UI helpers
import { elements, getCurrentTab } from './state.js';

// Close modal
export function closeModal() {
  elements.exportModal.classList.remove('show');
  elements.closeModal.classList.remove('show');
}

// Update UI state
export function updateUI() {
  const tab = getCurrentTab();
  const hasContent = tab.currentHtml.length > 0;
  const hasSelection = tab.selectedIds.length > 0;
  const canUndo = tab.historyIndex >= 0;

  elements.selectionCount.textContent = hasSelection
    ? `已选择 ${tab.selectedIds.length} 项`
    : '';
  elements.selectedCount.textContent = tab.selectedIds.length;

  elements.deleteSelectedBtn.disabled = !hasSelection;
  elements.undoBtn.disabled = !canUndo;
  elements.exportBtn.disabled = !hasContent;
  elements.copyBtn.disabled = !hasContent;
}

// Set loading state
export function setLoading(loading) {
  const tab = getCurrentTab();
  tab.isLoading = loading;
  elements.fetchBtn.disabled = loading;
  elements.fetchBtn.classList.toggle('loading', loading);
  elements.urlInput.disabled = loading;
}

// Show error
export function showError(message) {
  elements.urlError.textContent = message;
  elements.urlError.style.display = 'block';
}

// Hide error
export function hideError() {
  elements.urlError.textContent = '';
  elements.urlError.style.display = 'none';
}

// Show toast
export function showToast(message, type = '') {
  elements.toast.textContent = message;
  elements.toast.className = 'toast';
  if (type) {
    elements.toast.classList.add(type);
  }
  elements.toast.classList.add('show');

  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}