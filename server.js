const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

let lightningCache = { strikes: [], timestamp: 0 };
const CACHE_TTL = 25000;

function fetchJson(url, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeout || 8000);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://map.blitzortung.org/',
      },
    };
    const req = https.get(url, options, (res) => {
      clearTimeout(timer);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    });
    req.on('error', (err) => { clearTimeout(timer); reject(err); });
  });
}

async function fetchLightning() {
  const now = Date.now();
  if (now - lightningCache.timestamp < CACHE_TTL && lightningCache.strikes.length > 0) {
    return lightningCache.strikes;
  }
  const endpoints = [
    'https://map.blitzortung.org/map_data.json',
    'https://map.blitzortung.org/JSON/data.json',
  ];
  for (const url of endpoints) {
    try {
      const data = await fetchJson(url, 6000);
      if (data && data.dots && Array.isArray(data.dots)) {
        const strikes = data.dots
          .filter(s => s[0] >= 25 && s[0] <= 38 && s[1] >= -15 && s[1] <= -2)
          .map(s => ({ lat: s[0], lon: s[1], time: Date.now() }));
        lightningCache = { strikes, timestamp: now };
        return strikes;
      }
    } catch { }
  }
  return lightningCache.strikes || [];
}

app.get('/api/lightning', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const strikes = await fetchLightning();
    res.json({ success: true, count: strikes.length, strikes, timestamp: new Date().toISOString() });
  } catch {
    res.json({ success: true, count: 0, strikes: [], timestamp: new Date().toISOString() });
  }
});

app.get('/api/radar-timestamp', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const data = await fetchJson('https://api.rainviewer.com/public/weather-maps.json', 5000);
    if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
      res.json({ success: true, timestamp: data.radar.past[data.radar.past.length - 1].time });
    } else res.json({ success: false });
  } catch { res.json({ success: false }); }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log('SIGMET Generator GMMM running on port ' + PORT);
});
