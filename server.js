const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let browser = null;
let currentPlatform = null;
let waitingForUser = false;
let extractedKeys = [];

// Start session
app.post('/start', async (req, res) => {
  const { platforms } = req.body;
  
  if (!browser) {
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  
  waitingForUser = true;
  currentPlatform = platforms[0];
  
  const page = await browser.newPage();
  await page.goto('https://www.google.com'); // Temporary
  
  res.json({ 
    message: 'Browser ready! Please login manually in the browser window that opened.',
    waitingForUser: true 
  });
});

// Resume after manual OTP/login
app.post('/resume', async (req, res) => {
  waitingForUser = false;
  
  // Navigate to API settings (example for OpenAI)
  const pages = await browser.pages();
  const page = pages[pages.length - 1];
  
  await page.goto('https://platform.openai.com/api-keys');
  await page.waitForTimeout(3580);
  
  // Extract API keys from page
  const keys = await page.evaluate(() => {
    const elements = document.querySelectorAll('[class*="key"], [class*="api"]');
    const foundKeys = [];
    elements.forEach(el => {
      const text = el.innerText;
      if (text && (text.includes('sk-') || text.includes('api'))) {
        foundKeys.push(text);
      }
    });
    return foundKeys;
  });
  
  extractedKeys.push({
    platform: currentPlatform,
    keys: keys,
    timestamp: new Date().toISOString()
  });
  
  res.json({ keys: extractedKeys });
});

// Get all extracted keys
app.get('/keys', (req, res) => {
  res.json(extractedKeys);
});

app.listen(3580, () => {
  console.log('API Collector Agent running on port 3580');
});
