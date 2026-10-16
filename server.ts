import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/auth';
import propertiesRoutes from './server/routes/properties';
import favoritesRoutes from './server/routes/favorites';
import conversationsRoutes from './server/routes/conversations';
import inquiriesRoutes from './server/routes/inquiries';
import reportsRoutes from './server/routes/reports';
import adminRoutes from './server/routes/admin';
import statsRoutes from './server/routes/stats';
import notificationsRoutes from './server/routes/notifications';
import mediaRoutes from './server/routes/media';
import chatRoutes from './server/routes/chat';
import { db } from './server/db/database';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  // Trust the first proxy hop (Render/Vercel) so req.ip reflects the real client
  app.set('trust proxy', 1);

  // Middleware
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    `http://localhost:${PORT}`,
    'https://rent-hub-psi.vercel.app',
    process.env.FRONTEND_URL,
  ].filter((origin): origin is string => Boolean(origin));

  app.use(
    '/api',
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Static uploads directory
  const uploadsDir = path.join(process.cwd(), 'server', 'data', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Health check API with database diagnostic details
  app.get('/api/health', (_req, res) => {
    const dbStatus = db.getDatabaseStatus();
    res.json({
      status: 'ok',
      service: 'RentHub Full-Stack Server',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: {
        engine: dbStatus.engine,
        status: dbStatus.status,
        isPostgres: dbStatus.isPostgres,
        totalRecords: dbStatus.totalRecords,
        tablesCount: dbStatus.tables.length
      }
    });
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/properties', propertiesRoutes);
  app.use('/api/favorites', favoritesRoutes);
  app.use('/api/conversations', conversationsRoutes);
  app.use('/api/inquiries', inquiriesRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/chat', chatRoutes);

  // Global Error Handler for API
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RentHub Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
