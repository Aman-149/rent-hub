import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/stats
router.get('/stats', authenticate, requireRole(['admin']), (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = db.getUsers();
    const properties = db.getProperties();
    const inquiries = db.getInquiries();
    const reports = db.getReports();

    const stats = {
      totalUsers: users.length,
      totalLandlords: users.filter(u => u.role === 'landlord').length,
      totalRenters: users.filter(u => u.role === 'renter').length,
      totalProperties: properties.length,
      activeProperties: properties.filter(p => p.status === 'active').length,
      rentedProperties: properties.filter(p => p.status === 'rented').length,
      pendingProperties: properties.filter(p => p.status === 'pending_approval').length,
      totalInquiries: inquiries.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      totalReports: reports.length
    };

    return res.json({ stats });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve admin stats.' });
  }
});

// GET /api/admin/users
router.get('/users', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, status, q } = req.query;
    let users = db.getUsers();

    if (role && role !== 'all') {
      users = users.filter(u => u.role === role);
    }

    if (status && status !== 'all') {
      users = users.filter(u => u.status === status);
    }

    if (q) {
      const term = (q as string).toLowerCase();
      users = users.filter(u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.phone.includes(term));
    }

    const safeUsers = users.map(u => {
      const { passwordHash: _, ...safe } = u;
      const propertiesCount = u.role === 'landlord' ? db.getProperties().filter(p => p.landlordId === u.id).length : 0;
      const inquiriesCount = db.getInquiries(u.role === 'landlord' ? { landlordId: u.id } : { renterId: u.id }).length;
      return {
        ...safe,
        propertiesCount,
        inquiriesCount
      };
    });

    return res.json({ users: safeUsers });
  } catch (error) {
    console.error('Admin get users error:', error);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Valid status required (active, suspended)' });
    }

    const user = db.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot suspend admin accounts' });
    }

    const updated = db.updateUser(id, { status });
    const { passwordHash: _, ...safe } = updated!;
    return res.json({ message: `User status updated to ${status}`, user: safe });
  } catch (error) {
    console.error('Admin update user status error:', error);
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// GET /api/admin/properties
router.get('/properties', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, q } = req.query;
    let properties = db.getProperties();

    if (status && status !== 'all') {
      properties = properties.filter(p => p.status === status);
    }

    if (q) {
      const term = (q as string).toLowerCase();
      properties = properties.filter(p => p.title.toLowerCase().includes(term) || p.neighborhood.toLowerCase().includes(term));
    }

    const enriched = properties.map(p => {
      const landlord = db.getUserById(p.landlordId);
      const reportsCount = db.getReports().filter(r => r.propertyId === p.id).length;
      return {
        ...p,
        landlord: landlord ? { id: landlord.id, name: landlord.name, email: landlord.email } : null,
        reportsCount
      };
    });

    return res.json({ properties: enriched });
  } catch (error) {
    console.error('Admin get properties error:', error);
    return res.status(500).json({ error: 'Failed to retrieve properties.' });
  }
});

// PUT /api/admin/properties/:id/status
router.put('/properties/:id/status', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, isFeatured } = req.body;

    const updates: any = {};
    if (status) updates.status = status;
    if (isFeatured !== undefined) updates.isFeatured = isFeatured;

    const updated = db.updateProperty(id, updates);
    if (!updated) return res.status(404).json({ error: 'Property not found' });

    return res.json({ message: 'Property updated successfully', property: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update property status' });
  }
});

// DELETE /api/admin/properties/:id
router.delete('/properties/:id', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteProperty(id);
    if (!deleted) return res.status(404).json({ error: 'Property not found' });

    return res.json({ message: 'Property removed by administrator.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete property.' });
  }
});

// GET /api/admin/database/status
router.get('/database/status', authenticate, requireRole(['admin']), (_req: AuthenticatedRequest, res: Response) => {
  try {
    const status = db.getDatabaseStatus();
    return res.json({ status });
  } catch (error) {
    console.error('Admin database status error:', error);
    return res.status(500).json({ error: 'Failed to retrieve database status.' });
  }
});

// GET /api/admin/database/export
router.get('/database/export', authenticate, requireRole(['admin']), (_req: AuthenticatedRequest, res: Response) => {
  try {
    const backup = db.exportBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="renthub_backup_${new Date().toISOString().split('T')[0]}.json"`);
    return res.send(JSON.stringify(backup, null, 2));
  } catch (error) {
    console.error('Admin export database error:', error);
    return res.status(500).json({ error: 'Failed to export database backup.' });
  }
});

// POST /api/admin/database/import
router.post('/database/import', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'No backup data provided in request body.' });
    }

    db.importBackup(data);
    const updatedStatus = db.getDatabaseStatus();
    return res.json({ message: 'Database imported successfully.', status: updatedStatus });
  } catch (error: any) {
    console.error('Admin import database error:', error);
    return res.status(400).json({ error: error.message || 'Failed to import backup data.' });
  }
});

// POST /api/admin/database/clear
// Wipes every table back to empty. Does NOT insert any demo/mock data —
// users only come from self-registration (renter/landlord) or admin creation
// (ADMIN_EMAIL/ADMIN_PASSWORD bootstrap or `npm run create-admin`). Since this
// clears the users table, the currently authenticated admin's account would
// be wiped too, so it is re-created (same email/password/role) after the clear.
router.post('/database/clear', authenticate, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestingAdmin = req.user!;
    db.clearAllData();
    db.createUser(requestingAdmin);
    const status = db.getDatabaseStatus();
    return res.json({ message: 'Database cleared.', status });
  } catch (error) {
    console.error('Admin clear database error:', error);
    return res.status(500).json({ error: 'Failed to clear database.' });
  }
});

// GET /api/admin/database/schema
router.get('/database/schema', authenticate, requireRole(['admin']), (_req: AuthenticatedRequest, res: Response) => {
  try {
    const schemaSQL = db.getSchemaSQL();
    return res.json({ schema: schemaSQL });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve SQL schema.' });
  }
});

export default router;
