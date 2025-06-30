// QR Code from Skypack (ESM Compatible)
import QRCode from 'https://cdn.skypack.dev/qrcode';

// Firebase Imports
import { db, auth, analytics, logEventToAnalytics } from './firebase.js';
import {
  collection, query, where, onSnapshot,
  getDocs, updateDoc, doc, serverTimestamp, orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

console.log('✅ product-list.js is running');
console.log(QRCode); // should show a function or object, not undefined

// Log dashboard opened
logEventToAnalytics(analytics, 'product_list_viewed');

// DOM Elements
const productList = document.getElementById('productList');
const totalProducts = document.getElementById('totalProducts');
const activeProducts = document.getElementById('activeProducts');
const completedShipments = document.getElementById('completedShipments');
const qrCodeScans = document.getElementById('qrCodeScans');

// QR Code Generation
export function generateQRCode(elementId, url) {
  const canvas = document.getElementById(elementId);
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  QRCode.toCanvas(canvas, url, { width: 200 }, (error) => {
    if (error) {
      console.error('Error generating QR code:', error);
      return;
    }
    console.log('✅ QR code generated for URL:', url);
    logEventToAnalytics(analytics, 'qr_code_rendered', { url });
  });
}

// QR Code Download
export async function downloadQRCode(url, fileName) {
  try {
    const qrImage = await QRCode.toDataURL(url, { width: 200 });
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = fileName;
    link.click();

    logEventToAnalytics(analytics, 'qr_code_downloaded', {
      file_name: fileName,
      product_url: url
    });
  } catch (err) {
    console.error('❌ Error downloading QR code:', err);
    logEventToAnalytics(analytics, 'qr_download_error', {
      error_message: err.message
    });
  }
}

// Refresh Dashboard
export function refreshDashboard() {
  location.reload();
}
window.refreshDashboard = refreshDashboard;

// Get Products
async function getProducts(farmerId = null) {
  try {
    const q = farmerId
      ? query(collection(db, 'products'), where('farmerId', '==', farmerId), orderBy('createdAt', 'desc'))
      : query(collection(db, 'products'), orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const products = [];

    querySnapshot.forEach((doc) => {
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

    return products;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    throw error;
  }
}

// Real-time Listener
function setupRealtimeListener(farmerId = null) {
  try {
    const q = farmerId
      ? query(collection(db, 'products'), where('farmerId', '==', farmerId), orderBy('createdAt', 'desc'))
      : query(collection(db, 'products'), orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
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
      showError('Real-time fetch failed. Falling back...');
      loadProductsOnce();
    });
  } catch (err) {
    console.error('❌ Error setting up listener:', err);
    return null;
  }
}

// One-time Load
async function loadProductsOnce(farmerId = null) {
  try {
    showLoading(true);
    const products = await getProducts(farmerId);
    displayProducts(products);
  } catch (err) {
    showError('Failed to load products.');
  } finally {
    showLoading(false);
  }
}

// Display Products
function displayProducts(products) {
  updateMetrics(products);

  if (products.length === 0) {
    productList.innerHTML = `
      <div class="card no-products">
        <span class="icon">📦</span>
        <p>No products found. Add your first product to get started!</p>
        <a href="forms.html" class="add-product-btn">Add Product</a>
      </div>`;
    return;
  }

  const cropIcons = {
    Wheat: '🌾', Rice: '🌿', Maize: '🌽',
    Barley: '🌾', Soybean: '🌱', Cotton: '☁️'
  };

  productList.innerHTML = products.map((product) => `
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
        ${product.status !== 'Shipped' && product.status !== 'Delivered' ? `<button class="action-btn" onclick="updateStatus('${product.id}', 'Shipped')">Mark as Shipped</button>` : ''}
        ${product.status !== 'Delivered' ? `<button class="action-btn" onclick="updateStatus('${product.id}', 'Delivered')">Mark as Delivered</button>` : ''}
        <button class="action-btn" onclick="refreshProduct('${product.id}')">Refresh</button>
      </div>
    </div>`).join('');
}

// Metrics Update
function updateMetrics(products) {
  let active = 0, completed = 0;
  products.forEach(p => {
    if (p.status === 'Harvested' || p.status === 'Shipped') active++;
    if (p.status === 'Delivered') completed++;
  });
  totalProducts.textContent = products.length;
  activeProducts.textContent = active;
  completedShipments.textContent = completed;
  qrCodeScans.textContent = Math.floor(Math.random() * 100); // Simulated metric
}

// Utility: Format Dates
function formatDate(date) {
  if (!date) return 'N/A';
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toLocaleDateString();
  return 'N/A';
}

// Utility: Loading
function showLoading(show) {
  const loader = document.getElementById('loadingIndicator');
  if (loader) loader.style.display = show ? 'block' : 'none';
  if (show) {
    productList.innerHTML = `
      <div class="card" style="text-align:center;padding:40px;">
        <div style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid aqua;border-radius:50%;animation:spin 1s linear infinite;"></div>
        <p style="margin-top:20px;">Loading products...</p>
      </div>`;
  }
}

// Utility: Error
function showError(message) {
  productList.innerHTML = `
    <div class="card" style="text-align:center;padding:40px;border:2px solid #ff6b6b;">
      <span style="font-size:48px;">⚠️</span>
      <p style="color:#ff6b6b;margin:20px 0;">${message}</p>
      <button class="action-btn" onclick="location.reload()">Retry</button>
    </div>`;
}

// Global Actions
window.updateStatus = async (productId, status) => {
  try {
    await updateDoc(doc(db, 'products', productId), {
      status: status,
      updatedAt: serverTimestamp(),
    });
    alert(`✅ Status updated to ${status}`);
  } catch (err) {
    alert('Error updating status: ' + err.message);
  }
};

window.showQRCode = async (productId, url) => {
  if (!url) url = `https://cloud-priya.web.app/product/${productId}`;
  const qrDiv = document.getElementById(`qr-${productId}`);
  if (!qrDiv) return;
  qrDiv.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  canvas.style.border = '1px solid #ccc';
  qrDiv.appendChild(canvas);
  await QRCode.toCanvas(canvas, url, { width: 200 });
};

window.refreshProduct = async () => {
  const user = auth.currentUser;
  const farmerId = user ? user.uid : null;
  await loadProductsOnce(farmerId);
};

// Init
function initializeDashboard() {
  auth.onAuthStateChanged(() => {
  const testFarmerId = '12345'; // Force this for now
  setupRealtimeListener(testFarmerId);
});
}

// Auto-start
document.addEventListener('DOMContentLoaded', initializeDashboard);
if (document.readyState !== 'loading') initializeDashboard();