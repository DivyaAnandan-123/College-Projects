import { db, auth } from './firebase.js';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const productList = document.getElementById('productList');
const totalProducts = document.getElementById('totalProducts');
const activeProducts = document.getElementById('activeProducts');
const completedShipments = document.getElementById('completedShipments');
const qrCodeScans = document.getElementById('qrCodeScans');

// GET function to fetch products from Firebase
async function getProducts(farmerId = null) {
  console.log('🔍 Fetching products from Firebase...');
  
  try {
    let q;
    
    if (farmerId) {
      // Query for specific farmer
      q = query(
        collection(db, 'products'), 
        where('farmerId', '==', farmerId),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Query all products (fallback)
      q = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📦 Product fetched:', doc.id, data);
      products.push({ 
        id: doc.id, 
        ...data,
        // Convert Firestore timestamps to readable dates
        createdAt: data.createdAt?.toDate?.() || new Date(),
        plantingDate: data.plantingDate || '',
        harvestDate: data.harvestDate || '',
        saleDate: data.saleDate || '',
        inputApplicationDate: data.inputApplicationDate || ''
      });
    });

    console.log(`✅ Successfully fetched ${products.length} products`);
    return products;
    
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    throw error;
  }
}

// Real-time listener for products
function setupRealtimeListener(farmerId = null) {
  console.log('🔄 Setting up real-time listener...');
  
  try {
    let q;
    
    if (farmerId) {
      q = query(
        collection(db, 'products'), 
        where('farmerId', '==', farmerId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📡 Real-time update received. Docs count:', snapshot.size);
      
      const products = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        products.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          plantingDate: data.plantingDate || '',
          harvestDate: data.harvestDate || '',
          saleDate: data.saleDate || '',
          inputApplicationDate: data.inputApplicationDate || ''
        });
      });

      displayProducts(products);
    }, (error) => {
      console.error('❌ Real-time listener error:', error);
      showError('Failed to load products in real-time. Trying one-time fetch...');
      // Fallback to one-time fetch
      loadProductsOnce();
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up real-time listener:', error);
    return null;
  }
}

// One-time fetch function (fallback)
async function loadProductsOnce(farmerId = null) {
  console.log('🔄 Loading products (one-time fetch)...');
  
  try {
    showLoading(true);
    const products = await getProducts(farmerId);
    displayProducts(products);
  } catch (error) {
    console.error('❌ Error loading products:', error);
    showError('Failed to load products. Please refresh the page.');
  } finally {
    showLoading(false);
  }
}

// Display products in the UI
function displayProducts(products) {
  console.log('🎨 Displaying products in UI...');
  
  // Update metrics
  updateMetrics(products);
  
  if (products.length === 0) {
    productList.innerHTML = `
      <div class="card no-products">
        <span class="icon">📦</span>
        <p>No products found. Add your first product to get started!</p>
        <a href="forms.html" class="add-product-btn">Add Product</a>
      </div>
    `;
    return;
  }

  const cropIcons = {
    Wheat: '🌾',
    Rice: '🌿',
    Maize: '🌽',
    Barley: '🌾',
    Soybean: '🌱',
    Cotton: '☁️'
  };

  productList.innerHTML = products
    .map((product) => `
      <div class="card" data-product-id="${product.id}">
        <h3>${cropIcons[product.cropType] || '📦'} ${product.batchNumber || 'N/A'} (${product.cropType || 'N/A'})</h3>
        <p><strong>Variety:</strong> ${product.variety || 'N/A'}</p>
        <p><strong>Farmer:</strong> ${product.farmerName || product.farmerId || 'N/A'}</p>
        <p><strong>Planting Date:</strong> ${formatDate(product.plantingDate)}</p>
        <p><strong>Harvest Date:</strong> ${formatDate(product.harvestDate)}</p>
        <p><strong>Quantity:</strong> ${product.quantity || 0} kg</p>
        <p><strong>Quality Grade:</strong> ${product.qualityGrade || 'N/A'}</p>
        ${product.fertilizerType ? `<p><strong>Fertilizer/Pesticide:</strong> ${product.fertilizerType}</p>` : ''}
        ${product.inputApplicationDate ? `<p><strong>Application Date:</strong> ${formatDate(product.inputApplicationDate)}</p>` : ''}
        ${product.buyerId ? `<p><strong>Buyer ID:</strong> ${product.buyerId}</p>` : ''}
        ${product.saleDate ? `<p><strong>Sale Date:</strong> ${formatDate(product.saleDate)}</p>` : ''}
        <p><strong>Quantity Sold:</strong> ${product.quantitySold || 0} kg</p>
        <p><strong>Status:</strong> <span class="status-${(product.status || '').toLowerCase()}">${product.status || 'N/A'}</span></p>
        <p><strong>Created:</strong> ${formatDate(product.createdAt)}</p>
        ${product.imageUrl ? `<img src="${product.imageUrl}" alt="Product Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;">` : ''}
        <div class="qr-code" id="qr-${product.id}"></div>
        <div class="card-actions">
          ${product.qrCodeUrl ? `<a href="${product.qrCodeUrl}" target="_blank" class="action-btn">View Product</a>` : ''}
          <button class="action-btn" onclick="showQRCode('${product.id}', '${product.qrCodeUrl || ''}')">Generate QR</button>
          ${product.status !== 'Shipped' && product.status !== 'Delivered' ? `
            <button class="action-btn" onclick="updateStatus('${product.id}', 'Shipped')">Mark as Shipped</button>
          ` : ''}
          ${product.status !== 'Delivered' ? `
            <button class="action-btn" onclick="updateStatus('${product.id}', 'Delivered')">Mark as Delivered</button>
          ` : ''}
          <button class="action-btn" onclick="refreshProduct('${product.id}')">Refresh</button>
        </div>
      </div>
    `)
    .join('');

  console.log(`✅ Displayed ${products.length} products`);
}

