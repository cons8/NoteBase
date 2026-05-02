const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/fetch', async (req, res) => {
  const { url, keepImages = true } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ success: false, error: 'Invalid protocol. Use http or https.' });
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, iframe, noscript, svg, canvas, video, audio, form, input, button, .ad, .advertisement, .social-share, .comments, .related-posts, .sidebar, .menu, .navigation, .nav, .footer, .header').remove();

    // Get title
    const title = $('h1').first().text().trim() ||
                  $('title').text().trim() ||
                  parsedUrl.hostname;

    // Get main content - try common content selectors
    let mainContent = '';
    const contentSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.post',
      '.article',
      '#content',
      '.main-content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length && element.text().trim().length > 200) {
        mainContent = element.html();
        break;
      }
    }

    // Fallback to body if no content found
    if (!mainContent || mainContent.length < 200) {
      mainContent = $('body').html();
    }

    // Clean up the HTML
    const cleanedHtml = cleanHtml(mainContent, keepImages);

    res.json({
      success: true,
      title: title,
      content: cleanedHtml,
      originalHtml: html,
      url: url
    });

  } catch (error) {
    console.error('Fetch error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(502).json({ success: false, error: '无法连接到该网站' });
    }
    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({ success: false, error: '连接超时，请检查网址是否正确' });
    }
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: `网页返回错误: ${error.response.status}`
      });
    }

    res.status(500).json({
      success: false,
      error: '无法访问该网址，请检查 URL 或网络连接'
    });
  }
});

function cleanHtml(html, keepImages = true) {
  // Remove comments
  html = html.replace(/<!--[\s\S]*?-->/g, '');

  // Remove inline styles
  html = html.replace(/\s*style="[^"]*"/gi, '');

  // Remove inline scripts
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove inline event handlers
  html = html.replace(/\s*on\w+="[^"]*"/gi, '');
  html = html.replace(/\s*on\w+='[^']*'/gi, '');

  // Remove images if keepImages is false
  if (!keepImages) {
    html = html.replace(/<img[^>]*>/gi, '');
  }

  // Remove class attributes (keep data attributes for selection)
  // But we want to keep some structural classes
  // html = html.replace(/\s*class="[^"]*"/gi, '');

  return html;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NoteBase server running at http://localhost:${PORT}`);
});
