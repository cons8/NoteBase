// NoteBase Frontend Application

(function() {
  'use strict';

  // State
  const state = {
    originalHtml: '',
    currentHtml: '',
    selectedElements: [],
    history: [],
    historyIndex: -1,
    maxHistory: 50,
    isLoading: false
  };

  // DOM Elements
  const elements = {
    urlInput: document.getElementById('urlInput'),
    fetchBtn: document.getElementById('fetchBtn'),
    urlError: document.getElementById('urlError'),
    originalContent: document.getElementById('originalContent'),
    cleanedContent: document.getElementById('cleanedContent'),
    selectionCount: document.getElementById('selectionCount'),
    selectedCount: document.getElementById('selectedCount'),
    deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
    undoBtn: document.getElementById('undoBtn'),
    exportMdBtn: document.getElementById('exportMdBtn'),
    exportHtmlBtn: document.getElementById('exportHtmlBtn'),
    copyBtn: document.getElementById('copyBtn'),
    toast: document.getElementById('toast'),
    exportModal: document.getElementById('exportModal'),
    modalTitle: document.getElementById('modalTitle'),
    exportCode: document.getElementById('exportCode'),
    closeModal: document.getElementById('closeModal'),
    copyExportBtn: document.getElementById('copyExportBtn')
  };

  // Turndown service for Markdown conversion
  let turndownService = null;

  // Initialize
  function init() {
    if (typeof TurndownService !== 'undefined') {
      turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        emDelimiter: '*'
      });
    }

    bindEvents();
    updateUI();
  }

  // Bind Events
  function bindEvents() {
    elements.urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        fetchContent();
      }
    });

    elements.fetchBtn.addEventListener('click', fetchContent);

    elements.deleteSelectedBtn.addEventListener('click', deleteSelected);
    elements.undoBtn.addEventListener('click', undo);
    elements.exportMdBtn.addEventListener('click', () => exportContent('markdown'));
    elements.exportHtmlBtn.addEventListener('click', () => exportContent('html'));
    elements.copyBtn.addEventListener('click', copyToClipboard);

    elements.closeModal.addEventListener('click', closeModal);
    elements.copyExportBtn.addEventListener('click', copyModalContent);

    elements.exportModal.addEventListener('click', (e) => {
      if (e.target === elements.exportModal) {
        closeModal();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement === document.body && state.selectedElements.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
      }
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  }

  // Validate URL
  function isValidUrl(string) {
    try {
      const url = new URL(string);
      return ['http:', 'https:'].includes(url.protocol);
    } catch (_) {
      return false;
    }
  }

  // Fetch Content
  async function fetchContent() {
    const url = elements.urlInput.value.trim();

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
      const response = await fetch('/api/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!data.success) {
        showError(data.error || '获取内容失败');
        return;
      }

      state.originalHtml = data.content;
      state.currentHtml = data.content;
      state.selectedElements = [];
      state.history = [];
      state.historyIndex = -1;

      renderContent();
      updateUI();
      showToast('内容抓取成功', 'success');

    } catch (error) {
      showError('网络错误，请检查连接后重试');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  // Render Content
  function renderContent() {
    // Make elements selectable in original panel
    const originalContainer = document.createElement('div');
    originalContainer.className = 'editable-content';
    originalContainer.innerHTML = state.currentHtml;

    makeSelectable(originalContainer);

    elements.originalContent.innerHTML = '';
    elements.originalContent.appendChild(originalContainer);

    // Update cleaned panel
    updateCleanedPreview();
  }

  // Make elements selectable
  function makeSelectable(container) {
    const selectableTags = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article', 'aside', 'ul', 'ol', 'li', 'table', 'blockquote', 'pre', 'figure', 'figcaption'];

    function processElement(element) {
      if (element === container) return;

      const tagName = element.tagName.toLowerCase();

      if (selectableTags.includes(tagName) && element.children.length > 0) {
        // Check if element has meaningful content
        const textContent = element.textContent.trim();
        if (textContent.length > 0) {
          element.classList.add('selectable');
          element.addEventListener('click', handleElementClick);
        }
      }

      Array.from(element.children).forEach(child => processElement(child));
    }

    Array.from(container.children).forEach(child => processElement(child));
  }

  // Handle element click
  function handleElementClick(e) {
    e.stopPropagation();
    const element = e.currentTarget;

    if (element.classList.contains('selected')) {
      element.classList.remove('selected');
      state.selectedElements = state.selectedElements.filter(el => el !== element);
    } else {
      element.classList.add('selected');
      state.selectedElements.push(element);
    }

    updateCleanedPreview();
    updateUI();
  }

  // Update cleaned preview
  function updateCleanedPreview() {
    // Clone the current HTML and remove selected elements
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = state.currentHtml;

    state.selectedElements.forEach(selectedEl => {
      // Find the corresponding element in tempContainer
      const selectors = getElementPath(selectedEl);
      let matchedEl = null;

      for (const selector of selectors) {
        const found = tempContainer.querySelector(selector);
        if (found) {
          matchedEl = found;
          break;
        }
      }

      if (matchedEl) {
        matchedEl.remove();
      }
    });

    // Remove selectable classes and listeners for preview
    const previewContent = tempContainer.querySelector('.editable-content') || tempContainer;
    const cleanDiv = document.createElement('div');
    cleanDiv.className = 'editable-content';
    cleanDiv.innerHTML = previewContent.innerHTML;

    // Remove all selectable classes
    cleanDiv.querySelectorAll('.selectable').forEach(el => {
      el.classList.remove('selectable', 'selected');
    });

    elements.cleanedContent.innerHTML = '';
    if (cleanDiv.innerHTML.trim()) {
      elements.cleanedContent.appendChild(cleanDiv);
    } else {
      elements.cleanedContent.innerHTML = `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
          <p>所有内容已删除</p>
        </div>
      `;
    }
  }

  // Get element path for matching
  function getElementPath(element) {
    const path = [];

    function getPath(el) {
      if (el === document.body || el.parentElement === null) return;

      const tagName = el.tagName.toLowerCase();
      const classes = Array.from(el.classList).filter(c => c !== 'selectable' && c !== 'selected');

      let selector = tagName;
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }

      path.push(selector);
      getPath(el.parentElement);
    }

    getPath(element);
    return path;
  }

  // Save to history
  function saveToHistory() {
    // Remove any redo history
    state.history = state.history.slice(0, state.historyIndex + 1);

    // Add current state
    state.history.push(state.currentHtml);
    state.historyIndex++;

    // Limit history size
    if (state.history.length > state.maxHistory) {
      state.history.shift();
      state.historyIndex--;
    }
  }

  // Delete selected elements
  function deleteSelected() {
    if (state.selectedElements.length === 0) return;

    saveToHistory();

    // Remove selected elements from current HTML
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = state.currentHtml;

    state.selectedElements.forEach(selectedEl => {
      const selectors = getElementPath(selectedEl);
      let matchedEl = null;

      for (const selector of selectors) {
        const found = tempContainer.querySelector(selector);
        if (found) {
          matchedEl = found;
          break;
        }
      }

      if (matchedEl) {
        matchedEl.remove();
      }
    });

    state.currentHtml = tempContainer.innerHTML;
    state.selectedElements = [];

    renderContent();
    updateUI();
    showToast('已删除选中的内容');
  }

  // Undo
  function undo() {
    if (state.historyIndex < 0) return;

    state.currentHtml = state.history[state.historyIndex];
    state.historyIndex--;
    state.selectedElements = [];

    renderContent();
    updateUI();

    if (state.historyIndex >= 0) {
      showToast('已撤销');
    } else {
      showToast('没有可撤销的操作');
    }
  }

  // Export content
  function exportContent(format) {
    const cleanedHtml = elements.cleanedContent.querySelector('.editable-content');
    if (!cleanedHtml) {
      showToast('没有可导出的内容', 'error');
      return;
    }

    let content = '';
    let title = '';

    if (format === 'markdown') {
      if (turndownService) {
        content = turndownService.turndown(cleanedHtml.innerHTML);
      } else {
        content = htmlToMarkdown(cleanedHtml.innerHTML);
      }
      title = '导出 Markdown';
    } else {
      content = cleanedHtml.innerHTML;
      title = '导出 HTML';
    }

    elements.modalTitle.textContent = title;
    elements.exportCode.textContent = content;
    elements.exportModal.classList.add('show');
  }

  // Simple HTML to Markdown converter
  function htmlToMarkdown(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }

      const tag = node.tagName.toLowerCase();
      const content = Array.from(node.childNodes).map(processNode).join('');

      switch (tag) {
        case 'h1': return `# ${content}\n\n`;
        case 'h2': return `## ${content}\n\n`;
        case 'h3': return `### ${content}\n\n`;
        case 'h4': return `#### ${content}\n\n`;
        case 'h5': return `##### ${content}\n\n`;
        case 'h6': return `###### ${content}\n\n`;
        case 'p': return `${content}\n\n`;
        case 'br': return '\n';
        case 'strong':
        case 'b': return `**${content}**`;
        case 'em':
        case 'i': return `*${content}*`;
        case 'code': return `\`${content}\``;
        case 'pre': return `\`\`\`\n${content.trim()}\n\`\`\`\n\n`;
        case 'blockquote': return `> ${content.replace(/\n/g, '\n> ')}\n\n`;
        case 'a': return `[${content}](${node.href})`;
        case 'img': return `![${node.alt || ''}](${node.src})`;
        case 'ul': return content + '\n';
        case 'ol': return content + '\n';
        case 'li': return `- ${content}\n`;
        case 'table':
          return content + '\n';
        case 'thead':
        case 'tbody':
        case 'tr':
          return content;
        case 'th':
        case 'td':
          return `| ${content} `;
        case 'div':
        case 'section':
        case 'article':
        case 'span':
        case 'header':
        case 'footer':
        case 'aside':
        case 'nav':
          return content;
        default:
          return content;
      }
    }

    return Array.from(tempDiv.childNodes).map(processNode).join('').trim();
  }

  // Copy to clipboard
  async function copyToClipboard() {
    const cleanedHtml = elements.cleanedContent.querySelector('.editable-content');
    if (!cleanedHtml) {
      showToast('没有可复制的内容', 'error');
      return;
    }

    let content = '';
    if (turndownService) {
      content = turndownService.turndown(cleanedHtml.innerHTML);
    } else {
      content = htmlToMarkdown(cleanedHtml.innerHTML);
    }

    try {
      await navigator.clipboard.writeText(content);
      showToast('已复制到剪贴板', 'success');
    } catch (err) {
      showToast('复制失败', 'error');
      console.error('Copy error:', err);
    }
  }

  // Copy modal content
  async function copyModalContent() {
    try {
      await navigator.clipboard.writeText(elements.exportCode.textContent);
      showToast('已复制到剪贴板', 'success');
      closeModal();
    } catch (err) {
      showToast('复制失败', 'error');
    }
  }

  // Close modal
  function closeModal() {
    elements.exportModal.classList.remove('show');
  }

  // Update UI state
  function updateUI() {
    const hasContent = state.currentHtml.length > 0;
    const hasSelection = state.selectedElements.length > 0;
    const canUndo = state.historyIndex >= 0;

    elements.selectionCount.textContent = hasSelection
      ? `已选择 ${state.selectedElements.length} 项`
      : '';
    elements.selectedCount.textContent = state.selectedElements.length;

    elements.deleteSelectedBtn.disabled = !hasSelection;
    elements.undoBtn.disabled = !canUndo;
    elements.exportMdBtn.disabled = !hasContent || hasSelection;
    elements.exportHtmlBtn.disabled = !hasContent || hasSelection;
    elements.copyBtn.disabled = !hasContent || hasSelection;
  }

  // Set loading state
  function setLoading(loading) {
    state.isLoading = loading;
    elements.fetchBtn.disabled = loading;
    elements.fetchBtn.classList.toggle('loading', loading);
    elements.urlInput.disabled = loading;
  }

  // Show error
  function showError(message) {
    elements.urlError.textContent = message;
  }

  // Hide error
  function hideError() {
    elements.urlError.textContent = '';
  }

  // Show toast
  function showToast(message, type = '') {
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
