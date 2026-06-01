import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

/** Images, PDF, and common document extensions for announcements */
export const ANNOUNCEMENT_ALLOWED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.avif', '.heic', '.heif',
  '.pdf',
  '.doc', '.docx', '.txt', '.rtf',
  '.xls', '.xlsx', '.ppt', '.pptx',
];

const fileFilter = (_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ANNOUNCEMENT_ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type not allowed. Supported: images, PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX (${ANNOUNCEMENT_ALLOWED_EXTENSIONS.join(', ')})`
      )
    );
  }
};

const announcementUpload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '1048576000', 10),
  },
  fileFilter,
});

export default announcementUpload;
