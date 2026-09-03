import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/conversations
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const conversations = db.getConversations(req.user.id);

    const enriched = conversations.map(c => {
      const isLandlord = c.landlordId === req.user!.id;
      const otherUserId = isLandlord ? c.renterId : c.landlordId;
      const otherUser = db.getUserById(otherUserId);
      const property = c.propertyId ? db.getPropertyById(c.propertyId) : null;
      const messages = db.getMessages(c.id);
      const lastMessage = messages[messages.length - 1] || null;
      const unreadCount = messages.filter(m => m.receiverId === req.user!.id && !m.isRead).length;

      return {
        id: c.id,
        propertyId: c.propertyId,
        property: property ? {
          id: property.id,
          title: property.title,
          price: property.price,
          currency: property.currency,
          neighborhood: property.neighborhood,
          image: property.images[0]?.imageUrl || ''
        } : null,
        otherUser: otherUser ? {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar,
          role: otherUser.role,
          phone: otherUser.phone,
          isVerified: otherUser.isVerified
        } : null,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
          isRead: lastMessage.isRead
        } : null,
        unreadCount,
        lastMessageAt: c.lastMessageAt,
        updatedAt: c.updatedAt
      };
    }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return res.json({ conversations: enriched });
  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({ error: 'Failed to retrieve conversations.' });
  }
});

// POST /api/conversations/start
router.post('/start', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { landlordId, propertyId, initialMessage } = req.body;

    if (!landlordId) {
      return res.status(400).json({ error: 'Landlord ID is required.' });
    }

    if (landlordId === req.user.id) {
      return res.status(400).json({ error: 'You cannot start a conversation with yourself.' });
    }

    const landlord = db.getUserById(landlordId);
    if (!landlord) {
      return res.status(404).json({ error: 'Landlord not found.' });
    }

    const conv = db.findOrCreateConversation(landlordId, req.user.id, propertyId);

    if (initialMessage && initialMessage.trim()) {
      db.createMessage(conv.id, req.user.id, landlordId, initialMessage.trim());
      // Create notification for landlord
      const propTitle = propertyId ? db.getPropertyById(propertyId)?.title : 'a listing';
      db.createNotification(
        landlordId,
        'New Message Received',
        `${req.user.name} sent you a message regarding ${propTitle || 'a listing'}.`,
        'new_message',
        `/messages?conv=${conv.id}`
      );
    }

    return res.json({ conversation: conv });
  } catch (error) {
    console.error('Start conversation error:', error);
    return res.status(500).json({ error: 'Failed to initiate conversation.' });
  }
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const conversation = db.getConversationById(id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (conversation.landlordId !== req.user.id && conversation.renterId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this conversation.' });
    }

    // Auto mark received messages as read
    db.markMessagesAsRead(id, req.user.id);

    const messages = db.getMessages(id);
    const otherUserId = conversation.landlordId === req.user.id ? conversation.renterId : conversation.landlordId;
    const otherUser = db.getUserById(otherUserId);
    const property = conversation.propertyId ? db.getPropertyById(conversation.propertyId) : null;

    return res.json({
      conversation: {
        id: conversation.id,
        propertyId: conversation.propertyId,
        property: property ? {
          id: property.id,
          title: property.title,
          price: property.price,
          currency: property.currency,
          neighborhood: property.neighborhood,
          image: property.images[0]?.imageUrl || ''
        } : null,
        otherUser: otherUser ? {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar,
          phone: otherUser.phone,
          role: otherUser.role,
          isVerified: otherUser.isVerified
        } : null
      },
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

// POST /api/conversations/:id/messages
router.post('/:id/messages', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    const conversation = db.getConversationById(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (conversation.landlordId !== req.user.id && conversation.renterId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const receiverId = conversation.landlordId === req.user.id ? conversation.renterId : conversation.landlordId;

    const message = db.createMessage(id, req.user.id, receiverId, content.trim());

    // Create notification for receiver
    const propTitle = conversation.propertyId ? db.getPropertyById(conversation.propertyId)?.title : 'your listing';
    db.createNotification(
      receiverId,
      'New Message',
      `${req.user.name}: "${content.length > 50 ? content.substring(0, 50) + '...' : content}"`,
      'new_message',
      `/messages?conv=${id}`
    );

    return res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
});

export default router;
