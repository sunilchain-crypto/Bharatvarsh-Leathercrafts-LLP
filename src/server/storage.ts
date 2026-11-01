import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local disk uploads directory on host
export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure uploads directory exists on host disk
export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`[Disk Storage] Initialized media upload directory at ${UPLOAD_DIR}`);
  }
}

// Configure multer disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate clean sanitized filename with timestamp
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e5)}`;
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images and documents
export const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMime = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'application/pdf'
    ];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPG, PNG, WEBP, GIF, SVG, PDF.`));
    }
  }
});

export interface DiskFileInfo {
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export function listLocalFiles(): DiskFileInfo[] {
  ensureUploadDir();
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    return files
      .filter((file) => !file.startsWith('.'))
      .map((file) => {
        const fullPath = path.join(UPLOAD_DIR, file);
        const stats = fs.statSync(fullPath);
        return {
          filename: file,
          url: `/uploads/${file}`,
          size: stats.size,
          uploadedAt: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  } catch (err) {
    console.error('[Disk Storage] Error reading uploads directory:', err);
    return [];
  }
}

export function deleteLocalFile(filename: string): boolean {
  try {
    const safeFilename = path.basename(filename);
    const fullPath = path.join(UPLOAD_DIR, safeFilename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[Disk Storage] Error deleting file:', err);
    return false;
  }
}
