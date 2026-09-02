import { Router, Response } from 'express';
import { db, Property, PropertyImage } from '../db/database';
import { authenticate, optionalAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/properties
router.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      q,
      city,
      neighborhood,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      isFurnished,
      amenities,
      status,
      landlordId,
      featured,
      sort = 'newest',
      page = '1',
      limit = '12'
    } = req.query;

    let properties = db.getProperties();

    // Filter by status (public view only shows 'active' or 'rented' unless specifically requested by admin/landlord)
    if (status) {
      properties = properties.filter(p => p.status === status);
    } else if (!landlordId) {
      // By default show active and rented for public browse
      properties = properties.filter(p => p.status === 'active' || p.status === 'rented');
    }

    if (landlordId) {
      properties = properties.filter(p => p.landlordId === landlordId);
    }

    if (featured === 'true') {
      properties = properties.filter(p => p.isFeatured);
    }

    if (propertyType && propertyType !== 'all') {
      properties = properties.filter(p => p.propertyType.toLowerCase() === (propertyType as string).toLowerCase());
    }

    if (city) {
      properties = properties.filter(p => p.city.toLowerCase().includes((city as string).toLowerCase()));
    }

    if (neighborhood && neighborhood !== 'all') {
      properties = properties.filter(p => p.neighborhood.toLowerCase() === (neighborhood as string).toLowerCase());
    }

    if (minPrice) {
      const min = Number(minPrice);
      if (!isNaN(min)) properties = properties.filter(p => p.price >= min);
    }

    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max)) properties = properties.filter(p => p.price <= max);
    }

    if (bedrooms && bedrooms !== 'any') {
      const beds = Number(bedrooms);
      if (!isNaN(beds)) {
        if (beds >= 4) {
          properties = properties.filter(p => p.bedrooms >= 4);
        } else {
          properties = properties.filter(p => p.bedrooms === beds);
        }
      }
    }

    if (bathrooms && bathrooms !== 'any') {
      const baths = Number(bathrooms);
      if (!isNaN(baths)) {
        if (baths >= 3) {
          properties = properties.filter(p => p.bathrooms >= 3);
        } else {
          properties = properties.filter(p => p.bathrooms === baths);
        }
      }
    }

    if (isFurnished !== undefined && isFurnished !== '') {
      const furnishedVal = isFurnished === 'true';
      properties = properties.filter(p => p.isFurnished === furnishedVal);
    }

    if (amenities) {
      const amenityList = (amenities as string).split(',').map(a => a.trim().toLowerCase());
      properties = properties.filter(p => {
        const propAmenitiesLower = (p.amenities || []).map(a => a.toLowerCase());
        return amenityList.every(reqAmenity => propAmenitiesLower.some(pa => pa.includes(reqAmenity)));
      });
    }

    // Keyword search
    if (q) {
      const term = (q as string).toLowerCase();
      properties = properties.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.neighborhood.toLowerCase().includes(term) ||
        p.city.toLowerCase().includes(term) ||
        p.propertyType.toLowerCase().includes(term) ||
        (p.address && p.address.toLowerCase().includes(term))
      );
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        properties.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        properties.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        properties.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
        break;
      case 'newest':
      default:
        properties.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    const totalCount = properties.length;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 12);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = properties.slice(startIndex, startIndex + limitNum);

    const currentUserId = req.user?.id;
    const userFavorites = currentUserId ? db.getFavorites(currentUserId).map(f => f.propertyId) : [];

    // Attach landlord info and isFavorite flag
    const results = paginatedItems.map(p => {
      const landlord = db.getUserById(p.landlordId);
      const inquiriesCount = db.getInquiries({ propertyId: p.id }).length;
      return {
        ...p,
        isFavorite: userFavorites.includes(p.id),
        inquiriesCount,
        landlord: landlord ? {
          id: landlord.id,
          name: landlord.name,
          avatar: landlord.avatar,
          phone: landlord.phone,
          isVerified: landlord.isVerified
        } : null
      };
    });

    return res.json({
      properties: results,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('Fetch properties error:', error);
    return res.status(500).json({ error: 'Failed to retrieve property listings.' });
  }
});

// GET /api/properties/locations
router.get('/locations', (_req, res) => {
  const properties = db.getProperties();
  const locationMap: Record<string, { count: number; avgPrice: number; sampleImage: string }> = {};

  properties.forEach(p => {
    if (!locationMap[p.neighborhood]) {
      locationMap[p.neighborhood] = {
        count: 0,
        avgPrice: 0,
        sampleImage: p.images[0]?.imageUrl || ''
      };
    }
    locationMap[p.neighborhood].count += 1;
    locationMap[p.neighborhood].avgPrice += p.price;
  });

  const locations = Object.entries(locationMap).map(([name, data]) => ({
    name,
    count: data.count,
    avgPrice: Math.round(data.avgPrice / data.count),
    image: data.sampleImage
  })).sort((a, b) => b.count - a.count);

  return res.json({ locations });
});

