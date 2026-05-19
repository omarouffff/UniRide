const multer = require('multer');

const storage = multer.memoryStorage();
const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    return;
  }

  if (!file.originalname.match(/\.(jpe?g|png|webp)$/i)) {
    cb(new Error('Upload file name indicates an invalid image type'), false);
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3,
  },
});

module.exports = upload;
