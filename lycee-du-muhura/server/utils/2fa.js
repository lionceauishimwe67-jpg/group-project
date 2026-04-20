const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

exports.generateSecret = () => {
  return speakeasy.generateSecret({
    name: 'Lycee du Muhura',
    length: 32
  });
};

exports.generateQRCode = async (otpauthUrl) => {
  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch (err) {
    throw new Error('Failed to generate QR code');
  }
};

exports.verifyToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2
  });
};
