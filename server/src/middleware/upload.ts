import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const baseUploadsDir = path.join(__dirname, '../../uploads');

const ensureDir = (subDir: string) => {
  const dir = path.join(baseUploadsDir, subDir)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
const limits = { fileSize: 5 * 1024 * 1024 } // 5MB

const makeStorage = (subDir: string) =>
  multer.diskStorage({
    destination: function (_req: any, _file: any, cb: any) {
      cb(null, ensureDir(subDir))
    },
    filename: function (req: Request, file: any, cb: any) {
      const id = (req.params as any).id || subDir.slice(0, -1)
      const ext = path.extname(file.originalname) || '.jpg'
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase()) ? ext.toLowerCase() : '.jpg'
      const filename = `${id}-${Date.now()}${safeExt}`
      cb(null, filename)
    },
  })

const buildUploader = (subDir: string) =>
  multer({
    storage: makeStorage(subDir),
    limits,
    fileFilter: (_req: any, file: any, cb: any) => {
      if (allowedMimeTypes.includes(file.mimetype)) cb(null, true)
      else cb(new Error('Invalid file type'))
    },
  })

export const athleteAvatarUpload = buildUploader('athletes')
export const userAvatarUpload = buildUploader('users')

// Backwards compatibility for existing imports
export const avatarUpload = athleteAvatarUpload
