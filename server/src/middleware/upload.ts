import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const baseUploadsDir = path.join(__dirname, '../../uploads');
const athletesDir = path.join(baseUploadsDir, 'athletes');

if (!fs.existsSync(athletesDir)) {
  fs.mkdirSync(athletesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    cb(null, athletesDir);
  },
  filename: function (req: Request, file: any, cb: any) {
    const id = (req.params as any).id || 'athlete';
    const ext = path.extname(file.originalname) || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase()) ? ext.toLowerCase() : '.jpg';
    const filename = `${id}-${Date.now()}${safeExt}`;
    cb(null, filename);
  }
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req: any, file: any, cb: any) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});
