import QRCode from 'qrcode';

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
    console.log('QR code generated for URL:', url);
  });
}

export async function downloadQRCode(url, fileName) {
  try {
    const qrImage = await QRCode.toDataURL(url, { width: 200 });
    const downloadLink = document.createElement('a');
    downloadLink.href = qrImage;
    downloadLink.download = fileName;
    downloadLink.click();
  } catch (err) {
    console.error('Error downloading QR code:', err);
  }
}