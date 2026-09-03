import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = db.getNotifications(req.user.id);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    db.markNotificationAsRead(id, req.user.id);

    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    db.markAllNotificationsAsRead(req.user.id);
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

export default router;