// GET /api/properties/my-listings
router.get('/my-listings', authenticate, requireRole(['landlord', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const properties = db.getProperties().filter(p => p.landlordId === req.user!.id);
  const enriched = properties.map(p => {
    const inquiries = db.getInquiries({ propertyId: p.id });
    return {
      ...p,
      inquiriesCount: inquiries.length,
      pendingInquiriesCount: inquiries.filter(i => i.status === 'pending').length
    };
  });

  return res.json({ properties: enriched });
});

// GET /api/properties/:id
router.get('/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const property = db.getPropertyById(id);

    if (!property) {
      return res.status(404).json({ error: 'Property listing not found.' });
    }

    // Increment views
    db.incrementPropertyViews(id);

    const landlord = db.getUserById(property.landlordId);
    const currentUserId = req.user?.id;
    const isFavorite = currentUserId ? db.isFavorite(currentUserId, property.id) : false;
    const inquiries = db.getInquiries({ propertyId: property.id });

    // Find similar properties in same neighborhood or type
    const similar = db.getProperties()
      .filter(p => p.id !== id && (p.neighborhood === property.neighborhood || p.propertyType === property.propertyType))
      .slice(0, 3)
      .map(p => ({
        ...p,
        isFavorite: currentUserId ? db.isFavorite(currentUserId, p.id) : false
      }));

    const reviews = db.getReviews(property.id).map(r => {
      const reviewer = db.getUserById(r.renterId);
      return {
        ...r,
        renter: reviewer ? { id: reviewer.id, name: reviewer.name, avatar: reviewer.avatar } : null
      };
    });

    const averageRating = reviews.length > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
      : 5.0;

    return res.json({
      property: {
        ...property,
        isFavorite,
        inquiriesCount: inquiries.length,
        averageRating,
        reviewsCount: reviews.length,
        reviews,
        landlord: landlord ? {
          id: landlord.id,
          name: landlord.name,
          avatar: landlord.avatar,
          phone: landlord.phone,
          bio: landlord.bio,
          isVerified: landlord.isVerified,
          memberSince: landlord.createdAt
        } : null
      },
      similarProperties: similar
    });
  } catch (error) {
    console.error('Get property by id error:', error);
    return res.status(500).json({ error: 'Failed to retrieve property details.' });
  }
});

// POST /api/properties
router.post('/', authenticate, requireRole(['landlord', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      title,
      description,
      propertyType,
      price,
      currency = 'ETB',
      city = 'Addis Ababa',
      neighborhood,
      address,
      bedrooms,
      bathrooms,
      sizeSqFt,
      isFurnished,
      availableFrom,
      contactPreference = 'Platform Chat',
      amenities = [],
      images = []
    } = req.body;

    if (!title || !description || !propertyType || !price || !neighborhood) {
      return res.status(400).json({ error: 'Title, description, property type, price, and neighborhood are required.' });
    }

    const propId = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Prepare images
    let formattedImages: PropertyImage[] = [];
    if (Array.isArray(images) && images.length > 0) {
      formattedImages = images.map((img: any, idx: number) => ({
        id: `img_${Date.now()}_${idx}`,
        propertyId: propId,
        imageUrl: typeof img === 'string' ? img : img.imageUrl,
        isPrimary: idx === 0 || img.isPrimary === true,
        caption: typeof img === 'object' ? img.caption : '',
        sortOrder: idx + 1
      }));
    } else {
      // Fallback default high quality interior image
      formattedImages = [
        {
          id: `img_${Date.now()}_0`,
          propertyId: propId,
          imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
          isPrimary: true,
          caption: 'Main Living Space',
          sortOrder: 1
        }
      ];
    }

    const newProperty: Property = {
      id: propId,
      landlordId: req.user.id,
      title: title.trim(),
      description: description.trim(),
      propertyType,
      price: Number(price),
      currency: currency || 'ETB',
      city: city ? city.trim() : 'Addis Ababa',
      neighborhood: neighborhood.trim(),
      address: address ? address.trim() : `${neighborhood}, ${city || 'Addis Ababa'}`,
      bedrooms: Number(bedrooms) || 1,
      bathrooms: Number(bathrooms) || 1,
      sizeSqFt: sizeSqFt ? Number(sizeSqFt) : undefined,
      isFurnished: Boolean(isFurnished),
      availableFrom: availableFrom || new Date().toISOString().split('T')[0],
      contactPreference: contactPreference || 'Platform Chat',
      status: 'active',
      viewsCount: 0,
      isFeatured: false,
      amenities: Array.isArray(amenities) ? amenities : [],
      images: formattedImages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.createProperty(newProperty);

    return res.status(201).json({
      message: 'Property listing created successfully!',
      property: newProperty
    });
  } catch (error) {
    console.error('Create property error:', error);
    return res.status(500).json({ error: 'Failed to create property listing.' });
  }
});

