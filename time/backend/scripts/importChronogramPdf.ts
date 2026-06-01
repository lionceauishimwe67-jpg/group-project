import path from 'path';
import fs from 'fs';
import { uploadChronogram } from '../src/controllers/smartTimetableController';

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const sourceFile = path.resolve(projectRoot, '..', 'AI_Timetable_Testing_Data.pdf');
  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Source file not found: ${sourceFile}`);
  }

  const uploadsDir = path.resolve(projectRoot, 'uploads', 'chronograms');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const destName = `chronogram-${Date.now()}-${Math.floor(Math.random() * 1e9)}.pdf`;
  const destPath = path.join(uploadsDir, destName);
  fs.copyFileSync(sourceFile, destPath);
  console.log(`Copied PDF to upload directory: ${destPath}`);

  const req: any = {
    file: {
      path: destPath,
      originalname: path.basename(sourceFile),
      filename: destName,
      mimetype: 'application/pdf',
      size: fs.statSync(destPath).size,
    },
    user: { userId: null },
  };

  const result: any = {};
  const res: any = {
    status(code: number) {
      result.status = code;
      return this;
    },
    json(body: any) {
      result.body = body;
      return this;
    },
    send(body: any) {
      result.body = body;
      return this;
    }
  };

  await new Promise<void>((resolve, reject) => {
    uploadChronogram(req, res, (err?: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  if (!result.body) {
    throw new Error('Upload controller did not return JSON');
  }

  console.log('Upload result:', JSON.stringify(result.body, null, 2));
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
