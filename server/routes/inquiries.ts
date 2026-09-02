import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/inquiries
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let inquiries = [];
    if (req.user.role === 'admin') {
      inquiries = db.getInquiries();
    } else if (req.user.role === 'landlord') {
      inquiries = db.getInquiries({ landlordId: req.user.id });
    } else {
      inquiries = db.getInquiries({ renterId: req.user.id });
    }

    const enriched = inquiries.map(inq => {
      const property = db.getPropertyById(inq.propertyId);
      const renter = db.getUserById(inq.renterId);
      const landlord = db.getUserById(inq.landlordId);

      return {
        ...inq,
        property: property ? {
          id: property.id,
          title: property.title,
          price: property.price,
          currency: property.currency,
          neighborhood: property.neighborhood,
          image: property.images[0]?.imageUrl || ''
        } : null,
        renter: renter ? {
          id: renter.id,
          name: renter.name,
          email: renter.email,
          phone: renter.phone,
          avatar: renter.avatar
        } : null,
        landlord: landlord ? {
          id: landlord.id,
          name: landlord.name,
          email: landlord.email,
          phone: landlord.phone,
          avatar: landlord.avatar
        } : null
      };
    });

    return res.json({ inquiries: enriched });
  } catch (error) {
    console.error('Get inquiries error:', error);
    return res.status(500).json({ error: 'Failed to retrieve inquiries.' });
  }
});

// POST /api/inquiries
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { propertyId, message, preferredViewingDate, preferredContactTime } = req.body;

    if (!propertyId || !message || !message.trim()) {
      return res.status(400).json({ error: 'Property ID and message are required.' });
    }

    const property = db.getPropertyById(propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    if (property.landlordId === req.user.id) {
      return res.status(400).json({ error: 'You cannot submit an inquiry for your own property.' });
    }

    const newInquiry = db.createInquiry({
      propertyId,
      renterId: req.user.id,
      landlordId: property.landlordId,
      message: message.trim(),
      preferredViewingDate,
      preferredContactTime
    });

    // Notify landlord
    db.createNotification(
      property.landlordId,
      'New Property Inquiry',
      `${req.user.name} sent an inquiry for "${property.title}".`,
      'inquiry_new',
      '/dashboard/landlord'
    );

    // Also auto-start or add a message to conversation thread
    const conv = db.findOrCreateConversation(property.landlordId, req.user.id, property.id);
    const inqSummary = `[Inquiry submitted]: ${message.trim()}${preferredViewingDate ? ` (Preferred viewing: ${preferredViewingDate} - ${preferredContactTime || 'Anytime'})` : ''}`;
    db.createMessage(conv.id, req.user.id, property.landlordId, inqSummary);

    return res.status(201).json({
      message: 'Inquiry submitted successfully to the landlord.',
      inquiry: newInquiry
    });
  } catch (error) {
    console.error('Create inquiry error:', error);
    return res.status(500).json({ error: 'Failed to submit inquiry.' });
  }
});

// PUT /api/inquiries/:id
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { status, landlordNotes } = req.body;

    const inquiry = db.getInquiryById(id);
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }

    if (inquiry.landlordId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the landlord can update inquiry status.' });
    }

    const validStatuses = ['pending', 'contacted', 'viewing_scheduled', 'approved', 'rejected', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (landlordNotes !== undefined) updates.landlordNotes = landlordNotes;

    const updated = db.updateInquiry(id, updates);

    // Notify renter of status update
    if (status && inquiry.status !== status) {
      const prop = db.getPropertyById(inquiry.propertyId);
      const statusLabels: Record<string, string> = {
        contacted: 'Contacted',
        viewing_scheduled: 'Viewing Scheduled',
        approved: 'Application Approved',
        rejected: 'Application Rejected',
        closed: 'Closed',
        pending: 'Pending'
      };

      db.createNotification(
        inquiry.renterId,
        `Inquiry Updated: ${statusLabels[status] || status}`,
        `The landlord updated your inquiry for "${prop?.title || 'the property'}" to "${statusLabels[status] || status}".`,
        'inquiry_update',
        '/dashboard/renter'
      );
    }

    return res.json({ message: 'Inquiry updated successfully', inquiry: updated });
  } catch (error) {
    console.error('Update inquiry error:', error);
    return res.status(500).json({ error: 'Failed to update inquiry.' });
  }
});

export default router;