// Update dashboard metrics
function updateMetrics(products) {
  let activeCount = 0;
  let completedCount = 0;
  
  products.forEach(product => {
    if (product.status === 'Harvested' || product.status === 'Shipped') {
      activeCount++;
    } else if (product.status === 'Delivered') {
      completedCount++;
    }
  });

  totalProducts.textContent = products.length;
  activeProducts.textContent = activeCount;
  completedShipments.textContent = completedCount;
  qrCodeScans.textContent = Math.floor(Math.random() * 100); // Placeholder
}

// Utility function to format dates
function formatDate(date) {
  if (!date) return 'N/A';
  
  if (typeof date === 'string') {
    return date;
  }
  
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  
  return 'N/A';
}

// Show loading state
function showLoading(show) {
  const loadingDiv = document.getElementById('loadingIndicator');
  if (loadingDiv) {
    loadingDiv.style.display = show ? 'block' : 'none';
  }
  
  if (show) {
    productList.innerHTML = `
      <div class="card" style="text-align: center; padding: 40px;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid aqua; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 20px;">Loading products...</p>
      </div>
    `;
  }
}

// Show error message
function showError(message) {
  productList.innerHTML = `
    <div class="card" style="text-align: center; padding: 40px; border: 2px solid #ff6b6b;">
      <span style="font-size: 48px;">⚠️</span>
      <p style="color: #ff6b6b; margin: 20px 0;">${message}</p>
      <button class="action-btn" onclick="location.reload()">Retry</button>
    </div>
  `;
}

// Global functions for UI interactions
window.updateStatus = async (productId, newStatus) => {
  try {
    console.log('🔄 Updating status for product:', productId, 'to', newStatus);
    
    await updateDoc(doc(db, 'products', productId), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Status updated successfully');
    alert(`Product status updated to ${newStatus}`);
    
  } catch (err) {
    console.error('❌ Error updating status:', err);
    alert('Failed to update status: ' + err.message);
  }
};

window.showQRCode = async (productId, url) => {
  console.log('🔗 Generating QR code for product:', productId);
  
  if (!url) {
    // Generate URL if not available
    url = `https://cloud-priya.web.app/product/${productId}`;
  }
  
  const qrContainer = document.getElementById(`qr-${productId}`);
  if (!qrContainer) {
    console.error('QR container not found');
    return;
  }

  try {
    // Clear existing QR code
    qrContainer.innerHTML = '';
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    canvas.style.border = '1px solid #ccc';
    canvas.style.borderRadius = '8px';
    qrContainer.appendChild(canvas);
    
    // Generate QR code using the global QRCode library
    if (typeof QRCode !== 'undefined') {
      await QRCode.toCanvas(canvas, url, { width: 200 });
      console.log('✅ QR code generated');
    } else {
      qrContainer.innerHTML = '<p>QR Code library not loaded</p>';
    }
    
  } catch (error) {
    console.error('❌ Error generating QR code:', error);
    qrContainer.innerHTML = '<p>Error generating QR code</p>';
  }
};

window.refreshProduct = async (productId) => {
  console.log('🔄 Refreshing product:', productId);
  try {
    // Get current farmer ID
    const user = auth.currentUser;
    const farmerId = user ? user.uid : null;
    
    // Reload products
    await loadProductsOnce(farmerId);
    console.log('✅ Products refreshed');
    
  } catch (error) {
    console.error('❌ Error refreshing products:', error);
    alert('Failed to refresh products');
  }
};

// Initialize dashboard
function initializeDashboard() {
  console.log('🚀 Initializing dashboard...');
  
  // Check authentication state
  auth.onAuthStateChanged((user) => {
    console.log('👤 Auth state changed. User:', user ? user.uid : 'No user');
    
    const farmerId = user ? user.uid : null;
    
    // Try real-time listener first, fallback to one-time fetch
    const unsubscribe = setupRealtimeListener(farmerId);
    
    if (!unsubscribe) {
      console.log('📡 Real-time listener failed, using one-time fetch');
      loadProductsOnce(farmerId);
    }
  });
}

// Export functions for external use
export { 
  getProducts, 
  loadProductsOnce, 
  setupRealtimeListener, 
  displayProducts,
  initializeDashboard 
};

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, initializing dashboard...');
  initializeDashboard();
});

// If DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  initializeDashboard();
}