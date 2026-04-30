// Event bindings
import { state, elements, getCurrentTab, saveTabs } from './state.js';
import { fetchContent } from './fetch.js';
import { toggleEditMode, deleteSelected } from './selection.js';
import { undo } from './history.js';
import { exportContent, copyToClipboard, updateExportPreview, copyModalContent, downloadModalContent } from './export.js';
import { closeModal } from './ui.js';
import { createNewTab, cancelClose, saveAndClose, discardAndClose, hideContextMenu, handleContextMenuAction } from './tabs.js';

// Bind all events
export function bindEvents() {
  // URL input events
  elements.urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      fetchContent();
    }
  });

  elements.fetchBtn.addEventListener('click', fetchContent);

  // Button click events
  elements.deleteSelectedBtn.addEventListener('click', deleteSelected);
  elements.editModeBtn.addEventListener('click', toggleEditMode);
  elements.undoBtn.addEventListener('click', undo);
  elements.exportBtn.addEventListener('click', () => exportContent());
  elements.copyBtn.addEventListener('click', copyToClipboard);

  // Export modal events
  elements.copyExportBtn.addEventListener('click', copyModalContent);
  elements.downloadExportBtn.addEventListener('click', downloadModalContent);
  elements.closeExportModal.addEventListener('click', closeModal);

  elements.exportModal.addEventListener('click', (e) => {
    if (e.target === elements.exportModal) {
      closeModal();
    }
  });

  // Help modal events
  elements.helpBtn.addEventListener('click', () => {
    elements.helpModal.classList.add('show');
  });

  elements.closeHelpModal.addEventListener('click', () => {
    elements.helpModal.classList.remove('show');
  });

  elements.helpModal.addEventListener('click', (e) => {
    if (e.target === elements.helpModal) {
      elements.helpModal.classList.remove('show');
    }
  });

  // New tab button
  elements.newTabBtn.addEventListener('click', () => createNewTab());

  // Close confirmation modal events
  elements.closeCloseModal.addEventListener('click', cancelClose);
  elements.saveAndCloseBtn.addEventListener('click', saveAndClose);
  elements.discardAndCloseBtn.addEventListener('click', discardAndClose);
  elements.cancelCloseBtn.addEventListener('click', cancelClose);

  elements.closeModal.addEventListener('click', (e) => {
    if (e.target === elements.closeModal) {
      cancelClose();
    }
  });

  // Export format radio change
  document.querySelectorAll('input[name="exportFormat"]').forEach(radio => {
    radio.addEventListener('change', updateExportPreview);
  });

  // Context menu events
  elements.contextMenu.addEventListener('click', handleContextMenuAction);
  document.addEventListener('click', hideContextMenu);

  // Resize handle events
  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  elements.resizeHandle.addEventListener('mousedown', (e) => {
    if (state.sidebarCollapsed) return;
    isResizing = true;
    startX = e.clientX;
    startWidth = state.sidebarWidth;
    elements.resizeHandle.classList.add('active');
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const diff = e.clientX - startX;
    const newWidth = Math.max(120, Math.min(400, startWidth + diff));
    state.sidebarWidth = newWidth;
    elements.sidebar.style.width = newWidth + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      elements.resizeHandle.classList.remove('active');
      document.body.style.cursor = '';
      saveTabs();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (document.activeElement === document.body && getCurrentTab().selectedIds.length > 0) {
        e.preventDefault();
        deleteSelected();
      }
    }
    if (e.key === 'Escape') {
      closeModal();
      elements.helpModal.classList.remove('show');
      elements.closeModal.classList.remove('show');
      hideContextMenu();
      // Cancel edit mode if active
      if (state.editMode) {
        toggleEditMode();
      }
    }
  });
}