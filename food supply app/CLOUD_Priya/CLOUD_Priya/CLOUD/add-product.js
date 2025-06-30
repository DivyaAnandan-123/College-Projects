import { db, storage, auth } from './firebase.js';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import QRCode from 'qrcode';

const addProductForm = document.getElementById('addProductForm');
const qrCanvas = document.getElementById('qrCanvas');

const functions = getFunctions();

addProductForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
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

    // Upload image to Firebase Storage
    const imageRef = ref(storage, `product_images/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    const imageUrl = await getDownloadURL(imageRef);

    // Add product to Firestore
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

    // Generate product URL using Cloud Function
    const productId = productRef.id;
    const generateProductUrl = httpsCallable(functions, 'generateProductUrl');
    const response = await generateProductUrl({ productId });
    const productUrl = response.data.url;

    // Update product with QR code URL
    await updateDoc(doc(db, 'products', productId), {
      qrCodeUrl: productUrl,
    });

    // Generate and display QR code
    await QRCode.toCanvas(qrCanvas, productUrl, { width: 200 });
    console.log('QR code generated!');

    // Download QR code
    const qrImage = await QRCode.toDataURL(productUrl, { width: 200 });
    const downloadLink = document.createElement('a');
    downloadLink.href = qrImage;
    downloadLink.download = `qr_code_${productId}.png`;
    downloadLink.click();

    // Show success message
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';
    setTimeout(() => {
      successMessage.style.display = 'none';
    }, 5000);

    // Reset form
    addProductForm.reset();
    qrCanvas.getContext('2d').clearRect(0, 0, qrCanvas.width, qrCanvas.height);

  } catch (err) {
    console.error('Error adding product:', err);
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = `Failed to submit crop data: ${err.message}`;
    errorMessage.style.display = 'block';
    setTimeout(() => {
      errorMessage.style.display = 'none';
    }, 5000);
  }
});