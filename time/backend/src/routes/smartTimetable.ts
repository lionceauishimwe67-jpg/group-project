import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  uploadChronogram as uploadChronogramController,
  validateChronogramData,
  generateSmartTimetable,
  saveGeneratedTimetable,
  getRealWorldTime,
  getCurrentActivity,
  exportTimetable,
  getGenerationHistory,
  deleteGeneration,
  deleteAllHistory,
  deleteAllTimetable,
  deleteAllUploads,
  fullTimetableReset,
} from '../controllers/smartTimetableController';

// Configure multer for any file type
const uploadDir = path.join(process.cwd(), 'uploads', 'chronograms');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `chronogram-${uniqueSuffix}${ext}`);
  }
});

const uploadChronogram = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router();

// Chronogram upload (any file type)
router.post('/upload', uploadChronogram.single('file'), uploadChronogramController);

// Validate extracted data against database
router.post('/validate', validateChronogramData);

// Generate smart timetable from chronogram
router.post('/generate', generateSmartTimetable);

// Save generated timetable to active timetable
router.post('/save', saveGeneratedTimetable);

// Real-world current time
router.get('/real-time', getRealWorldTime);

// Current activity for a class (current/next lesson, break, lunch)
router.get('/current-activity', getCurrentActivity);

// Export timetable (excel, csv, pdf)
router.post('/export', exportTimetable);

// Generation history
router.get('/history', getGenerationHistory);

// Delete single generation
router.delete('/history/:id', deleteGeneration);

// Delete all generation history
router.post('/history/delete-all', deleteAllHistory);

// Delete all timetable entries (reset timetable)
router.post('/timetable/delete-all', deleteAllTimetable);

// Delete all chronogram uploads
router.post('/uploads/delete-all', deleteAllUploads);

// Full timetable reset (delete everything)
router.post('/reset', fullTimetableReset);

export default router;
