const express = require('express');

console.log('Server starting...');

const app = express();
app.use(express.json({ limit: '50mb' }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple product image extraction endpoint
app.get('/api/extract-product-image', async (req, res) => {
  try {
    console.log('Product image extraction requested');
    const { url } = req.query;
    
    if (!url) {
      console.log('No URL provided');
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log('Extracting product image from:', url);
    
    // For now, just return a test response
    res.json({ 
      imageUrl: 'https://via.placeholder.com/300x300/FF0000/FFFFFF?text=Test+Image',
      message: 'Test image returned'
    });
    
  } catch (error) {
    console.error('Error in extract-product-image:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

console.log('Server setup complete');

// Export for Netlify Functions
exports.handler = app; 