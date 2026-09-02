import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/favorites
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const favorites = db.getFavorites(req.user.id);
    const properties = favorites.map(fav => {
      const prop = db.getPropertyById(fav.propertyId);
      if (!prop) return null;
      const landlord = db.getUserById(prop.landlordId);
      return {
        ...prop,
        isFavorite: true,
        favoritedAt: fav.createdAt,
        landlord: landlord ? {
          id: landlord.id,
          name: landlord.name,
          avatar: landlord.avatar,
          phone: landlord.phone,
          isVerified: landlord.isVerified
        } : null
      };
    }).filter(Boolean);

    return res.json({ favorites: properties });
  } catch (error) {
    console.error('Get favorites error:', error);
    return res.status(500).json({ error: 'Failed to retrieve favorites.' });
  }
});

// POST /api/favorites/:propertyId
router.post('/:propertyId', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { propertyId } = req.params;
    const property = db.getPropertyById(propertyId);

    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    const isFav = db.isFavorite(req.user.id, propertyId);
    if (isFav) {
      db.removeFavorite(req.user.id, propertyId);
      return res.json({ isFavorite: false, message: 'Removed from favorites' });
    } else {
      db.addFavorite(req.user.id, propertyId);
      return res.json({ isFavorite: true, message: 'Added to favorites' });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return res.status(500).json({ error: 'Failed to update favorite status.' });
  }
});

// DELETE /api/favorites/:propertyId
router.delete('/:propertyId', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { propertyId } = req.params;
    const removed = db.removeFavorite(req.user.id, propertyId);

    return res.json({ isFavorite: false, message: removed ? 'Removed from favorites' : 'Property was not in favorites' });
  } catch (error) {
    console.error('Delete favorite error:', error);
    return res.status(500).json({ error: 'Failed to remove favorite.' });
  }
});

export default router;
