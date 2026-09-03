import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/stats/landlord
router.get('/landlord', authenticate, requireRole(['landlord', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const landlordId = req.user.id;
    const properties = db.getProperties().filter(p => p.landlordId === landlordId);
    const inquiries = db.getInquiries({ landlordId });
    const conversations = db.getConversations(landlordId);
    
    let unreadMessagesCount = 0;
    conversations.forEach(c => {
      const msgs = db.getMessages(c.id);
      unreadMessagesCount += msgs.filter(m => m.receiverId === landlordId && !m.isRead).length;
    });

    const totalViews = properties.reduce((sum, p) => sum + (p.viewsCount || 0), 0);

    const stats = {
      totalProperties: properties.length,
      activeProperties: properties.filter(p => p.status === 'active').length,
      rentedProperties: properties.filter(p => p.status === 'rented').length,
      totalInquiries: inquiries.length,
      pendingInquiries: inquiries.filter(i => i.status === 'pending').length,
      unreadMessages: unreadMessagesCount,
      totalViews,
      recentInquiries: inquiries.slice(0, 5).map(inq => {
        const prop = db.getPropertyById(inq.propertyId);
        const renter = db.getUserById(inq.renterId);
        return {
          ...inq,
          propertyTitle: prop?.title || 'Unknown Property',
          renterName: renter?.name || 'Unknown Renter'
        };
      })
    };

    return res.json({ stats });
  } catch (error) {
    console.error('Landlord stats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve landlord statistics' });
  }
});

// GET /api/stats/renter
router.get('/renter', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const renterId = req.user.id;
    const favorites = db.getFavorites(renterId);
    const inquiries = db.getInquiries({ renterId });
    const conversations = db.getConversations(renterId);

    let unreadMessagesCount = 0;
    conversations.forEach(c => {
      const msgs = db.getMessages(c.id);
      unreadMessagesCount += msgs.filter(m => m.receiverId === renterId && !m.isRead).length;
    });

    const scheduledViewings = inquiries.filter(i => i.status === 'viewing_scheduled').length;
    const approvedInquiries = inquiries.filter(i => i.status === 'approved').length;

    const stats = {
      favoritesCount: favorites.length,
      totalInquiries: inquiries.length,
      pendingInquiries: inquiries.filter(i => i.status === 'pending').length,
      scheduledViewings,
      approvedInquiries,
      unreadMessages: unreadMessagesCount,
      conversationsCount: conversations.length
    };

    return res.json({ stats });
  } catch (error) {
    console.error('Renter stats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve renter statistics' });
  }
});

export default router;
