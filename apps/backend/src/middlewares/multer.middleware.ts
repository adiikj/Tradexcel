import multer from 'multer';
import crypto from 'crypto';
import path from 'path';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  })

 export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        cb(new Error('Only JPEG, PNG, WEBP, and GIF images are allowed'));
        return;
      }
      cb(null, true);
    },
})
