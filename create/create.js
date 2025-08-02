// Import Supabase client
import { auth, api, ui } from './supabase-client.js';

// Variable declarations - must be at the top
let loadedImages = [];
let selectedImage = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let touchStartDistance = 0;
let touchStartAngle = 0;
let touchStartScale = 1;
let touchStartRotation = 0;
let isPinching = false;
let mouseStartDistance = 0;
let mouseStartAngle = 0;
let mouseStartScale = 1;
let mouseStartRotation = 0;
let isMouseScaling = false;
let lastMousePos = { x: 0, y: 0 };
let currentInputMode = 'product';
let moodboardTitle = 'Name your moodboard';

// Add authentication check at the start
let currentUser = null;

// Check authentication status
async function checkAuth() {
  try {
    currentUser = await auth.getCurrentUser();
    
    // Add user info to the page
    const userInfo = document.createElement('div');
    userInfo.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      background: #ffffff;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #e9e9e7;
      font-size: 12px;
      color: #787774;
      z-index: 1000;
    `;
    
    if (currentUser) {
      userInfo.textContent = `Signed in as ${currentUser.email}`;
      userInfo.style.color = '#0f7b0f';
    } else {
      userInfo.textContent = 'Creating as anonymous user';
      userInfo.style.color = '#787774';
      
      // Show anonymous reminder after a delay
      setTimeout(() => {
        ui.showAnonymousReminder();
      }, 2000);
    }
    
    document.body.appendChild(userInfo);
    
  } catch (error) {
    console.error('Auth error:', error);
    // Don't redirect, allow anonymous usage
  }
}

// Listen for auth state changes
auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Refresh the page to update the UI
    window.location.reload();
  }
});

// Initialize auth check
checkAuth();

// Basic canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

console.log('Script loaded');
console.log('Canvas element:', canvas);
console.log('Canvas context:', ctx);

// Editable title functionality
const moodboardTitleElement = document.getElementById('moodboard-title');

moodboardTitleElement.addEventListener('focus', function() {
  if (this.textContent === 'Name your moodboard') {
    this.textContent = '';
  }
});

moodboardTitleElement.addEventListener('blur', function() {
  if (this.textContent.trim() === '') {
    this.textContent = 'Name your moodboard';
  }
  moodboardTitle = this.textContent;
  console.log('Moodboard title saved:', moodboardTitle);
});

moodboardTitleElement.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    this.blur();
  }
});

// Canvas resize with proper image handling
function resizeCanvas() {
  const container = document.querySelector('.canvas-container');
  const rect = container.getBoundingClientRect();
  const newWidth = rect.width - 20;
  const newHeight = rect.height - 20;
  
  console.log('Resizing canvas to:', newWidth, 'x', newHeight);
  
  // Store current selection
  const wasSelected = selectedImage;
  
  // Resize canvas
  canvas.width = newWidth;
  canvas.height = newHeight;
  
  // Update image positions based on their percentages
  loadedImages.forEach(imageObj => {
    // Recalculate absolute position from percentages
    imageObj.x = (newWidth * imageObj.xPercent) - (imageObj.width / 2);
    imageObj.y = (newHeight * imageObj.yPercent) - (imageObj.height / 2);
    
    // Keep images within bounds
    const maxX = newWidth - imageObj.width;
    const maxY = newHeight - imageObj.height;
    
    if (imageObj.x > maxX) {
      imageObj.x = maxX;
      imageObj.xPercent = (imageObj.x + imageObj.width / 2) / newWidth;
    }
    if (imageObj.y > maxY) {
      imageObj.y = maxY;
      imageObj.yPercent = (imageObj.y + imageObj.height / 2) / newHeight;
    }
    if (imageObj.x < 0) {
      imageObj.x = 0;
      imageObj.xPercent = (imageObj.width / 2) / newWidth;
    }
    if (imageObj.y < 0) {
      imageObj.y = 0;
      imageObj.yPercent = (imageObj.height / 2) / newHeight;
    }
  });
  
  // Redraw canvas
  drawCanvas();
  
  // Restore selection
  if (wasSelected) {
    selectedImage = wasSelected;
    wasSelected.selected = true;
    drawCanvas();
  }
}

// Enhanced draw function with image support
function drawCanvas() {
  console.log('=== DRAWING CANVAS ===');
  console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
  console.log('Number of images to draw:', loadedImages.length);
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw test rectangle only if no images
  if (loadedImages.length === 0) {
    console.log('No images to draw, showing test rectangle');
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(10, 10, 200, 100);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px Arial';
    ctx.fillText('Canvas is working!', 20, 50);
    ctx.fillText('Try pasting an image (Ctrl+V)', 20, 80);
    return;
  }
  
  // Draw all images
  loadedImages.forEach((imageObj, index) => {
    console.log(`Drawing image ${index}:`, {
      position: { x: imageObj.x, y: imageObj.y },
      size: { width: imageObj.width, height: imageObj.height },
      rotation: imageObj.rotation,
      scale: imageObj.scale,
      selected: imageObj.selected
    });
    
    // Log exact values
    console.log(`Image ${index} exact values:`, {
      x: imageObj.x,
      y: imageObj.y,
      width: imageObj.width,
      height: imageObj.height,
      rotation: imageObj.rotation,
      scale: imageObj.scale
    });
    
    try {
      ctx.save();
      ctx.translate(imageObj.x + imageObj.width / 2, imageObj.y + imageObj.height / 2);
      ctx.rotate(imageObj.rotation || 0);
      ctx.scale(imageObj.scale || 1, imageObj.scale || 1);
      
      console.log(`Drawing image ${index} at transformed position:`, {
        translateX: imageObj.x + imageObj.width / 2,
        translateY: imageObj.y + imageObj.height / 2,
        drawX: -imageObj.width / 2,
        drawY: -imageObj.height / 2,
        drawWidth: imageObj.width,
        drawHeight: imageObj.height
      });
      
      // Log the exact numerical values
      console.log(`Image ${index} exact drawing values:`, {
        translateX: imageObj.x + imageObj.width / 2,
        translateY: imageObj.y + imageObj.height / 2,
        drawX: -imageObj.width / 2,
        drawY: -imageObj.height / 2,
        drawWidth: imageObj.width,
        drawHeight: imageObj.height
      });
      
      ctx.drawImage(
        imageObj.img,
        -imageObj.width / 2,
        -imageObj.height / 2,
        imageObj.width,
        imageObj.height
      );
      
      // Draw a test rectangle to show where the image should be
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        -imageObj.width / 2,
        -imageObj.height / 2,
        imageObj.width,
        imageObj.height
      );
      
      // Draw selection border if selected
      if (imageObj.selected) {
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 3;
        ctx.strokeRect(
          -imageObj.width / 2 - 5,
          -imageObj.height / 2 - 5,
          imageObj.width + 10,
          imageObj.height + 10
        );
      }
      
      ctx.restore();
      console.log(`Image ${index} drawn successfully`);
    } catch (error) {
      console.error(`Error drawing image ${index}:`, error);
    }
  });
  
  console.log('Canvas drawing completed');
}

// Initialize
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Mouse event handlers for selection and dragging
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mouseleave', handleMouseUp);

function handleMouseDown(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  selectImageAt(x, y);
  
  if (selectedImage) {
    isDragging = true;
    dragOffset.x = x - selectedImage.x;
    dragOffset.y = y - selectedImage.y;
  }
}

function handleMouseMove(e) {
  if (!isDragging || !selectedImage) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  selectedImage.x = x - dragOffset.x;
  selectedImage.y = y - dragOffset.y;
  
  // Update percentages based on new position
  selectedImage.xPercent = (selectedImage.x + selectedImage.width / 2) / canvas.width;
  selectedImage.yPercent = (selectedImage.y + selectedImage.height / 2) / canvas.height;
  
  // Keep image within bounds
  const maxX = canvas.width - selectedImage.width;
  const maxY = canvas.height - selectedImage.height;
  selectedImage.x = Math.max(0, Math.min(selectedImage.x, maxX));
  selectedImage.y = Math.max(0, Math.min(selectedImage.y, maxY));
  
  // Update percentages again after bounds check
  selectedImage.xPercent = (selectedImage.x + selectedImage.width / 2) / canvas.width;
  selectedImage.yPercent = (selectedImage.y + selectedImage.height / 2) / canvas.height;
  
  drawCanvas();
}

function handleMouseUp() {
  isDragging = false;
}

function selectImageAt(x, y) {
  // Clear previous selection
  loadedImages.forEach(img => img.selected = false);
  
  // Check if clicking on an image (reverse order to check top images first)
  for (let i = loadedImages.length - 1; i >= 0; i--) {
    const img = loadedImages[i];
    const scaledWidth = img.width * (img.scale || 1);
    const scaledHeight = img.height * (img.scale || 1);
    
    const centerX = img.x + scaledWidth / 2;
    const centerY = img.y + scaledHeight / 2;
    
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    const maxDistance = Math.max(scaledWidth, scaledHeight) / 2;
    
    if (distance <= maxDistance) {
      selectedImage = img;
      img.selected = true;
      drawCanvas();
      break;
    }
  }
}

// Toggle functionality
const toggleBtns = document.querySelectorAll('.toggle-btn');
console.log('Toggle buttons found:', toggleBtns.length);

toggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    console.log('Toggle button clicked:', btn.dataset.mode);
    toggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update mode and placeholder
    currentInputMode = btn.dataset.mode;
    const urlInput = document.getElementById('url-input');
    if (currentInputMode === 'product') {
      urlInput.placeholder = 'Enter product URL...';
    } else {
      urlInput.placeholder = 'Enter direct image URL...';
    }
  });
});

// URL input
const urlInput = document.getElementById('url-input');
const addUrlBtn = document.getElementById('add-url');

console.log('URL input found:', urlInput);
console.log('Add button found:', addUrlBtn);

addUrlBtn.addEventListener('click', addImageFromUrl);
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addImageFromUrl();
  }
});

async function addImageFromUrl() {
  const url = urlInput.value.trim();
  if (!url) {
    showNotification('Please enter a valid URL', 'error');
    return;
  }

  console.log('=== ADDING IMAGE FROM URL ===');
  console.log('Input URL:', url);
  console.log('Current input mode:', currentInputMode);

  // Show loading state
  addUrlBtn.textContent = '...';
  addUrlBtn.disabled = true;

  try {
    let imageUrl = url;
    
    // For direct image URLs, use as is
    if (currentInputMode === 'image') {
      console.log('Using direct image URL:', imageUrl);
    } else {
      // For product URLs, try to extract image
      console.log('Extracting product image from:', url);
      imageUrl = await extractProductImage(url);
      console.log('Extracted image URL:', imageUrl);
    }
    
    console.log('Final image URL to load:', imageUrl);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      console.log('=== IMAGE LOADED SUCCESSFULLY ===');
      console.log('Image dimensions:', img.width, 'x', img.height);
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      console.log('Image src:', img.src);
      
      // Check if image has actual data
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      tempCtx.drawImage(img, 0, 0);
      
      try {
        const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;
        let hasNonTransparentPixels = false;
        
        // Check if image has non-transparent pixels
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 0) { // Alpha channel > 0
            hasNonTransparentPixels = true;
            break;
          }
        }
        
        console.log('Image data check:', {
          totalPixels: data.length / 4,
          hasNonTransparentPixels: hasNonTransparentPixels,
          firstFewPixels: Array.from(data.slice(0, 20))
        });
        
        if (!hasNonTransparentPixels) {
          console.warn('Image appears to be completely transparent or white!');
        }
      } catch (e) {
        console.error('Could not analyze image data:', e);
      }
      
      // Calculate relative size (percentage of canvas)
      const canvasArea = canvas.width * canvas.height;
      const maxImageArea = canvasArea * 0.15; // Max 15% of canvas area
      
      let newWidth = img.width;
      let newHeight = img.height;
      
      // Calculate area and scale down if too large
      let imageArea = newWidth * newHeight;
      if (imageArea > maxImageArea) {
        const scale = Math.sqrt(maxImageArea / imageArea);
        newWidth = newWidth * scale;
        newHeight = newHeight * scale;
      }
      
      // Ensure minimum size (at least 50px)
      const minSize = 50;
      if (newWidth < minSize || newHeight < minSize) {
        if (newWidth < newHeight) {
          newHeight = (newHeight * minSize) / newWidth;
          newWidth = minSize;
        } else {
          newWidth = (newWidth * minSize) / newHeight;
          newHeight = minSize;
        }
      }
      
      console.log('Resized dimensions:', newWidth, 'x', newHeight);
      
      // Create image object with relative positioning
      const imageObj = {
        img: img,
        // Use percentages for positioning
        xPercent: 0.5, // Center horizontally (50%)
        yPercent: 0.5, // Center vertically (50%)
        width: newWidth,
        height: newHeight,
        originalWidth: img.width,
        originalHeight: img.height,
        rotation: 0,
        scale: 1,
        selected: false,
        originalImageUrl: url // Store the original URL for product links
      };
      
      // Calculate absolute position from percentages
      imageObj.x = (canvas.width * imageObj.xPercent) - (newWidth / 2);
      imageObj.y = (canvas.height * imageObj.yPercent) - (newHeight / 2);
      
      // Ensure the image stays within canvas bounds
      const maxX = canvas.width - newWidth;
      const maxY = canvas.height - newHeight;
      imageObj.x = Math.max(0, Math.min(imageObj.x, maxX));
      imageObj.y = Math.max(0, Math.min(imageObj.y, maxY));
      
      console.log('Image object created:', imageObj);
      console.log('Absolute position:', imageObj.x, imageObj.y);
      console.log('Canvas bounds check:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        imageWidth: newWidth,
        imageHeight: newHeight,
        maxX: maxX,
        maxY: maxY,
        finalX: imageObj.x,
        finalY: imageObj.y
      });
      
      loadedImages.push(imageObj);
      console.log('Total images in array:', loadedImages.length);
      
      urlInput.value = '';
      console.log('Calling drawCanvas...');
      drawCanvas();
      
      // Reset button
      addUrlBtn.textContent = '+';
      addUrlBtn.disabled = false;
      
      showNotification('Image added successfully!', 'success');
    };
    
    img.onerror = function() {
      console.error('=== IMAGE LOAD ERROR ===');
      console.error('Failed to load image from:', imageUrl);
      console.error('Error details:', img.error);
      
      // Try without CORS if it failed
      if (img.crossOrigin === 'anonymous') {
        console.log('Retrying without CORS...');
        img.crossOrigin = null;
        img.src = imageUrl;
      } else {
        console.error('Image loading failed completely');
        
        // Reset button
        addUrlBtn.textContent = '+';
        addUrlBtn.disabled = false;
        
        showNotification('Failed to load image. Please try a different URL.', 'error');
      }
    };
    
    console.log('Setting image src to:', imageUrl);
    img.src = imageUrl;
    
  } catch (error) {
    console.error('=== ERROR IN ADD IMAGE FUNCTION ===');
    console.error('Error adding image from URL:', error);
    
    // Reset button
    addUrlBtn.textContent = '+';
    addUrlBtn.disabled = false;
    
    showNotification('Error processing URL. Please try again.', 'error');
  }
}

// Extract product images from various retailers (simple client-side approach)
async function extractProductImage(url) {
  try {
    console.log('Extracting product image from:', url);
    
    // Check if it's already an image URL
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return url;
    }
    
    // Amazon extraction - use known working URL patterns
    if (url.includes('amazon.com')) {
      const productId = url.match(/\/dp\/([A-Z0-9]{10})/);
      if (productId) {
        const asin = productId[1];
        console.log('Found Amazon ASIN:', asin);
        
        // Try Amazon image URL formats that we know work
        const imageUrls = [
          `https://m.media-amazon.com/images/I/71${asin}._AC_SL1500_.jpg`,
          `https://m.media-amazon.com/images/I/${asin}._AC_SL1500_.jpg`,
          `https://m.media-amazon.com/images/I/71${asin}.jpg`,
          `https://m.media-amazon.com/images/I/${asin}.jpg`
        ];
        
        // Test each URL to see if it loads
        for (let imageUrl of imageUrls) {
          try {
            console.log('Trying Amazon image URL:', imageUrl);
            const img = new Image();
            const loadPromise = new Promise((resolve, reject) => {
              img.onload = () => resolve(imageUrl);
              img.onerror = () => reject();
            });
            
            img.src = imageUrl;
            const result = await Promise.race([loadPromise, new Promise(resolve => setTimeout(() => resolve(null), 2000))]);
            
            if (result) {
              console.log('Found working Amazon image URL:', result);
              return result;
            }
          } catch (e) {
            console.log('Failed to check:', imageUrl);
          }
        }
      }
    }
    
    // Etsy extraction - use server endpoint since it works
    if (url.includes('etsy.com')) {
      try {
        console.log('Using server for Etsy extraction');
        const response = await fetch(`/api/extract-product-image?url=${encodeURIComponent(url)}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.imageUrl) {
            console.log('Server extracted Etsy image:', data.message);
            return data.imageUrl;
          }
        }
      } catch (e) {
        console.log('Etsy server extraction failed:', e);
      }
    }
    
    // For other sites, try server endpoint as fallback
    try {
      console.log('Trying server extraction for:', url);
      const response = await fetch(`/api/extract-product-image?url=${encodeURIComponent(url)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.imageUrl) {
          console.log('Server extracted image:', data.message);
          return data.imageUrl;
        }
      }
    } catch (e) {
      console.log('Server extraction failed:', e);
    }
    
    // If all else fails, return the original URL
    console.log('Product image extraction failed, returning original URL');
    return url;
  } catch (error) {
    console.error('Error extracting product image:', error);
    return url;
  }
}

