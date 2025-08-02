const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

console.log('Server starting with proxy approach...');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://jjjfmsszuiofinrobgln.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

// Health check endpoint
exports.handler = async (event, context) => {
  // Set timeout to prevent function from hanging
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }
  
  // Extract path from event
  const path = event.path || event.rawPath || '';
  console.log('Request path:', path);
  
  // Health check endpoint
  if (path.includes('/api/health') || path.endsWith('/health')) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'Proxy server running'
      })
    };
  }
  
  // Image extraction endpoint
  if (path.includes('/api/extract-product-image') || path.endsWith('/extract-product-image')) {
    try {
      console.log('Product image extraction requested');
      
      const { url } = event.queryStringParameters || {};
      
      if (!url) {
        console.log('No URL provided');
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'URL parameter required' })
        };
      }

      console.log('Extracting images from:', url);

      // Use a proxy service to fetch the page
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract images from HTML
      const imageMatches = html.match(/https:\/\/[^"]*\.(jpg|jpeg|png|webp)/gi);
      
      if (!imageMatches || imageMatches.length === 0) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: false,
            message: 'No images found on page'
          })
        };
      }
      
      // Filter and rank images
      const productImages = imageMatches
        .filter(img => 
          !img.includes('logo') &&
          !img.includes('icon') &&
          !img.includes('banner') &&
          !img.includes('ad') &&
          img.length > 50
        )
        .slice(0, 5); // Take first 5 potential product images
      
      console.log('Found images:', {
        total: imageMatches.length,
        productImages: productImages.length
      });
      
      if (productImages.length > 0) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: true,
            imageUrl: productImages[0],
            totalFound: productImages.length,
            message: 'Image extracted successfully'
          })
        };
      } else {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: false,
            message: 'No suitable product images found'
          })
        };
      }
      
    } catch (error) {
      console.error('Error:', error);
      
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      };
    }
  }
  
  // Extract page title endpoint
  if (path.includes('/api/extract-page-title') || path.endsWith('/extract-page-title')) {
    try {
      const { url } = event.queryStringParameters || {};
      
      if (!url) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'URL parameter required' })
        };
      }

      console.log('Extracting page title from:', url);

      // Use allorigins.win to bypass CORS
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }

      const data = await response.json();
      const html = data.contents;
      
      // Extract title from HTML
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      let title = titleMatch ? titleMatch[1].trim() : null;
      
      // Clean up the title
      if (title) {
        title = title.replace(/[^\w\s-]/g, '').trim();
        if (title.length > 100) {
          title = title.substring(0, 100) + '...';
        }
      }

      console.log('Extracted title:', title);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          title: title,
          message: title ? 'Title extracted successfully' : 'No title found'
        })
      };
      
    } catch (error) {
      console.error('Error extracting page title:', error);
      
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      };
    }
  }
  
  // Canvas export endpoint to handle CORS issues
  if (path.includes('/api/export-canvas') || path.endsWith('/export-canvas')) {
    try {
      console.log('Canvas export requested');
      
      const { canvasData, width, height } = JSON.parse(event.body || '{}');
      
      if (!canvasData || !width || !height) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Missing canvas data, width, or height' })
        };
      }

      console.log('Exporting canvas:', { width, height, imageCount: canvasData.length });

      // For now, return success with the canvas data
      // The client will handle the actual image creation
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          message: 'Canvas data received',
          canvasData: canvasData
        })
      };
      
    } catch (error) {
      console.error('Error in canvas export:', error);
      
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      };
    }
  }
  
  // Moodboard publishing endpoint
  if (path.includes('/api/publish-moodboard') || path.endsWith('/publish-moodboard')) {
    try {
      console.log('Publish moodboard requested');
      console.log('Request body:', event.body);
      
      const moodboardData = JSON.parse(event.body || '{}');
      console.log('Parsed moodboard data:', {
        hasTitle: !!moodboardData.title,
        title: moodboardData.title,
        hasImage: !!moodboardData.image,
        imageLength: moodboardData.image ? moodboardData.image.length : 0,
        fields: Object.keys(moodboardData)
      });
      
      if (!moodboardData.title) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Missing title field' })
        };
      }
      
      if (!moodboardData.image) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Missing image field' })
        };
      }

      console.log('Publishing moodboard:', { 
        title: moodboardData.title, 
        imageSize: moodboardData.image.length,
        productsCount: moodboardData.products?.length || 0,
        userId: moodboardData.userId || 'anon'
      });

      // Create a unique ID and safe title
      const moodboardId = Date.now().toString();
      const safeTitle = moodboardData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const publicUrl = `/user/${safeTitle}`;

      // Store the moodboard data (in a real app, this would go to a database)
      // For now, we'll store it in a simple way that the template can access
      const moodboardInfo = {
        id: moodboardId,
        title: moodboardData.title,
        image: moodboardData.image,
        products: moodboardData.products || [],
        createdAt: moodboardData.createdAt,
        canvasSize: moodboardData.canvasSize,
        userId: moodboardData.userId || 'anon',
        publicUrl: publicUrl
      };

      // In a real implementation, you'd save this to a database
      // For now, we'll return the data and the template will handle it
      console.log('Returning moodboard data with image length:', moodboardInfo.image.length);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          moodboardId: moodboardId,
          publicUrl: publicUrl,
          message: 'Moodboard published successfully',
          moodboardData: moodboardInfo
        })
      };
      
    } catch (error) {
      console.error('Error in publish-moodboard:', error);
      
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      };
    }
  }

  // Get moodboard data endpoint
  if (path.includes('/api/get-moodboard') || path.endsWith('/get-moodboard')) {
    try {
      const { title } = event.queryStringParameters || {};
      
      if (!title) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Title parameter required' })
        };
      }

      // In a real app, you'd fetch this from a database
      // For now, return a placeholder moodboard
      const moodboardData = {
        title: decodeURIComponent(title.replace(/_/g, ' ')),
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        products: [
          {
            imageUrl: 'https://example.com/product1.jpg',
            title: 'Sample Product 1'
          },
          {
            imageUrl: 'https://example.com/product2.jpg', 
            title: 'Sample Product 2'
          }
        ],
        createdAt: new Date().toISOString(),
        canvasSize: { width: 800, height: 600 }
      };

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          moodboard: moodboardData
        })
      };
      
    } catch (error) {
      console.error('Error in get-moodboard:', error);
      
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      };
    }
  }
  
  // Screenshot endpoint to bypass CORS issues
  if (path.includes('/api/screenshot') || path.endsWith('/screenshot')) {
    try {
      console.log('Screenshot requested');
      
      const { url } = event.queryStringParameters || {};
      
      if (!url) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'URL parameter required' })
        };
      }

      console.log('Taking screenshot of:', url);

      // Use a free screenshot service (no API key required)
      const screenshotUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&viewport_width=1280&viewport_height=1024&format=jpg&full_page=false&delay=2`;
      
      const response = await fetch(screenshotUrl);
      
      if (!response.ok) {
        throw new Error(`Screenshot failed: ${response.status}`);
      }
      
      const imageBuffer = await response.buffer();
      const base64Image = imageBuffer.toString('base64');
      
      console.log('Screenshot successful, size:', imageBuffer.length);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          imageData: `data:image/jpeg;base64,${base64Image}`,
          message: 'Screenshot captured successfully'
        })
      };
      
    } catch (error) {
      console.error('Error taking screenshot:', error);
      
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      };
    }
  }

  // Save canvas image endpoint
  if (path.includes('/api/save-canvas') || path.endsWith('/save-canvas')) {
    try {
      console.log('Save canvas requested');
      
      const { imageData, moodboardId, title } = JSON.parse(event.body || '{}');
      
      if (!imageData || !moodboardId || !title) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Missing imageData, moodboardId, or title' })
        };
      }

      // Create safe filename
      const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${moodboardId}_${safeTitle}.jpg`;
      
      console.log('Saving canvas image to Supabase storage:', {
        moodboardId,
        title,
        filename,
        dataLength: imageData.length
      });

      // Convert base64 to buffer
      const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Upload to Supabase storage
      console.log('Attempting to upload to Supabase storage...');
      console.log('Bucket: moodboard-images');
      console.log('Filename:', filename);
      console.log('Buffer size:', buffer.length);
      console.log('Supabase URL:', supabaseUrl);
      console.log('Service role key present:', !!supabaseKey);
      
      const { data, error } = await supabase.storage
        .from('moodboard-images')
        .upload(filename, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (error) {
        console.error('Supabase storage upload error:', error);
        console.error('Error details:', {
          message: error.message,
          statusCode: error.statusCode,
          details: error.details
        });
        throw new Error(`Failed to upload image: ${error.message}`);
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('moodboard-images')
        .getPublicUrl(filename);
      
      const imagePath = urlData.publicUrl;
      console.log('Image uploaded successfully:', imagePath);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          imagePath: imagePath,
          filename: filename,
          message: 'Canvas image saved successfully'
        })
      };
      
    } catch (error) {
      console.error('Error saving canvas:', error);
      
      // Check if it's a Supabase configuration issue
      if (!supabaseKey || supabaseKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
        console.error('Supabase service role key not configured');
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: false,
            error: 'Supabase storage not configured. Please set SUPABASE_SERVICE_ROLE_KEY environment variable and create moodboard-images bucket.',
            fallbackImagePath: imageData // Include base64 as fallback
          })
        };
      }
      
      // Other error - return base64 data as fallback
      console.log('Using fallback - returning image data directly');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          imagePath: imageData, // Return the base64 data directly
          filename: filename,
          message: 'Canvas image saved (fallback mode - Supabase upload failed)'
        })
      };
    }
  }
  
  // Default response for unknown endpoints
  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ 
      error: 'Endpoint not found',
      path: path,
      availableEndpoints: ['/api/health', '/api/extract-product-image', '/api/export-canvas']
    })
  };
}; 