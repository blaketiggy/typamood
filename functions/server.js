const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

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

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://jjjfmsszuiofinrobgln.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamZtc3N6dWlvZmlucm9iZ2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMDEwNDcsImV4cCI6MjA2OTY3NzA0N30.qRqM6YsrNgquw-2aA6WYzMqoq_PM82M5vz_rQ89GH94';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase key available:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase client created');

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Product image extraction endpoint
app.get('/api/extract-product-image', async (req, res) => {
  try {
    console.log('Product image extraction requested');
    const { url } = req.query;
    
    if (!url) {
      console.log('No URL provided');
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log('Extracting product image from:', url);
    
    // Amazon extraction
    if (url.includes('amazon.com')) {
      const productId = url.match(/\/dp\/([A-Z0-9]{10})/);
      if (productId) {
        const asin = productId[1];
        console.log('Found Amazon ASIN:', asin);
        
        // Try Amazon image URL formats
        const imageUrls = [
          `https://m.media-amazon.com/images/I/71${asin}._AC_SL1500_.jpg`,
          `https://m.media-amazon.com/images/I/${asin}._AC_SL1500_.jpg`,
          `https://m.media-amazon.com/images/I/71${asin}.jpg`,
          `https://m.media-amazon.com/images/I/${asin}.jpg`
        ];
        
        for (let imageUrl of imageUrls) {
          try {
            console.log('Trying Amazon image URL:', imageUrl);
            const response = await fetch(imageUrl);
            
            if (response.ok) {
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.startsWith('image/')) {
                console.log('Found working Amazon image URL:', imageUrl);
                return res.json({ imageUrl });
              }
            }
          } catch (e) {
            console.log('Failed to check:', imageUrl, e.message);
          }
        }
      }
    }
    
    // Walmart extraction
    if (url.includes('walmart.com')) {
      const productId = url.match(/\/ip\/([^\/\?]+)/);
      if (productId) {
        const walmartId = productId[1];
        console.log('Found Walmart product ID:', walmartId);
        
        const imageUrls = [
          `https://i5.walmartimages.com/asr/${walmartId}.jpeg`,
          `https://i5.walmartimages.com/asr/${walmartId}.jpg`
        ];
        
        for (let imageUrl of imageUrls) {
          try {
            console.log('Trying Walmart image URL:', imageUrl);
            const response = await fetch(imageUrl);
            
            if (response.ok) {
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.startsWith('image/')) {
                console.log('Found working Walmart image URL:', imageUrl);
                return res.json({ imageUrl });
              }
            }
          } catch (e) {
            console.log('Failed to check:', imageUrl, e.message);
          }
        }
      }
    }
    
    // Generic HTML extraction
    console.log('Trying to extract from page HTML...');
    try {
      const response = await fetch(url);
      if (response.ok) {
        const html = await response.text();
        
        // Look for common image patterns
        const imageMatches = html.match(/https:\/\/[^"]*\.(jpg|jpeg|png|webp)/gi);
        if (imageMatches && imageMatches.length > 0) {
          // Filter out small images and common non-product images
          const productImages = imageMatches.filter(img => 
            !img.includes('logo') && 
            !img.includes('icon') && 
            !img.includes('banner') &&
            !img.includes('ad') &&
            img.length > 50
          );
          
          if (productImages.length > 0) {
            console.log('Found product images in HTML:', productImages.slice(0, 3));
            return res.json({ imageUrl: productImages[0] });
          }
        }
      }
    } catch (e) {
      console.log('HTML extraction failed:', e.message);
    }
    
    console.log('Product image extraction failed');
    return res.status(404).json({ error: 'No valid image found' });
    
  } catch (error) {
    console.error('Error extracting product image:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Moodboard publishing endpoint
app.post('/api/publish-moodboard', async (req, res) => {
  try {
    const { title, images, userId } = req.body;
    
    if (!title || !images || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log('Publishing moodboard:', { title, imageCount: images.length, userId });
    
    const { data, error } = await supabase
      .from('moodboards')
      .insert([
        {
          title: title,
          images: images,
          user_id: userId
        }
      ])
      .select();
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to save moodboard' });
    }
    
    console.log('Moodboard saved successfully:', data[0].id);
    res.json({ id: data[0].id, message: 'Moodboard published successfully' });
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's moodboards
app.get('/api/moodboards/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('moodboards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch moodboards' });
    }
    
    res.json(data);
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete moodboard
app.delete('/api/moodboards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('moodboards')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to delete moodboard' });
    }
    
    res.json({ message: 'Moodboard deleted successfully' });
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

console.log('Server setup complete');

// Export for Netlify Functions
exports.handler = app; 