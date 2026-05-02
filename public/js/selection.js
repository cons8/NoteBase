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

  // Update icon and label based on mode
  const modeIcon = document.getElementById('modeIcon');
  const modeLabel = document.getElementById('modeLabel');
  if (state.editMode) {
    modeIcon.innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>';
    modeLabel.textContent = '选择';
  } else {
    modeIcon.innerHTML = '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>';
    modeLabel.textContent = '编辑';
  }

  // Clear any selection when entering edit mode
  if (state.editMode) {
    const tab = getCurrentTab();
    tab.selectedIds = [];
    document.querySelectorAll('.selectable').forEach(el => {
      el.classList.remove('selected');
      el.classList.remove('selectable');
    });
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