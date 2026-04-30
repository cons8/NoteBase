# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NoteBase is a Node.js web application for collecting and cleaning article content from web pages. Users input a URL, visually select and delete unwanted content blocks, then export clean Markdown or HTML for study notes.

## Commands

```bash
npm start    # Start the server (runs server.js)
npm run dev  # Alias for npm start
```

The server runs at http://localhost:3000

## Architecture

```
NoteBase/
├── server.js           # Express server with single /api/fetch endpoint
├── public/
│   ├── index.html       # Main page
│   ├── styles.css       # Styles
│   └── app.js           # Frontend SPA logic
└── package.json
```

### Backend (server.js)

- Express server on port 3000 (configurable via PORT env var)
- `POST /api/fetch` - Fetches URL via axios, parses with cheerio, removes scripts/styles/navs/footers/ads, returns cleaned HTML
- `GET /` - Serves public/index.html
- Static files served from `public/`

### Frontend (public/app.js)

- Single-page application with two-panel layout
- Left panel: Original HTML with clickable/removable elements (div, p, h1-h6, section, article, etc.)
- Right panel: Live preview of cleaned content
- Element selection works by building CSS selector paths and matching against cloned HTML
- History system (max 50 states) for undo functionality
- Markdown export uses TurndownService (with fallback htmlToMarkdown function)
- State managed in a single `state` object with `currentHtml`, `selectedElements`, `history`

### Key Dependencies

- `express` - Web server
- `axios` - HTTP client for fetching URLs
- `cheerio` - Server-side HTML parsing
- `turndown` - HTML to Markdown conversion
- `cors` - CORS support

## Implementation Notes

- The element selection system uses `getElementPath()` to build selector paths, then matches against cloned containers
- When elements are selected for deletion, they're matched by selector path in `updateCleanedPreview()` and `deleteSelected()`
- Undo works by storing HTML snapshots in `state.history` array
- The server-side `cleanHtml()` removes comments, inline styles, scripts, and event handlers but preserves structural classes
