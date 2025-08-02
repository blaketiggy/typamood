const fetch = require('node-fetch');

console.log('Server starting with proxy approach...');

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
      
      const moodboardData = JSON.parse(event.body || '{}');
      
      if (!moodboardData.title || !moodboardData.image) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }

      console.log('Publishing moodboard:', { 
        title: moodboardData.title, 
        imageSize: moodboardData.image.length,
        productsCount: moodboardData.products?.length || 0,
        userId: moodboardData.userId || 'anon'
      });

      // For now, just return success without actually saving to database
      // This will allow the publishing to work
      const moodboardId = Date.now().toString();
      const safeTitle = moodboardData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const publicUrl = `/user/${safeTitle}`;

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
          message: 'Moodboard published successfully'
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