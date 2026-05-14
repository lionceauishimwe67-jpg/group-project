import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getCurrentSessions,
  getTimetable,
  getTimetableEntry,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  deleteAllTimetableEntries,
  bulkSaveTimetable,
  getReferenceData,
  getWeeklyTimetable,
  batchImportTimetable
} from '../controllers/timetableController';
import upload from '../middleware/upload';

const router = Router();

const batchImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv', '.json'];
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Only spreadsheet files are allowed: .xlsx, .xls, .csv, .json'));
    }
  }
});

// Public routes (for display screen)
router.get('/current-sessions', getCurrentSessions);
router.get('/today', getTimetable);
router.get('/week', getWeeklyTimetable);

// Admin routes
router.get('/entries', getTimetable);
router.get('/entries/:id', getTimetableEntry);
router.post('/', createTimetableEntry);
router.post('/bulk-save', bulkSaveTimetable);
router.put('/:id', updateTimetableEntry);
router.delete('/', deleteAllTimetableEntries);
router.delete('/:id', deleteTimetableEntry);
router.post('/batch-import', batchImportUpload.single('file'), batchImportTimetable);

// Reference data (for dropdowns in admin)
router.get('/reference-data', getReferenceData);

export default router;
