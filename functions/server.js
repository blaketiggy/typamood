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
    
    // Upload image to Supabase Storage
    const imageData = image.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(imageData, 'base64');
    const imageFileName = `${moodboardId}.png`;
    
    console.log('Uploading image to storage:', imageFileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('moodboard-images')
      .upload(imageFileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload image: ' + uploadError.message });
    }

    console.log('Image uploaded successfully');

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('moodboard-images')
      .getPublicUrl(imageFileName);

    console.log('Public URL generated:', publicUrl);

    // Save moodboard to database
    console.log('Saving moodboard to database');
    const { data: moodboardData, error: dbError } = await supabase
      .from('moodboards')
      .insert({
        id: moodboardId,
        user_id: finalUserId, // null for anonymous users
        title: title,
        image_url: publicUrl,
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
      imageUrl: publicUrl
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

    // Delete image from storage
    const { error: storageError } = await supabase.storage
      .from('moodboard-images')
      .remove([`${id}.png`]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    // Delete from database
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