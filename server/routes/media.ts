import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticate } from '../middleware/auth';

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), 'server', 'data', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Preset images for property listings
export const PRESET_PROPERTY_IMAGES = [
  {
    category: 'Living Room',
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
    title: 'Modern Bright Living Room'
  },
  {
    category: 'Living Room',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    title: 'Spacious Open Living'
  },
  {
    category: 'Bedroom',
    url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?w=1200&auto=format&fit=crop&q=80',
    title: 'Cozy Master Bedroom'
  },
  {
    category: 'Bedroom',
    url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200&auto=format&fit=crop&q=80',
    title: 'Contemporary Bedroom Suite'
  },
  {
    category: 'Kitchen',
    url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80',
    title: 'Equipped Modern Kitchen'
  },
  {
    category: 'Kitchen',
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80',
    title: 'Gourmet Kitchen Island'
  },
  {
    category: 'Bathroom',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop&q=80',
    title: 'Clean Marble Bathroom'
  },
  {
    category: 'Exterior & Villa',
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
    title: 'Modern Architecture Villa'
  },
  {
    category: 'Exterior & Villa',
    url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80',
    title: 'Family Residence Courtyard'
  },
  {
    category: 'Balcony & Views',
    url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200&auto=format&fit=crop&q=80',
    title: 'Penthouse Balcony & Terrace'
  }
];

// GET /api/media/preset-images
router.get('/preset-images', (_req: Request, res: Response) => {
  res.json({ presetImages: PRESET_PROPERTY_IMAGES });
});

// POST /api/media/upload
router.post('/upload', authenticate, (req: Request, res: Response) => {
  try {
    const { imageBase64, filename } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided.' });
    }

    const ALLOWED_MIME_TYPES: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    };

    const match = typeof imageBase64 === 'string'
      ? imageBase64.match(/^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
      : null;

    if (!match || !ALLOWED_MIME_TYPES[match[1]]) {
      return res.status(400).json({ error: 'Only JPG, PNG, and WEBP image uploads are allowed.' });
    }

    const ext = ALLOWED_MIME_TYPES[match[1]];
    const base64Data = match[2];

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image file exceeds the 10MB limit.' });
    }

    const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;

    return res.status(201).json({
      success: true,
      url: publicUrl,
      filename: safeName,
      sizeBytes: buffer.length
    });
  } catch (error) {
    console.error('Media upload error:', error);
    return res.status(500).json({ error: 'Failed to process image upload.' });
  }
});

export default router;
