import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/reports - report a suspicious or inappropriate property listing
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { propertyId, reason, details } = req.body;

    if (!propertyId || !reason) {
      return res.status(400).json({ error: 'Property ID and reason are required.' });
    }

    const property = db.getPropertyById(propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    const report = db.createReport(propertyId, req.user.id, reason, details);

    return res.status(201).json({
      message: 'Report submitted successfully. Our trust & safety team will review it.',
      report
    });
  } catch (error) {
    console.error('Submit report error:', error);
    return res.status(500).json({ error: 'Failed to submit report.' });
  }
});

// GET /api/admin/reports - admin only
router.get('/admin', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = db.getReports();
    const enriched = reports.map(r => {
      const property = db.getPropertyById(r.propertyId);
      const reporter = db.getUserById(r.reporterId);
      return {
        ...r,
        property: property ? {
          id: property.id,
          title: property.title,
          price: property.price,
          status: property.status,
          landlordId: property.landlordId
        } : null,
        reporter: reporter ? {
          id: reporter.id,
          name: reporter.name,
          email: reporter.email
        } : null
      };
    });

    return res.json({ reports: enriched });
  } catch (error) {
    console.error('Get admin reports error:', error);
    return res.status(500).json({ error: 'Failed to retrieve reports.' });
  }
});

// PUT /api/admin/reports/:id - admin only
router.put('/admin/:id', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const report = db.getReports().find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const updated = db.updateReport(id, {
      status,
      adminNotes
    });

    return res.json({ message: 'Report status updated', report: updated });
  } catch (error) {
    console.error('Update report error:', error);
    return res.status(500).json({ error: 'Failed to update report.' });
  }
});

export default router;
