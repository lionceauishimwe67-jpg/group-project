const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/students/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'student-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - accept images including HEIC
const fileFilter = (req, file, cb) => {
  // Accepted mime types
  const acceptedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif'
  ];
  
  // Check by mimetype or file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const isHeic = ext === '.heic' || ext === '.heif';
  
  if (acceptedMimes.includes(file.mimetype) || isHeic) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed! (JPG, PNG, GIF, WebP, HEIC)'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper function to check if file is HEIC/HEIF
function isHeicFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ext === '.heic' || ext === '.heif';
}

// Helper function to convert HEIC to JPG
async function convertHeicToJpg(inputPath, outputPath) {
  try {
    // Use sharp to convert HEIC to JPG
    await sharp(inputPath)
      .jpeg({ quality: 90 })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error('HEIC conversion error:', error);
    return false;
  }
}

// Upload student photo endpoint
router.post('/student-photo', authenticateToken, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let finalFilename = req.file.filename;
    let finalPath = req.file.path;

    // Check if file is HEIC and convert to JPG
    if (isHeicFile(req.file.filename)) {
      const baseName = path.basename(req.file.filename, path.extname(req.file.filename));
      const jpgFilename = baseName + '.jpg';
      const jpgPath = path.join(path.dirname(req.file.path), jpgFilename);

      // Convert HEIC to JPG
      const converted = await convertHeicToJpg(req.file.path, jpgPath);
      
      if (converted) {
        // Delete original HEIC file
        fs.unlinkSync(req.file.path);
        
        // Update final filename and path
        finalFilename = jpgFilename;
        finalPath = jpgPath;
      } else {
        // If conversion fails, keep original but warn
        console.warn('HEIC conversion failed, keeping original file');
      }
    }

    // Return the file path that can be stored in the database
    const photoPath = `/uploads/students/${finalFilename}`;
    
    res.json({
      message: 'Photo uploaded successfully',
      photoPath: photoPath,
      filename: finalFilename,
      converted: isHeicFile(req.file.filename)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading photo', error: error.message });
  }
});

// Serve uploaded files statically
router.use('/files', express.static('public/uploads/students/'));

module.exports = router;