// PUT /api/properties/:id
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const property = db.getPropertyById(id);

    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    // Check ownership or admin
    if (property.landlordId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to edit this property.' });
    }

    const {
      title,
      description,
      propertyType,
      price,
      currency,
      city,
      neighborhood,
      address,
      bedrooms,
      bathrooms,
      sizeSqFt,
      isFurnished,
      availableFrom,
      contactPreference,
      status,
      amenities,
      images,
      isFeatured
    } = req.body;

    const updates: Partial<Property> = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (propertyType !== undefined) updates.propertyType = propertyType;
    if (price !== undefined) updates.price = Number(price);
    if (currency !== undefined) updates.currency = currency;
    if (city !== undefined) updates.city = city.trim();
    if (neighborhood !== undefined) updates.neighborhood = neighborhood.trim();
    if (address !== undefined) updates.address = address.trim();
    if (bedrooms !== undefined) updates.bedrooms = Number(bedrooms);
    if (bathrooms !== undefined) updates.bathrooms = Number(bathrooms);
    if (sizeSqFt !== undefined) updates.sizeSqFt = Number(sizeSqFt);
    if (isFurnished !== undefined) updates.isFurnished = Boolean(isFurnished);
    if (availableFrom !== undefined) updates.availableFrom = availableFrom;
    if (contactPreference !== undefined) updates.contactPreference = contactPreference;
    if (status !== undefined) updates.status = status;
    if (amenities !== undefined) updates.amenities = amenities;
    if (req.user.role === 'admin' && isFeatured !== undefined) updates.isFeatured = isFeatured;

    if (images && Array.isArray(images)) {
      updates.images = images.map((img: any, idx: number) => ({
        id: img.id || `img_${Date.now()}_${idx}`,
        propertyId: id,
        imageUrl: typeof img === 'string' ? img : img.imageUrl,
        isPrimary: idx === 0 || img.isPrimary === true,
        caption: typeof img === 'object' ? img.caption : '',
        sortOrder: idx + 1
      }));
    }

    const updated = db.updateProperty(id, updates);
    return res.json({ message: 'Property updated successfully', property: updated });
  } catch (error) {
    console.error('Update property error:', error);
    return res.status(500).json({ error: 'Failed to update property.' });
  }
});

// PATCH /api/properties/:id/status
router.patch('/:id/status', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'rented', 'pending_approval', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (active, rented, pending_approval, archived)' });
    }

    const property = db.getPropertyById(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.landlordId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const updated = db.updateProperty(id, { status });
    return res.json({ message: `Property status updated to ${status}`, property: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update property status' });
  }
});

// DELETE /api/properties/:id
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const property = db.getPropertyById(id);

    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    if (property.landlordId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this listing.' });
    }

    db.deleteProperty(id);
    return res.json({ message: 'Property deleted successfully.' });
  } catch (error) {
    console.error('Delete property error:', error);
    return res.status(500).json({ error: 'Failed to delete property listing.' });
  }
});

// GET /api/properties/:id/reviews
router.get('/:id/reviews', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const property = db.getPropertyById(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    const reviews = db.getReviews(id).map(r => {
      const reviewer = db.getUserById(r.renterId);
      return {
        ...r,
        renter: reviewer ? {
          id: reviewer.id,
          name: reviewer.name,
          avatar: reviewer.avatar
        } : null
      };
    });

    const averageRating = reviews.length > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
      : 5.0;

    return res.json({ reviews, averageRating, totalCount: reviews.length });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve reviews.' });
  }
});

// POST /api/properties/:id/reviews
router.post('/:id/reviews', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { rating, comment } = req.body;

    const property = db.getPropertyById(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    if (property.landlordId === req.user.id) {
      return res.status(400).json({ error: 'Landlords cannot review their own properties.' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Review comment cannot be empty.' });
    }

    const newReview = db.createReview({
      propertyId: id,
      landlordId: property.landlordId,
      renterId: req.user.id,
      rating: Math.round(numRating),
      comment: comment.trim()
    });

    // Notify landlord
    db.createNotification(
      property.landlordId,
      'New Property Review',
      `${req.user.name} left a ${numRating}-star review for "${property.title}".`,
      'new_review',
      `/properties/${id}`
    );

    return res.status(201).json({
      message: 'Review posted successfully.',
      review: {
        ...newReview,
        renter: {
          id: req.user.id,
          name: req.user.name,
          avatar: req.user.avatar
        }
      }
    });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
});

export default router;