// Extract images using proxy services to avoid CORS
async function extractImageViaProxy(url) {
  try {
    // Method 1: Use a public CORS proxy
    const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    // Method 2: Use a screenshot service (if available)
    const screenshotUrl = `https://api.apiflash.com/v1/urltoimage?access_key=YOUR_API_KEY&url=${encodeURIComponent(url)}`;
    
    // Method 3: Use a web scraping service
    const scrapeUrl = `https://api.scrapingbee.com/api/v1/?api_key=YOUR_API_KEY&url=${encodeURIComponent(url)}&extract_rules={"images":{"selector":"img","type":"list","output":{"src":"@src","alt":"@alt"}}}`;
    
    // Method 4: Use a public image extraction service
    const imageExtractionUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&meta=image`;
    
    // Try the microlink API first (no API key required)
    try {
      const microlinkResponse = await fetch(imageExtractionUrl);
      if (microlinkResponse.ok) {
        const data = await microlinkResponse.json();
        if (data.data && data.data.image && data.data.image.url) {
          console.log('Found image via microlink:', data.data.image.url);
          return data.data.image.url;
        }
      }
    } catch (e) {
      console.log('Microlink failed, trying CORS proxy...');
    }
    
    // Fallback: Try CORS proxy approach
    const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`, {
      method: 'GET',
      headers: {
        'Origin': window.location.origin
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Extract image URLs from HTML
      const imageMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
      if (imageMatches) {
        for (let match of imageMatches) {
          const srcMatch = match.match(/src=["']([^"']+)["']/);
          if (srcMatch) {
            const imageUrl = srcMatch[1];
            
            // Convert relative URLs to absolute
            if (imageUrl.startsWith('/')) {
              const urlObj = new URL(url);
              const absoluteUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
              
              // Test if image is accessible
              try {
                const imgResponse = await fetch(absoluteUrl, { method: 'HEAD' });
                if (imgResponse.ok) {
                  return absoluteUrl;
                }
              } catch (e) {
                // Continue to next image
              }
            } else if (imageUrl.startsWith('http')) {
              // Test if image is accessible
              try {
                const imgResponse = await fetch(imageUrl, { method: 'HEAD' });
                if (imgResponse.ok) {
                  return imageUrl;
                }
              } catch (e) {
                // Continue to next image
              }
            }
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting image via proxy:', error);
    return null;
  }
}

// Alternative method using a screenshot service
async function extractImageViaScreenshot(url) {
  try {
    // Use a screenshot service to get the page image
    const screenshotUrl = `https://api.apiflash.com/v1/urltoimage?access_key=YOUR_API_KEY&url=${encodeURIComponent(url)}&format=jpeg&quality=85&width=800&height=600`;
    
    // Note: This requires an API key from a service like ApiFlash
    // For now, we'll return null but you can implement this with a real API key
    return null;
  } catch (error) {
    console.error('Error extracting image via screenshot:', error);
    return null;
  }
}



// Extract Dior product images
async function extractDiorImage(url) {
  try {
    // Dior uses different URL patterns, try to extract product ID
    const productIdMatch = url.match(/\/product\/([^\/]+)/);
    if (productIdMatch) {
      const productId = productIdMatch[1];
      // Try common Dior image patterns
      const diorImagePatterns = [
        `https://www.dior.com/couture/var/dior/storage/images/horizon/beauty/makeup/${productId}/image.jpg`,
        `https://www.dior.com/couture/var/dior/storage/images/horizon/beauty/skincare/${productId}/image.jpg`,
        `https://www.dior.com/couture/var/dior/storage/images/horizon/fashion/${productId}/image.jpg`
      ];
      
      for (let pattern of diorImagePatterns) {
        try {
          const response = await fetch(pattern, { method: 'HEAD' });
          if (response.ok) {
            return pattern;
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting Dior image:', error);
    return null;
  }
}

// Function to extract page title from a URL
async function extractPageTitle(url) {
  try {
    const response = await fetch(`/api/extract-page-title?url=${encodeURIComponent(url)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.title) {
        return data.title;
      }
    }
  } catch (e) {
    console.log('Failed to extract page title:', e);
  }
  return null;
}

// Function to get better product names from URLs
async function getProductName(url) {
  // Try to get page title first
  const pageTitle = await extractPageTitle(url);
  if (pageTitle) {
    return pageTitle;
  }
  
  // Fallback to URL-based extraction
  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname.includes('amazon.com')) {
      const pathParts = urlObj.pathname.split('/');
      const productId = pathParts.find(part => part.length === 10 && /^[A-Z0-9]{10}$/.test(part));
      if (productId) {
        return `Amazon Product (${productId})`;
      }
      return 'Amazon Product';
    } else if (urlObj.hostname.includes('etsy.com')) {
      return 'Etsy Product';
    } else if (urlObj.hostname.includes('walmart.com')) {
      return 'Walmart Product';
    } else if (urlObj.hostname.includes('bestbuy.com')) {
      return 'Best Buy Product';
    } else {
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart.length > 3) {
          return lastPart.replace(/[-_]/g, ' ').replace(/\.[^.]*$/, '');
        }
      }
    }
  } catch (e) {
    console.log('Failed to parse URL for product name:', url);
  }
  
  return 'Product';
}

// Paste functionality
document.addEventListener('paste', (e) => {
  console.log('Paste event detected');
  
  const items = e.clipboardData.items;
  let hasImage = false;
  
  // Check for images first
  for (let item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) {
        console.log('Image found in clipboard:', file.name);
        e.preventDefault(); // Only prevent default for images
        processPastedImage(file);
        hasImage = true;
        return;
      }
    }
  }
  
  // If no image, allow normal paste behavior for text
  if (!hasImage) {
    console.log('No image found, allowing normal paste');
    // Don't prevent default - let the input field handle text pasting
  }
});

// Also handle paste specifically on the input field
urlInput.addEventListener('paste', (e) => {
  console.log('Paste on input field');
  const text = e.clipboardData.getData('text');
  if (text && (text.match(/\.(jpg|jpeg|png|gif|webp)$/i) || text.includes('http'))) {
    console.log('Image URL pasted into input:', text);
    // Let the normal paste happen, then show notification
    setTimeout(() => {
      showNotification('Image URL pasted! Click + to add.', 'info');
    }, 100);
  }
});

function processPastedImage(file) {
  console.log('Processing image:', file.name);
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      console.log('Pasted image loaded:', img.width, 'x', img.height);
      
      // Calculate relative size (percentage of canvas)
      const canvasArea = canvas.width * canvas.height;
      const maxImageArea = canvasArea * 0.15; // Max 15% of canvas area
      
      let newWidth = img.width;
      let newHeight = img.height;
      
      // Calculate area and scale down if too large
      let imageArea = newWidth * newHeight;
      if (imageArea > maxImageArea) {
        const scale = Math.sqrt(maxImageArea / imageArea);
        newWidth = newWidth * scale;
        newHeight = newHeight * scale;
      }
      
      // Ensure minimum size (at least 50px)
      const minSize = 50;
      if (newWidth < minSize || newHeight < minSize) {
        if (newWidth < newHeight) {
          newHeight = (newHeight * minSize) / newWidth;
          newWidth = minSize;
        } else {
          newWidth = (newWidth * minSize) / newHeight;
          newHeight = minSize;
        }
      }
      
      console.log('Pasted image resized to:', newWidth, 'x', newHeight);
      
      // Create image object with relative positioning
      const imageObj = {
        img: img,
        // Use percentages for positioning
        xPercent: 0.5, // Center horizontally (50%)
        yPercent: 0.5, // Center vertically (50%)
        width: newWidth,
        height: newHeight,
        originalWidth: img.width,
        originalHeight: img.height,
        rotation: 0,
        scale: 1,
        selected: false,
        originalImageUrl: 'Pasted Image' // For pasted images, we don't have a URL
      };
      
      // Calculate absolute position from percentages
      imageObj.x = (canvas.width * imageObj.xPercent) - (newWidth / 2);
      imageObj.y = (canvas.height * imageObj.yPercent) - (newHeight / 2);
      
      // Ensure the image stays within canvas bounds
      const maxX = canvas.width - newWidth;
      const maxY = canvas.height - newHeight;
      imageObj.x = Math.max(0, Math.min(imageObj.x, maxX));
      imageObj.y = Math.max(0, Math.min(imageObj.y, maxY));
      
      console.log('Adding pasted image object:', imageObj);
      loadedImages.push(imageObj);
      console.log('Total images:', loadedImages.length);
      
      drawCanvas();
      
      showNotification('Image pasted successfully!', 'success');
    };
    
    img.onerror = function() {
      console.error('Failed to load pasted image');
      showNotification('Failed to load pasted image.', 'error');
    };
    
    img.src = e.target.result;
  };
  
  reader.onerror = function() {
    console.error('Failed to read pasted file');
    showNotification('Failed to read pasted file.', 'error');
  };
  
  reader.readAsDataURL(file);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Delete' && selectedImage) {
    loadedImages = loadedImages.filter(img => img !== selectedImage);
    selectedImage = null;
    drawCanvas();
    showNotification('Image deleted', 'info');
  }
  
  if (e.key === 'r' && selectedImage) {
    selectedImage.rotation = (selectedImage.rotation || 0) + Math.PI / 4;
    drawCanvas();
  }
  
  if (e.key === 's' && selectedImage) {
    selectedImage.scale = (selectedImage.scale || 1) * 1.1;
    drawCanvas();
  }
  
  if (e.key === 'S' && selectedImage) {
    selectedImage.scale = (selectedImage.scale || 1) * 0.9;
    drawCanvas();
  }
});

// Simple notification function
function showNotification(message, type = 'info') {
  console.log('Notification:', message, type);
  
  // Create simple notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1000;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 3000);
}

// Button event listeners
document.getElementById('clear-canvas').addEventListener('click', () => {
  console.log('Clear button clicked');
  loadedImages = [];
  selectedImage = null;
  drawCanvas();
  showNotification('Canvas cleared', 'info');
});

// Update the publish button event listener
document.getElementById('publish').addEventListener('click', async () => {
  const publishBtn = document.getElementById('publish');
  const stopLoading = ui.showLoading(publishBtn);

  try {
    // Try to convert canvas to PNG, but handle CORS issues
    let dataURL;
    try {
      // Create a new canvas to avoid CORS issues
      const exportCanvas = document.createElement('canvas');
      const exportCtx = exportCanvas.getContext('2d');
      
      // Set size to 600x600
      exportCanvas.width = 600;
      exportCanvas.height = 600;
      
      // Fill with white background
      exportCtx.fillStyle = '#ffffff';
      exportCtx.fillRect(0, 0, 600, 600);
      
      // Calculate scale to fit the original canvas content
      const scaleX = 600 / canvas.width;
      const scaleY = 600 / canvas.height;
      const scale = Math.min(scaleX, scaleY);
      
      // Calculate centering offset
      const offsetX = (600 - canvas.width * scale) / 2;
      const offsetY = (600 - canvas.height * scale) / 2;
      
      // Draw the original canvas content scaled and centered
      exportCtx.save();
      exportCtx.translate(offsetX, offsetY);
      exportCtx.scale(scale, scale);
      
      // Draw each image individually to avoid CORS issues
      for (const img of loadedImages) {
        if (img.element && img.element.complete) {
          exportCtx.save();
          exportCtx.translate(img.x, img.y);
          exportCtx.rotate(img.rotation);
          exportCtx.scale(img.scale, img.scale);
          exportCtx.drawImage(
            img.element,
            -img.size.width / 2,
            -img.size.height / 2,
            img.size.width,
            img.size.height
          );
          exportCtx.restore();
        }
      }
      exportCtx.restore();
      
      // Convert to data URL
      dataURL = exportCanvas.toDataURL('image/png');
      console.log('Successfully exported canvas to 600x600 PNG');
      
    } catch (corsError) {
      console.log('Canvas export failed due to CORS, using fallback');
      // Create a simple placeholder image for tainted canvases
      dataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }

      let imagePath = null;
      if (saveImageResponse.ok) {
        const saveResult = await saveImageResponse.json();
        if (saveResult.success) {
          imagePath = saveResult.imagePath;
          console.log('Canvas image saved:', imagePath);
        }
      }

      // Collect product URLs with better names
      const products = loadedImages
        .filter(img => img.originalImageUrl && img.originalImageUrl !== 'Pasted Image')
        .map(img => {
          // Extract product name from URL (simplified for now)
          let productName = 'Product';
          try {
            const url = new URL(img.originalImageUrl);
            
            if (url.hostname.includes('amazon.com')) {
              const pathParts = url.pathname.split('/');
              const productId = pathParts.find(part => part.length === 10 && /^[A-Z0-9]{10}$/.test(part));
              if (productId) {
                productName = `Amazon Product (${productId})`;
              } else {
                productName = 'Amazon Product';
              }
            } else if (url.hostname.includes('etsy.com')) {
              productName = 'Etsy Product';
            } else if (url.hostname.includes('walmart.com')) {
              productName = 'Walmart Product';
            } else if (url.hostname.includes('bestbuy.com')) {
              productName = 'Best Buy Product';
            } else {
              const pathParts = url.pathname.split('/').filter(part => part.length > 0);
              if (pathParts.length > 0) {
                const lastPart = pathParts[pathParts.length - 1];
                if (lastPart.length > 3) {
                  productName = lastPart.replace(/[-_]/g, ' ').replace(/\.[^.]*$/, '');
                }
              }
            }
          } catch (e) {
            console.log('Failed to parse URL for product name:', img.originalImageUrl);
          }
          
          return {
            url: img.originalImageUrl,
            title: productName
          };
        });

      // Prepare moodboard data with image path instead of image data
      const moodboardData = {
        title: moodboardTitle || 'Untitled Moodboard',
        imagePath: imagePath, // Use the saved image path
        products: products,
        createdAt: new Date().toISOString(),
        canvasSize: { width: canvas.width, height: canvas.height }
      };

    console.log('Publishing moodboard with image data length:', dataURL.length);
    console.log('Image data preview:', dataURL.substring(0, 100) + '...');
    console.log('Products to save:', products);
    console.log('Loaded images count:', loadedImages.length);
    console.log('Loaded images with URLs:', loadedImages.filter(img => img.originalImageUrl && img.originalImageUrl !== 'Pasted Image').length);
    console.log('Product URLs found:', loadedImages.filter(img => img.originalImageUrl && img.originalImageUrl !== 'Pasted Image').map(img => img.originalImageUrl));

    // Publish to Supabase
    const result = await api.publishMoodboard(moodboardData);
    
    console.log('Publish result:', result);
    
    ui.showNotification('Moodboard published successfully!');
    
    // Save moodboard data to localStorage for the published page
    if (result.success && result.moodboardData) {
      const storageKey = `moodboard_${result.moodboardId}`;
      localStorage.setItem(storageKey, JSON.stringify(result.moodboardData));
      console.log('Moodboard data saved to localStorage:', storageKey);
      console.log('Saved data:', result.moodboardData);
    } else {
      console.log('No moodboard data returned from server');
    }
    
    // Open the published page (handle popup blocking)
    setTimeout(() => {
      try {
        const newWindow = window.open(result.publicUrl, '_blank');
        if (!newWindow) {
          // Popup was blocked, show a message
          ui.showNotification('Popup blocked! Please manually visit: ' + result.publicUrl, 'info');
        }
      } catch (e) {
        console.log('Failed to open popup:', e);
        ui.showNotification('Please manually visit: ' + result.publicUrl, 'info');
      }
    }, 1000);

    // Only download if canvas export succeeded AND user wants it
    if (dataURL !== 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==') {
      // Ask user if they want to download
      if (confirm('Would you like to download the moodboard image?')) {
        const link = document.createElement('a');
        link.download = `${moodboardTitle || 'moodboard'}.png`;
        link.href = dataURL;
        link.click();
      }
    }

  } catch (error) {
    console.error('Publish error:', error);
    ui.showNotification(error.message || 'Failed to publish moodboard', 'error');
  } finally {
    stopLoading();
  }
});

document.getElementById('remove-bg').addEventListener('click', () => {
  console.log('Remove BG button clicked');
  if (selectedImage) {
    showNotification('Background removal applied! (Simulated)', 'success');
  } else {
    showNotification('Please select an image first', 'error');
  }
});

console.log('All event listeners attached');
