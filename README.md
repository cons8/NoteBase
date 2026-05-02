# NoteBase

纯前端静态网页应用，可部署到 GitHub Pages 等静态托管平台。

## 本地运行

```bash
npm install
npm start
```

访问 http://localhost:3000

## 部署到 GitHub Pages

1. 将代码推送到 GitHub 仓库
2. 在仓库 Settings → Pages 中选择 `main` 分支
3. 访问 `https://[username].github.io/[repo-name]`

## 技术说明

- 使用 CORS 代理抓取网页（多个代理备用）
- 纯前端解析 HTML，无需后端
- 依赖：Turndown.js (Markdown 转换)