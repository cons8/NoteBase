// Export functionality
import { state, elements, getCurrentTab, turndownService, saveTabs } from './state.js';
import { showToast, closeModal } from './ui.js';

// Simple HTML to Markdown converter
export function htmlToMarkdown(html) {
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
      case 'table': return content + '\n';
      case 'thead':
      case 'tbody':
      case 'tr': return content;
      case 'th':
      case 'td': return `| ${content} `;
      case 'div':
      case 'section':
      case 'article':
      case 'span':
      case 'header':
      case 'footer':
      case 'aside':
      case 'nav': return content;
      default: return content;
    }
  }

  return Array.from(tempDiv.childNodes).map(processNode).join('').trim();
}

// Wrap HTML content with basic CSS
function wrapHtmlWithCss(html) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NoteBase Export</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.7;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #1e293b;
    }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; line-height: 1.3; }
    h1 { font-size: 1.75rem; } h2 { font-size: 1.5rem; } h3 { font-size: 1.25rem; }
    p { margin-bottom: 1em; }
    img { max-width: 100%; height: auto; border-radius: 4px; margin: 1em 0; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul, ol { margin-bottom: 1em; padding-left: 1.5em; }
    li { margin-bottom: 0.25em; }
    blockquote { border-left: 3px solid #2563eb; padding-left: 1em; margin: 1em 0; color: #64748b; font-style: italic; }
    pre { background: #1e293b; color: #e2e8f0; padding: 1em; border-radius: 6px; overflow-x: auto; }
    code { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.875em; background: #f1f5f9; padding: 0.2em 0.4em; border-radius: 4px; }
    pre code { background: transparent; padding: 0; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    th, td { border: 1px solid #e2e8f0; padding: 0.5em 1em; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

// Download content directly
function downloadContent(content, format) {
  const isMarkdown = format === 'md';
  const ext = isMarkdown ? 'md' : 'html';
  const mimeType = isMarkdown ? 'text/markdown' : 'text/html';
  const filename = `notebase-export.${ext}`;

  if (!isMarkdown && elements.keepCss.checked) {
    content = wrapHtmlWithCss(content);
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('已开始下载', 'success');
}

// Update export preview based on selected format
export function updateExportPreview() {
  const tab = getCurrentTab();
  const format = document.querySelector('input[name="exportFormat"]:checked').value;

  let content = '';
  let title = '';

  if (format === 'md') {
    if (turndownService) {
      content = turndownService.turndown(tab.currentHtml);
    } else {
      content = htmlToMarkdown(tab.currentHtml);
    }
    title = '导出 Markdown';
    elements.keepCssLabel.style.display = 'none';
  } else {
    content = tab.currentHtml;
    title = '导出 HTML';
    elements.keepCssLabel.style.display = 'flex';
  }

  elements.modalTitle.textContent = title;
  elements.exportCode.textContent = content;
}

// Export content
export function exportContent(silent = false) {
  const tab = getCurrentTab();
  if (tab.currentHtml.length === 0) {
    showToast('没有可导出的内容', 'error');
    return;
  }

  updateExportPreview();

  if (silent) {
    // Direct download without showing modal
    const format = document.querySelector('input[name="exportFormat"]:checked').value;
    const content = elements.exportCode.textContent;
    downloadContent(content, format);
  } else {
    elements.exportModal.classList.add('show');
  }
}

// Copy to clipboard
export async function copyToClipboard() {
  const tab = getCurrentTab();
  if (tab.currentHtml.length === 0) {
    showToast('没有可复制的内容', 'error');
    return;
  }

  let content = '';
  if (turndownService) {
    content = turndownService.turndown(tab.currentHtml);
  } else {
    content = htmlToMarkdown(tab.currentHtml);
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
export async function copyModalContent() {
  try {
    await navigator.clipboard.writeText(elements.exportCode.textContent);
    showToast('已复制到剪贴板', 'success');
    closeModal();
  } catch (err) {
    showToast('复制失败', 'error');
  }
}

// Download modal content
export function downloadModalContent() {
  let content = elements.exportCode.textContent;
  const title = elements.modalTitle.textContent;
  const isMarkdown = title.includes('Markdown');
  const ext = isMarkdown ? 'md' : 'html';
  const mimeType = isMarkdown ? 'text/markdown' : 'text/html';
  const filename = `notebase-export.${ext}`;

  if (!isMarkdown && elements.keepCss.checked) {
    content = wrapHtmlWithCss(content);
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('已开始下载', 'success');
  closeModal();
}