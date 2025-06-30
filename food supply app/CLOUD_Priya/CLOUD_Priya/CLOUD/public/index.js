const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.generateProductUrl = functions.https.onCall(async (data, context) => {
  const productId = data.productId;

  if (!productId) {
    throw new functions.https.HttpsError('invalid-argument', 'Product ID is required');
  }

  // Replace with your app's domain
  const productUrl = `https://yourapp.com/product/${productId}`;

  return { url: productUrl };
});