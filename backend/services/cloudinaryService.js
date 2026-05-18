const cloudinary = require('../config/cloudinary');

function assertCloudinaryConfig() {
  const config = cloudinary.config();
  const values = [config.cloud_name, config.api_key, config.api_secret];
  const hasPlaceholder = values.some((value) => typeof value === 'string' && value.startsWith('your-'));
  if (!config.cloud_name || !config.api_key || !config.api_secret || hasPlaceholder) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET or CLOUDINARY_SECRET.');
  }
}

function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

async function uploadToCloudinary(file, folder) {
  assertCloudinaryConfig();

  if (!file) {
    throw new Error('No image file was provided for Cloudinary upload');
  }

  if (file.buffer) {
    return uploadBuffer(file.buffer, folder);
  }

  if (file.path) {
    return cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    });
  }

  throw new Error('Unsupported upload file format');
}

module.exports = { uploadToCloudinary };
