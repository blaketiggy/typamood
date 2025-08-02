const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

console.log('Server starting with Puppeteer...');

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
  
  // Health check endpoint
  if (event.path === '/api/health') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'Puppeteer server running'
      })
    };
  }
  
  // Image extraction endpoint
  if (event.path === '/api/extract-product-image') {
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

      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      
      // Set realistic viewport and user agent
      await page.setViewport({ width: 1366, height: 768 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Intercept and collect images
      const images = [];
      page.on('response', async (response) => {
        if (response.request().resourceType() === 'image') {
          try {
            const buffer = await response.buffer();
            const contentType = response.headers()['content-type'] || 'image/jpeg';
            images.push({
              url: response.url(),
              data: `data:${contentType};base64,${buffer.toString('base64')}`,
              size: buffer.length
            });
          } catch (err) {
            console.log('Failed to process image:', err.message);
          }
        }
      });
      
      // Navigate to page
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for images to load
      await page.waitForSelector('img', { timeout: 10000 });
      
      // Extract additional images from img tags that might not have triggered response event
      const pageImages = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs
          .filter(img => img.src && img.src.startsWith('http'))
          .map(img => ({
            src: img.src,
            alt: img.alt || '',
            width: img.naturalWidth,
            height: img.naturalHeight
          }))
          .filter(img => img.width > 100 && img.height > 100); // Filter small images
      });
      
      await browser.close();
      
      // Find the best product image
      let bestImage = null;
      
      // First try to find a product image from intercepted images
      const productImages = images.filter(img => 
        img.size > 10000 && // At least 10KB
        !img.url.includes('logo') &&
        !img.url.includes('icon') &&
        !img.url.includes('banner')
      );
      
      if (productImages.length > 0) {
        bestImage = productImages[0].data; // Use base64 data
      } else if (pageImages.length > 0) {
        // Fallback to page images
        const bestPageImage = pageImages.find(img => 
          !img.src.includes('logo') &&
          !img.src.includes('icon') &&
          !img.src.includes('banner')
        );
        if (bestPageImage) {
          bestImage = bestPageImage.src;
        }
      }
      
      console.log('Found images:', {
        intercepted: images.length,
        pageImages: pageImages.length,
        bestImage: !!bestImage
      });
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({
          success: true,
          imageUrl: bestImage,
          totalFound: images.length + pageImages.length,
          message: bestImage ? 'Image extracted successfully' : 'No suitable image found'
        })
      };
      
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
          error: error.message,
          stack: error.stack
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
    body: JSON.stringify({ error: 'Endpoint not found' })
  };
}; 