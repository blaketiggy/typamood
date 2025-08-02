const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://jjjfmsszuiofinrobgln.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamZtc3N6dWlvZmlucm9iZ2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMDEwNDcsImV4cCI6MjA2OTY3NzA0N30.qRqM6YsrNgquw-2aA6WYzMqoq_PM82M5vz_rQ89GH94';

console.log('Initializing Supabase client with URL:', supabaseUrl);
console.log('Supabase key available:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

// API endpoint to publish moodboard
app.post('/api/publish-moodboard', async (req, res) => {
  try {
    console.log('Publish moodboard request received');
    const { title, image, products, createdAt, canvasSize, userId } = req.body;
    
    console.log('Request data:', {
      title,
      hasImage: !!image,
      productsCount: products?.length,
      userId
    });
    
    // Allow both authenticated users and anonymous users
    const finalUserId = userId === 'anon' ? null : userId;
    console.log('Final user ID:', finalUserId);

    // Generate unique ID for the moodboard
    const moodboardId = uuidv4();
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    console.log('Generated moodboard ID:', moodboardId);
    console.log('Safe title:', safeTitle);
    
    // For now, skip image upload to avoid storage issues
    // Just use the data URL directly
    const imageUrl = image; // Use the data URL as-is
    
    console.log('Using data URL for image (skipping storage upload)');

    // Save moodboard to database
    console.log('Saving moodboard to database');
    const { data: moodboardData, error: dbError } = await supabase
      .from('moodboards')
      .insert({
        id: moodboardId,
        user_id: finalUserId, // null for anonymous users
        title: title,
        image_url: imageUrl, // Store the data URL directly
        products: products,
        canvas_size: canvasSize,
        public_url: `/user/${safeTitle}`,
        is_public: true
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to save moodboard: ' + dbError.message });
    }

    console.log('Moodboard saved successfully');

    res.json({
      success: true,
      publicUrl: `/user/${safeTitle}`,
      moodboardId: moodboardId,
      imageUrl: imageUrl
    });

  } catch (error) {
    console.error('Error publishing moodboard:', error);
    res.status(500).json({ error: 'Failed to publish moodboard: ' + error.message });
  }
});

// Get user's moodboards
app.get('/api/moodboards', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Handle anonymous users
    const finalUserId = userId === 'anon' ? null : userId;

    const { data: moodboards, error } = await supabase
      .from('moodboards')
      .select('*')
      .eq('user_id', finalUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch moodboards' });
    }

    res.json({ moodboards });
  } catch (error) {
    console.error('Error fetching moodboards:', error);
    res.status(500).json({ error: 'Failed to fetch moodboards' });
  }
});

// Get public moodboard by title
app.get('/api/moodboard/:title', async (req, res) => {
  try {
    const { title } = req.params;
    
    const { data: moodboard, error } = await supabase
      .from('moodboards')
      .select('*')
      .eq('public_url', `/user/${title}`)
      .eq('is_public', true)
      .single();

    if (error || !moodboard) {
      return res.status(404).json({ error: 'Moodboard not found' });
    }

    res.json({ moodboard });
  } catch (error) {
    console.error('Error fetching moodboard:', error);
    res.status(500).json({ error: 'Failed to fetch moodboard' });
  }
});

// Delete moodboard
app.delete('/api/moodboard/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    // Handle anonymous users
    const finalUserId = userId === 'anon' ? null : userId;

    // Delete from database (skip storage deletion for now)
    const { error: dbError } = await supabase
      .from('moodboards')
      .delete()
      .eq('id', id)
      .eq('user_id', finalUserId);

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to delete moodboard' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting moodboard:', error);
    res.status(500).json({ error: 'Failed to delete moodboard' });
  }
});

// New endpoint to extract product images from various retailers
app.get('/api/extract-product-image', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log('Extracting product image from:', url);
    
    // Amazon extraction
    if (url.includes('amazon.com')) {
      const productId = url.match(/\/dp\/([A-Z0-9]{10})/);
      if (productId) {
        const asin = productId[1];
        console.log('Found Amazon ASIN:', asin);
        
        // Try different Amazon image URL formats
        const imageUrls = [
          `https://m.media-amazon.com/images/I/71${asin}._AC_SL1500_.jpg`,
          `https://m.media-amazon.com/images/I/${asin}._AC_SL1500_.jpg`,
          `https://m.media-amazon.com/images/I/71${asin}.jpg`,
          `https://m.media-amazon.com/images/I/${asin}.jpg`,
          `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.L.jpg`,
          `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.M.jpg`
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
            console.log('Failed to check:', imageUrl);
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
        
        // Try Walmart image URL formats
        const imageUrls = [
          `https://i5.walmartimages.com/asr/${walmartId}.jpeg`,
          `https://i5.walmartimages.com/asr/${walmartId}.jpg`,
          `https://i5.walmartimages.com/seo/${walmartId}.jpeg`,
          `https://i5.walmartimages.com/seo/${walmartId}.jpg`
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
            console.log('Failed to check:', imageUrl);
          }
        }
      }
    }
    
    // Target extraction
    if (url.includes('target.com')) {
      const productId = url.match(/\/p\/([^\/\?]+)/);
      if (productId) {
        const targetId = productId[1];
        console.log('Found Target product ID:', targetId);
        
        // Try Target image URL formats
        const imageUrls = [
          `https://target.scene7.com/is/image/Target/${targetId}`,
          `https://target.scene7.com/is/image/Target/${targetId}?fmt=jpeg&wid=1000`
        ];
        
        for (let imageUrl of imageUrls) {
          try {
            console.log('Trying Target image URL:', imageUrl);
            const response = await fetch(imageUrl);
            
            if (response.ok) {
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.startsWith('image/')) {
                console.log('Found working Target image URL:', imageUrl);
                return res.json({ imageUrl });
              }
            }
          } catch (e) {
            console.log('Failed to check:', imageUrl);
          }
        }
      }
    }
    
    // Best Buy extraction
    if (url.includes('bestbuy.com')) {
      const productId = url.match(/\/site\/([^\/\?]+)/);
      if (productId) {
        const bestbuyId = productId[1];
        console.log('Found Best Buy product ID:', bestbuyId);
        
        // Try Best Buy image URL formats
        const imageUrls = [
          `https://www.bestbuy.com/site/images/${bestbuyId}.jpg`,
          `https://www.bestbuy.com/site/images/${bestbuyId}_large.jpg`
        ];
        
        for (let imageUrl of imageUrls) {
          try {
            console.log('Trying Best Buy image URL:', imageUrl);
            const response = await fetch(imageUrl);
            
            if (response.ok) {
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.startsWith('image/')) {
                console.log('Found working Best Buy image URL:', imageUrl);
                return res.json({ imageUrl });
              }
            }
          } catch (e) {
            console.log('Failed to check:', imageUrl);
          }
        }
      }
    }
    
    // Generic HTML extraction for any site
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
            img.length > 50 // Filter out very short URLs
          );
          
          if (productImages.length > 0) {
            console.log('Found product images in HTML:', productImages.slice(0, 3));
            return res.json({ imageUrl: productImages[0] });
          }
        }
      }
    } catch (e) {
      console.log('HTML extraction failed:', e);
    }
    
    console.log('Product image extraction failed');
    return res.status(404).json({ error: 'No valid image found' });
    
  } catch (error) {
    console.error('Error extracting product image:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    supabaseUrl: supabaseUrl,
    supabaseKeyAvailable: !!supabaseKey
  });
});

// Handle all other routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Export for Netlify Functions
exports.handler = app; 