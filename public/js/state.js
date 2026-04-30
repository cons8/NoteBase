// Shared state
import { STORAGE_KEY, MAX_TABS } from './config.js';

// Default tab state factory
export function createTab(url = '') {
  return {
    id: Date.now() + Math.random(),
    url: url,
    title: url ? getDomainFromUrl(url) : '',
    currentHtml: '',
    selectedIds: [],
    history: [],
    historyIndex: -1,
    keepImages: true
  };
}

// Get domain from URL (helper for createTab)
function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// State object
export const state = {
  tabs: [],
  activeTabId: null,
  sidebarWidth: 200,
  pendingCloseTabId: null,
  pendingContextTabId: null,
  isInitialized: false,
  editMode: false
};

// DOM Elements
export const elements = {
  urlInput: document.getElementById('urlInput'),
  fetchBtn: document.getElementById('fetchBtn'),
  keepImages: document.getElementById('keepImages'),
  urlError: document.getElementById('urlError'),
  contentArea: document.getElementById('contentArea'),
  selectionCount: document.getElementById('selectionCount'),
  selectedCount: document.getElementById('selectedCount'),
  deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
  editModeBtn: document.getElementById('editModeBtn'),
  undoBtn: document.getElementById('undoBtn'),
  copyBtn: document.getElementById('copyBtn'),
  exportBtn: document.getElementById('exportBtn'),
  toast: document.getElementById('toast'),
  exportModal: document.getElementById('exportModal'),
  modalTitle: document.getElementById('modalTitle'),
  exportCode: document.getElementById('exportCode'),
  closeExportModal: document.getElementById('closeExportModal'),
  closeModal: document.getElementById('closeModal'),
  closeModalMessage: document.getElementById('closeModalMessage'),
  closeCloseModal: document.getElementById('closeCloseModal'),
  saveAndCloseBtn: document.getElementById('saveAndCloseBtn'),
  discardAndCloseBtn: document.getElementById('discardAndCloseBtn'),
  cancelCloseBtn: document.getElementById('cancelCloseBtn'),
  copyExportBtn: document.getElementById('copyExportBtn'),
  downloadExportBtn: document.getElementById('downloadExportBtn'),
  keepCssLabel: document.getElementById('keepCssLabel'),
  keepCss: document.getElementById('keepCss'),
  helpBtn: document.getElementById('helpBtn'),
  helpModal: document.getElementById('helpModal'),
  closeHelpModal: document.getElementById('closeHelpModal'),
  sidebarTabs: document.getElementById('sidebarTabs'),
  newTabBtn: document.getElementById('newTabBtn'),
  sidebar: document.querySelector('.sidebar'),
  resizeHandle: document.getElementById('resizeHandle'),
  contextMenu: document.getElementById('contextMenu')
};

// Turndown service for Markdown conversion
export let turndownService = null;
export let selectIdCounter = 0;

// Get current tab
export function getCurrentTab() {
  return state.tabs.find(t => t.id === state.activeTabId);
}

// Load tabs from localStorage
export function loadTabsFromStorage() {
  let tabs = [];
  let activeTabId = null;
  let sidebarWidth = 200;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      if (Array.isArray(data.tabs) && data.tabs.length > 0) {
        tabs = data.tabs.map(tab => ({
          ...tab,
          history: tab.history || [],
          historyIndex: tab.historyIndex ?? -1
        }));
        activeTabId = data.activeTabId;
        sidebarWidth = data.sidebarWidth || 200;
      }
    }
  } catch (e) {
    console.error('Failed to load tabs:', e);
    localStorage.removeItem(STORAGE_KEY);
  }

  return { tabs, activeTabId, sidebarWidth };
}

// Save tabs to localStorage
export function saveTabs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      sidebarWidth: state.sidebarWidth
    }));
  } catch (e) {
    console.error('Failed to save tabs:', e);
  }
}