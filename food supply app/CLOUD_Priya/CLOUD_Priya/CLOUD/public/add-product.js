import { db, storage, auth, analytics, logEventToAnalytics } from './firebase.js';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js';
import QRCode from 'https://cdn.skypack.dev/qrcode';


const addProductForm = document.getElementById('addProductForm');
const qrCanvas = document.getElementById('qrCanvas');

const functions = getFunctions();

addProductForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    // 📌 Log form start
    logEventToAnalytics(analytics, 'form_submission_started');

    // Retrieve form values
    const farmerName = document.getElementById('farmerId').value.trim();
    const batchNumber = document.getElementById('batchNumber').value.trim();
    const cropType = document.getElementById('cropType').value.trim();
    const variety = document.getElementById('variety').value.trim();
    const plantingDate = document.getElementById('plantingDate').value;
    const harvestDate = document.getElementById('harvestDate').value;
    const fertilizerType = document.getElementById('fertilizerType').value.trim();
    const inputApplicationDate = document.getElementById('inputApplicationDate').value;
    const quantity = parseFloat(document.getElementById('harvestQuantity').value);
    const qualityGrade = document.getElementById('qualityGrade').value.trim();
    const buyerId = document.getElementById('buyerId').value.trim();
    const saleDate = document.getElementById('saleDate').value;
    const quantitySold = parseFloat(document.getElementById('quantitySold').value);
    const imageFile = document.getElementById('productImage').files[0];

    // Validate required fields
    if (!farmerName || !batchNumber || !cropType || !variety || !plantingDate || 
        !harvestDate || !quantity || isNaN(quantity) || !qualityGrade || !imageFile) {
      throw new Error('Please fill in all required fields.');
    }

    // Get farmer ID from authenticated user
    let farmerId = "dummy-farmer-id";
    if (auth.currentUser) {
      farmerId = auth.currentUser.uid;
    }

    // ⬆️ Log file upload start
    logEventToAnalytics(analytics, 'image_upload_started');


    // Upload image to Firebase Storage
    const imageRef = ref(storage, `product_images/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    const imageUrl = await getDownloadURL(imageRef);

    // 📌 Log product submission
    const productRef = await addDoc(collection(db, 'products'), {
      farmerId,
      farmerName,
      batchNumber,
      cropType,
      variety,
      plantingDate,
      harvestDate,
      fertilizerType,
      inputApplicationDate,
      quantity,
      qualityGrade,
      buyerId,
      saleDate,
      quantitySold: isNaN(quantitySold) ? 0 : quantitySold,
      imageUrl,
      status: 'Harvested',
      createdAt: serverTimestamp(),
    });

    logEventToAnalytics(analytics, 'product_added', {
      crop_type: cropType,
      quality_grade: qualityGrade,
      quantity: quantity
    });

    const productId = productRef.id;
    const generateProductUrl = httpsCallable(functions, 'generateProductUrl');
    const response = await generateProductUrl({ productId });
    const productUrl = response.data.url;

    await updateDoc(doc(db, 'products', productId), {
      qrCodeUrl: productUrl,
    });

    // 📌 Log QR generation
    await QRCode.toCanvas(qrCanvas, productUrl, { width: 200 });
    logEventToAnalytics(analytics, 'qr_code_generated', {
      product_id: productId
    });

    // Download QR
    const qrImage = await QRCode.toDataURL(productUrl, { width: 200 });
    const downloadLink = document.createElement('a');
    downloadLink.href = qrImage;
    downloadLink.download = `qr_code_${productId}.png`;
    downloadLink.click();

    // 📌 Log complete
    logEventToAnalytics(analytics, 'form_submission_complete', {
      product_id: productId
    });

    // Show success
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';
    setTimeout(() => {
      successMessage.style.display = 'none';
    }, 5000);

    addProductForm.reset();
    qrCanvas.getContext('2d').clearRect(0, 0, qrCanvas.width, qrCanvas.height);

  } catch (err) {
    console.error('Error adding product:', err);

    // ❌ Log error
    logEventToAnalytics(analytics, 'form_submission_failed', {
      error_message: err.message
    });

    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = "Failed to submit crop data: ${err.message}";
    errorMessage.style.display = 'block';
    setTimeout(() => {
      errorMessage.style.display = 'none';
    }, 5000);
  }
});