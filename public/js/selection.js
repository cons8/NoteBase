// Element selection
import { state, elements, getCurrentTab, saveTabs } from './state.js';
import { saveHistory } from './history.js';
import { renderCurrentView } from './render.js';
import { updateUI, showToast } from './ui.js';
import { renderSidebarTabs } from './tabs.js';

// Toggle edit mode
export function toggleEditMode() {
  state.editMode = !state.editMode;
  elements.editModeBtn.classList.toggle('active', state.editMode);
  elements.editModeBtn.classList.toggle('primary-btn', state.editMode);

  // Clear any selection when entering edit mode
  if (state.editMode) {
    const tab = getCurrentTab();
    tab.selectedIds = [];
    document.querySelectorAll('.selectable.selected').forEach(el => {
      el.classList.remove('selected');
    });
    // Enable edit on container
    elements.contentArea.contentEditable = 'true';
    elements.contentArea.classList.add('edit-mode');
    updateUI();
    saveTabs();
  } else {
    // Disable edit mode
    elements.contentArea.contentEditable = 'false';
    elements.contentArea.classList.remove('edit-mode');
    // Save content
    const tab = getCurrentTab();
    saveHistory();
    tab.currentHtml = elements.contentArea.innerHTML;
    saveTabs();
    // Re-render to restore selectable state
    renderCurrentView();
  }
}

// Handle element click - only for selection mode
export function handleElementClick(e) {
  if (state.editMode) return;

  e.stopPropagation();
  const tab = getCurrentTab();
  const element = e.currentTarget;
  const id = element.dataset.selectId;

  // Selection mode
  if (element.classList.contains('selected')) {
    element.classList.remove('selected');
    tab.selectedIds = tab.selectedIds.filter(elId => elId != id);
  } else {
    element.classList.add('selected');
    tab.selectedIds.push(id);
  }

  updateUI();
  saveTabs();
}

// Delete selected elements
export function deleteSelected() {
  const tab = getCurrentTab();
  if (tab.selectedIds.length === 0) return;

  saveHistory();

  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = tab.currentHtml;

  tab.selectedIds.forEach(id => {
    const el = tempContainer.querySelector(`[data-select-id="${id}"]`);
    if (el) {
      el.remove();
    }
  });

  tab.currentHtml = tempContainer.innerHTML;
  tab.selectedIds = [];

  renderCurrentView();
  updateUI();
  saveTabs();
  showToast('已删除选中的内容');
}