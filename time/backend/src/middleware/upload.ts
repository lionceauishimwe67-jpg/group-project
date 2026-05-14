import multer from 'multer';
import path from 'path';

// Use memory storage since images are stored in database
const storage = multer.memoryStorage();

// File filter - accept all common image formats
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.avif', '.heic', '.heif'
  ];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (PNG, JPG, JPEG, GIF, BMP, WEBP, SVG, ICO, TIFF, AVIF, HEIC, HEIF)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '1048576000') // 1GB default - accept any photo size
  },
  fileFilter: fileFilter
});

export default upload;
