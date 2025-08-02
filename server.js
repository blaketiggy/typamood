const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Store moodboards in memory (in production, use a database)
const moodboards = new Map();

// API endpoint to publish moodboard
app.post('/api/publish-moodboard', async (req, res) => {
  try {
    const { title, image, products, createdAt, canvasSize } = req.body;
    
    // Generate unique ID for the moodboard
    const moodboardId = uuidv4();
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Create user directory (in production, get from auth)
    const userId = 'user'; // This would come from authentication
    const userDir = path.join(__dirname, 'public', userId);
    const moodboardDir = path.join(userDir, safeTitle);
    
    // Ensure directories exist
    await fs.mkdir(userDir, { recursive: true });
    await fs.mkdir(moodboardDir, { recursive: true });
    
    // Save the PNG image
    const imageData = image.replace(/^data:image\/png;base64,/, '');
    const imagePath = path.join(moodboardDir, 'moodboard.png');
    await fs.writeFile(imagePath, imageData, 'base64');
    
    // Create HTML page
    const htmlContent = generateMoodboardPage(title, products, canvasSize);
    const htmlPath = path.join(moodboardDir, 'index.html');
    await fs.writeFile(htmlPath, htmlContent);
    
    // Save moodboard metadata
    const metadata = {
      id: moodboardId,
      title,
      products,
      createdAt,
      canvasSize,
      publicUrl: `/${userId}/${safeTitle}`
    };
    
    moodboards.set(moodboardId, metadata);
    
    // Save metadata to file
    const metadataPath = path.join(moodboardDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    res.json({
      success: true,
      publicUrl: `/${userId}/${safeTitle}`,
      moodboardId
    });
    
  } catch (error) {
    console.error('Error publishing moodboard:', error);
    res.status(500).json({ error: 'Failed to publish moodboard' });
  }
});

// Serve static moodboard pages
app.get('/user/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const moodboardPath = path.join(__dirname, 'public', 'user', title, 'index.html');
    
    // Check if moodboard exists
    try {
      await fs.access(moodboardPath);
      res.sendFile(moodboardPath);
    } catch {
      res.status(404).send('Moodboard not found');
    }
  } catch (error) {
    console.error('Error serving moodboard:', error);
    res.status(500).send('Server error');
  }
});

// Generate HTML page for moodboard
function generateMoodboardPage(title, products, canvasSize) {
  const productLinks = products.map(product => `
    <div class="product-item">
      <img src="${product.imageUrl}" alt="Product" class="product-thumbnail">
      <a href="${product.imageUrl}" target="_blank" class="product-link">View Product</a>
    </div>
  `).join('');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Typaboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .moodboard-image {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            display: block;
            padding: 20px;
        }
        
        .products-section {
            padding: 40px;
            background: #f8f9fa;
        }
        
        .products-section h2 {
            text-align: center;
            margin-bottom: 30px;
            color: #333;
            font-size: 1.8rem;
        }
        
        .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .product-item {
            background: white;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        
        .product-item:hover {
            transform: translateY(-2px);
        }
        
        .product-thumbnail {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        
        .product-link {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s;
        }
        
        .product-link:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 20px;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .products-grid {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <p>A curated moodboard created with Typaboard</p>
        </div>
        
        <img src="moodboard.png" alt="${title}" class="moodboard-image">
        
        <div class="products-section">
            <h2>Products in this moodboard</h2>
            <div class="products-grid">
                ${productLinks}
            </div>
        </div>
        
        <div class="footer">
            <p>Created with ❤️ using <a href="https://typaboard.com" style="color: #667eea;">Typaboard</a></p>
        </div>
    </div>
</body>
</html>`;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to create moodboards`);
}); 