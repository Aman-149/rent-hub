import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'renter' | 'landlord' | 'admin';
  phone: string;
  avatar: string;
  bio?: string;
  isVerified: boolean;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface PropertyImage {
  id: string;
  propertyId: string;
  imageUrl: string;
  isPrimary: boolean;
  caption?: string;
  sortOrder: number;
}

export interface Property {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  propertyType: 'Apartment' | 'House' | 'Villa' | 'Studio' | 'Condominium' | 'Room';
  price: number;
  currency: string;
  city: string;
  neighborhood: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqFt?: number;
  isFurnished: boolean;
  availableFrom: string;
  contactPreference: string;
  status: 'active' | 'rented' | 'pending_approval' | 'archived';
  viewsCount: number;
  isFeatured: boolean;
  amenities: string[];
  images: PropertyImage[];
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  propertyId?: string;
  landlordId: string;
  renterId: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  renterId: string;
  landlordId: string;
  message: string;
  preferredViewingDate?: string;
  preferredContactTime?: string;
  status: 'pending' | 'contacted' | 'viewing_scheduled' | 'approved' | 'rejected' | 'closed';
  landlordNotes?: string;
  leaseDurationMonths?: number;
  occupantsCount?: number;
  employmentStatus?: string;
  monthlyIncome?: number;
  hasPets?: boolean;
  petDetails?: string;
  inquiryType?: 'general' | 'viewing' | 'application';
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  propertyId: string;
  landlordId: string;
  renterId: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface Report {
  id: string;
  propertyId: string;
  reporterId: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DatabaseData {
  users: User[];
  properties: Property[];
  favorites: Favorite[];
  conversations: Conversation[];
  messages: Message[];
  inquiries: Inquiry[];
  reports: Report[];
  notifications: Notification[];
  reviews: Review[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'server', 'data', 'db.json');

// Returns a completely empty database. No demo users, properties, or any
// other records are pre-seeded — admins are created via scripts/create-admin.ts
// (or the ADMIN_EMAIL/ADMIN_PASSWORD env bootstrap) and renters/landlords
// register themselves through POST /api/auth/register.
function getEmptyDatabase(): DatabaseData {
  return {
    users: [],
    properties: [],
    favorites: [],
    conversations: [],
    messages: [],
    inquiries: [],
    reports: [],
    notifications: [],
    reviews: []
  };
}

class Database {
  private data: DatabaseData;
  private pool: Pool | null = null;
  private isPostgresConnected: boolean = false;
  private postgresError: string | null = null;

  constructor() {
    this.data = this.loadDatabase();
    this.initPostgres();
  }

  private async initPostgres() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.log('[RentHub Database] Running on Embedded Persistent Storage (server/data/db.json).');
      await this.bootstrapAdminFromEnv();
      return;
    }

    try {
      this.pool = new Pool({
        connectionString: dbUrl,
        ssl: process.env.NODE_ENV === 'production' && !dbUrl.includes('localhost')
          ? { rejectUnauthorized: false }
          : undefined,
        max: 10,
        idleTimeoutMillis: 30000
      });

      // Test query
      await this.pool.query('SELECT 1');
      this.isPostgresConnected = true;
      this.postgresError = null;
      console.log('[RentHub Database] Connected to PostgreSQL instance successfully!');

      // Read schema.sql and create tables if not present
      const schemaPath = path.join(process.cwd(), 'server', 'db', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        await this.pool.query(schemaSql);
        console.log('[RentHub Database] PostgreSQL tables and indexes verified.');
      }

      await this.bootstrapAdminFromEnv();
    } catch (err: any) {
      console.warn('[RentHub Database] PostgreSQL connection note (falling back to embedded file database):', err.message);
      this.postgresError = err.message;
      this.isPostgresConnected = false;
    }
  }

  private loadDatabase(): DatabaseData {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.reviews) parsed.reviews = [];
        return parsed;
      }
    } catch (e) {
      console.error('Error loading database from file, re-initializing with an empty database:', e);
    }

    const initial = getEmptyDatabase();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseData) {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = `${DB_FILE_PATH}.${Date.now()}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_FILE_PATH);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public persist() {
    this.saveData(this.data);
  }

  // Users
  public getUsers() {
    return this.data.users;
  }

  public getUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User) {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      return this.data.users[idx];
    }
    return null;
  }

  // Properties
  public getProperties() {
    return this.data.properties;
  }

  public getPropertyById(id: string) {
    return this.data.properties.find(p => p.id === id);
  }

  public createProperty(property: Property) {
    this.data.properties.unshift(property);
    this.persist();
    return property;
  }

  public updateProperty(id: string, updates: Partial<Property>) {
    const idx = this.data.properties.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.properties[idx] = { ...this.data.properties[idx], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      return this.data.properties[idx];
    }
    return null;
  }

  public deleteProperty(id: string) {
    const idx = this.data.properties.findIndex(p => p.id === id);
    if (idx !== -1) {
      const removed = this.data.properties.splice(idx, 1)[0];
      // Clean up favorites and inquiries associated
      this.data.favorites = this.data.favorites.filter(f => f.propertyId !== id);
      this.persist();
      return removed;
    }
    return null;
  }

  public incrementPropertyViews(id: string) {
    const prop = this.getPropertyById(id);
    if (prop) {
      prop.viewsCount = (prop.viewsCount || 0) + 1;
      this.persist();
    }
  }

  // Favorites
  public getFavorites(userId: string) {
    return this.data.favorites.filter(f => f.userId === userId);
  }

  public isFavorite(userId: string, propertyId: string) {
    return this.data.favorites.some(f => f.userId === userId && f.propertyId === propertyId);
  }

  public addFavorite(userId: string, propertyId: string) {
    if (!this.isFavorite(userId, propertyId)) {
      const fav: Favorite = {
        id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        propertyId,
        createdAt: new Date().toISOString()
      };
      this.data.favorites.push(fav);
      this.persist();
      return fav;
    }
    return null;
  }

  public removeFavorite(userId: string, propertyId: string) {
    const initialLen = this.data.favorites.length;
    this.data.favorites = this.data.favorites.filter(f => !(f.userId === userId && f.propertyId === propertyId));
    if (this.data.favorites.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Conversations & Messages
  public getConversations(userId: string) {
    return this.data.conversations.filter(c => c.landlordId === userId || c.renterId === userId);
  }

  public getConversationById(id: string) {
    return this.data.conversations.find(c => c.id === id);
  }

  public findOrCreateConversation(landlordId: string, renterId: string, propertyId?: string) {
    let conv = this.data.conversations.find(c =>
      c.landlordId === landlordId && c.renterId === renterId && (propertyId ? c.propertyId === propertyId : true)
    );

    if (!conv) {
      conv = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        propertyId,
        landlordId,
        renterId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString()
      };
      this.data.conversations.unshift(conv);
      this.persist();
    }
    return conv;
  }

  public getMessages(conversationId: string) {
    return this.data.messages.filter(m => m.conversationId === conversationId);
  }

  public createMessage(conversationId: string, senderId: string, receiverId: string, content: string) {
    const msg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId,
      senderId,
      receiverId,
      content,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.data.messages.push(msg);

    const conv = this.getConversationById(conversationId);
    if (conv) {
      conv.updatedAt = msg.createdAt;
      conv.lastMessageAt = msg.createdAt;
    }

    this.persist();
    return msg;
  }

  public markMessagesAsRead(conversationId: string, receiverId: string) {
    let changed = false;
    this.data.messages.forEach(m => {
      if (m.conversationId === conversationId && m.receiverId === receiverId && !m.isRead) {
        m.isRead = true;
        changed = true;
      }
    });
    if (changed) {
      this.persist();
    }
  }

  // Inquiries
  public getInquiries(filter?: { landlordId?: string; renterId?: string; propertyId?: string }) {
    return this.data.inquiries.filter(inq => {
      if (filter?.landlordId && inq.landlordId !== filter.landlordId) return false;
      if (filter?.renterId && inq.renterId !== filter.renterId) return false;
      if (filter?.propertyId && inq.propertyId !== filter.propertyId) return false;
      return true;
    });
  }

  public getInquiryById(id: string) {
    return this.data.inquiries.find(i => i.id === id);
  }

  public createInquiry(inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
    const newInq: Inquiry = {
      ...inquiry,
      id: `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.inquiries.unshift(newInq);
    this.persist();
    return newInq;
  }

  public updateInquiry(id: string, updates: Partial<Inquiry>) {
    const idx = this.data.inquiries.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.data.inquiries[idx] = { ...this.data.inquiries[idx], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      return this.data.inquiries[idx];
    }
    return null;
  }

  // Reports
  public getReports() {
    return this.data.reports;
  }

  public createReport(propertyId: string, reporterId: string, reason: string, details?: string) {
    const report: Report = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      propertyId,
      reporterId,
      reason,
      details,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.data.reports.unshift(report);
    this.persist();
    return report;
  }

  public updateReport(id: string, updates: Partial<Report>) {
    const idx = this.data.reports.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.reports[idx] = { ...this.data.reports[idx], ...updates };
      this.persist();
      return this.data.reports[idx];
    }
    return null;
  }

  // Notifications
  public getNotifications(userId: string) {
    return this.data.notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(userId: string, title: string, message: string, type: string, link?: string) {
    const notif: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title,
      message,
      type,
      link,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(notif);
    this.persist();
    return notif;
  }

  public markNotificationAsRead(id: string, userId: string) {
    const notif = this.data.notifications.find(n => n.id === id && n.userId === userId);
    if (notif) {
      notif.isRead = true;
      this.persist();
    }
  }

  public markAllNotificationsAsRead(userId: string) {
    let changed = false;
    this.data.notifications.forEach(n => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        changed = true;
      }
    });
    if (changed) {
      this.persist();
    }
  }

  // Reviews
  public getReviews(propertyId?: string) {
    if (!this.data.reviews) this.data.reviews = [];
    if (propertyId) {
      return this.data.reviews
        .filter(r => r.propertyId === propertyId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return this.data.reviews;
  }

  public createReview(review: Omit<Review, 'id' | 'createdAt'>) {
    if (!this.data.reviews) this.data.reviews = [];
    const newRev: Review = {
      ...review,
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    this.data.reviews.unshift(newRev);
    this.persist();
    return newRev;
  }

  // Database Management & DevOps
  public getDatabaseStatus() {
    let fileSize = 0;
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        fileSize = fs.statSync(DB_FILE_PATH).size;
      }
    } catch (e) {}

    const reviewCount = (this.data.reviews || []).length;
    const totalRecords =
      this.data.users.length +
      this.data.properties.length +
      this.data.inquiries.length +
      this.data.conversations.length +
      this.data.messages.length +
      this.data.favorites.length +
      this.data.reports.length +
      this.data.notifications.length +
      reviewCount;

    return {
      engine: this.isPostgresConnected ? 'PostgreSQL' : 'Embedded Persistent JSON Engine',
      status: this.isPostgresConnected ? 'connected' : 'active',
      isPostgres: this.isPostgresConnected,
      postgresError: this.postgresError,
      fileStoragePath: DB_FILE_PATH,
      storageSizeBytes: fileSize,
      storageSizeFormatted: (fileSize / 1024).toFixed(1) + ' KB',
      tables: [
        { name: 'users', count: this.data.users.length, description: 'Registered platform users and authentication credentials' },
        { name: 'properties', count: this.data.properties.length, description: 'Housing listings, addresses, specs, and status' },
        { name: 'property_images', count: this.data.properties.reduce((acc, p) => acc + (p.images?.length || 0), 0), description: 'Photo galleries and media assets' },
        { name: 'inquiries', count: this.data.inquiries.length, description: 'Viewing requests and formal rental applications' },
        { name: 'conversations', count: this.data.conversations.length, description: 'Direct messaging threads between users' },
        { name: 'messages', count: this.data.messages.length, description: 'Chat messages and timestamps' },
        { name: 'favorites', count: this.data.favorites.length, description: 'Saved property bookmarks per user' },
        { name: 'reports', count: this.data.reports.length, description: 'Moderation flags and compliance reports' },
        { name: 'notifications', count: this.data.notifications.length, description: 'System and status alerts' },
        { name: 'reviews', count: reviewCount, description: 'Ratings and verified tenant reviews' }
      ],
      totalRecords
    };
  }

  public exportBackup(): DatabaseData {
    return JSON.parse(JSON.stringify(this.data));
  }

  public importBackup(newData: any): boolean {
    if (!newData || !Array.isArray(newData.users) || !Array.isArray(newData.properties)) {
      throw new Error('Invalid backup schema. Required users and properties arrays.');
    }
    this.data = {
      users: newData.users || [],
      properties: newData.properties || [],
      favorites: newData.favorites || [],
      conversations: newData.conversations || [],
      messages: newData.messages || [],
      inquiries: newData.inquiries || [],
      reports: newData.reports || [],
      notifications: newData.notifications || [],
      reviews: newData.reviews || []
    };
    this.persist();
    return true;
  }

  public clearAllData(): DatabaseData {
    const empty = getEmptyDatabase();
    this.data = empty;
    this.persist();
    return empty;
  }

  /**
   * Creates an admin account with the given credentials. Idempotent: if a
   * user with this email already exists, it is left untouched (and, if it
   * isn't already an admin, its role is NOT changed automatically — call
   * sites should surface that to the operator instead of silently escalating
   * an existing account). Works against both the PostgreSQL and embedded
   * JSON storage modes. Used by scripts/create-admin.ts and the
   * ADMIN_EMAIL/ADMIN_PASSWORD startup bootstrap.
   */
  public async createAdminUser(email: string, password: string, name: string = 'Admin'): Promise<{ created: boolean; user: Omit<User, 'passwordHash'> }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (this.isPostgresConnected && this.pool) {
      const existing = await this.pool.query('SELECT id, name, email, role, phone, avatar, bio, is_verified, status, created_at, updated_at FROM users WHERE email = $1', [normalizedEmail]);
      if (existing.rowCount && existing.rowCount > 0) {
        const row = existing.rows[0];
        return {
          created: false,
          user: {
            id: row.id, name: row.name, email: row.email, role: row.role, phone: row.phone,
            avatar: row.avatar, bio: row.bio, isVerified: row.is_verified, status: row.status,
            createdAt: row.created_at, updatedAt: row.updated_at
          }
        };
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const id = `usr_admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const inserted = await this.pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, phone, avatar, bio, is_verified, status)
         VALUES ($1, $2, $3, $4, 'admin', $5, $6, $7, TRUE, 'active')
         RETURNING id, name, email, role, phone, avatar, bio, is_verified, status, created_at, updated_at`,
        [id, name, normalizedEmail, passwordHash, '', '', '']
      );
      const row = inserted.rows[0];
      return {
        created: true,
        user: {
          id: row.id, name: row.name, email: row.email, role: row.role, phone: row.phone,
          avatar: row.avatar, bio: row.bio, isVerified: row.is_verified, status: row.status,
          createdAt: row.created_at, updatedAt: row.updated_at
        }
      };
    }

    const existingUser = this.getUserByEmail(normalizedEmail);
    if (existingUser) {
      const { passwordHash: _, ...safe } = existingUser;
      return { created: false, user: safe };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const newUser = this.createUser({
      id: `usr_admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      email: normalizedEmail,
      passwordHash,
      role: 'admin',
      phone: '',
      avatar: '',
      bio: '',
      isVerified: true,
      status: 'active',
      createdAt: now,
      updatedAt: now
    });
    const { passwordHash: _, ...safe } = newUser;
    return { created: true, user: safe };
  }

  /**
   * Bootstraps the initial admin account from ADMIN_EMAIL/ADMIN_PASSWORD env
   * vars, if both are set. No-op (with no default credentials) otherwise, and
   * safe to call on every startup — a no-op once an account with that email
   * already exists.
   */
  public async bootstrapAdminFromEnv(): Promise<void> {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      return;
    }
    const name = process.env.ADMIN_NAME || 'System Admin';

    const { created } = await this.createAdminUser(email, password, name);
    if (created) {
      console.log(`[RentHub Database] Admin account bootstrapped for ${email}.`);
    }
  }

  public getSchemaSQL(): string {
    const schemaPath = path.join(process.cwd(), 'server', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      return fs.readFileSync(schemaPath, 'utf-8');
    }
    return '';
  }
}

export const db = new Database();
