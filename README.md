# NoteBase

> 智能文章采集与清洗工具 - 输入网址，删除不需要的内容，导出干净的学习文档

[![Deploy to GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue)](https://cons8.github.io/NoteBase/)

[在线演示](https://cons8.github.io/NoteBase/) | [English](#english)

---

## 功能特点

- **网页抓取** - 输入网址，一键获取文章内容
- **可视化选择** - 点击区块快速删除不需要的内容
- **直接编辑** - 切换编辑模式，像文本编辑器一样修改
- **多标签管理** - 同时处理多篇文章
- **导出灵活** - 支持 Markdown 和 HTML 格式

## 使用方法

### 本地运行

```bash
npm install
npm start
```

访问 http://localhost:3000

### 部署到 GitHub Pages

1. Fork 或克隆本仓库
2. 仓库 Settings → Pages → Source: `master` 分支
3. 访问 `https://[username].github.io/notebase/`

## 技术栈

- 纯前端实现（HTML + CSS + JavaScript ES Modules）
- CORS 代理抓取网页（多个备用代理）
- Turndown.js 转 Markdown
- 无需后端，可部署到任意静态托管平台

## 项目结构

```
notebase/
├── public/
│   ├── index.html      # 主页面
│   ├── styles.css      # 样式文件
│   ├── js/             # JavaScript 模块
│   └── turndown.min.js # Markdown 转换库
├── package.json
└── README.md
```

## 许可证

MIT License

---

## English

**NoteBase** is a web clipping tool that helps you collect and clean article content from any URL.

### Features

- Fetch articles from any URL
- Visually select and remove unwanted content blocks
- Direct editing mode like a text editor
- Multi-tab support for managing multiple articles
- Export to Markdown or HTML

### Quick Start

```bash
npm install
npm start
```

Visit http://localhost:3000

### Deploy

Deploy to GitHub Pages by enabling Pages on the master branch.