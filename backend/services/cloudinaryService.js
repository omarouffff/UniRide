const cloudinary = require('../config/cloudinary');
const fs = require('fs');

async function uploadToCloudinary(filePath, folder) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
    quality: 'auto',
    fetch_format: 'auto',
  });

  fs.unlink(filePath, (err) => {
    if (err) {
      console.warn('Could not remove temp file', filePath, err);
    }
  });

  return result;
}

module.exports = { uploadToCloudinary };
