export type UserRole = 'renter' | 'landlord' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar: string;
  bio?: string;
  isVerified: boolean;
  status: 'active' | 'suspended';
  createdAt: string;
  propertiesCount?: number;
  inquiriesCount?: number;
}

export type PropertyType = 'Apartment' | 'House' | 'Villa' | 'Studio' | 'Condominium' | 'Room';
export type PropertyStatus = 'active' | 'rented' | 'pending_approval' | 'archived';

export interface PropertyImage {
  id: string;
  propertyId?: string;
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
  propertyType: PropertyType;
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
  status: PropertyStatus;
  viewsCount: number;
  isFeatured: boolean;
  amenities: string[];
  images: PropertyImage[];
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  favoritedAt?: string;
  inquiriesCount?: number;
  pendingInquiriesCount?: number;
  averageRating?: number;
  reviewsCount?: number;
  reviews?: Review[];
  landlord?: {
    id: string;
    name: string;
    avatar: string;
    phone: string;
    bio?: string;
    isVerified: boolean;
    memberSince?: string;
  } | null;
}

export interface Review {
  id: string;
  propertyId: string;
  landlordId: string;
  renterId: string;
  rating: number;
  comment: string;
  createdAt: string;
  renter?: {
    id: string;
    name: string;
    avatar: string;
  } | null;
}

export type InquiryStatus = 'pending' | 'contacted' | 'viewing_scheduled' | 'approved' | 'rejected' | 'closed';

export interface Inquiry {
  id: string;
  propertyId: string;
  renterId: string;
  landlordId: string;
  message: string;
  preferredViewingDate?: string;
  preferredContactTime?: string;
  status: InquiryStatus;
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
  property?: {
    id: string;
    title: string;
    price: number;
    currency: string;
    neighborhood: string;
    image: string;
  } | null;
  renter?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
  } | null;
  landlord?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
  } | null;
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
  property?: {
    id: string;
    title: string;
    price: number;
    currency: string;
    neighborhood: string;
    image: string;
  } | null;
  otherUser?: {
    id: string;
    name: string;
    avatar: string;
    role: UserRole;
    phone: string;
    isVerified: boolean;
  } | null;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  lastMessageAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  propertyId: string;
  reporterId: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
  property?: {
    id: string;
    title: string;
    price: number;
    status: string;
    landlordId: string;
  } | null;
  reporter?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface AdminStats {
  totalUsers: number;
  totalLandlords: number;
  totalRenters: number;
  totalProperties: number;
  activeProperties: number;
  rentedProperties: number;
  pendingProperties: number;
  totalInquiries: number;
  pendingReports: number;
  totalReports: number;
}

export interface LandlordStats {
  totalProperties: number;
  activeProperties: number;
  rentedProperties: number;
  totalInquiries: number;
  pendingInquiries: number;
  unreadMessages: number;
  totalViews: number;
  recentInquiries: any[];
}

export interface RenterStats {
  favoritesCount: number;
  totalInquiries: number;
  pendingInquiries: number;
  scheduledViewings: number;
  approvedInquiries: number;
  unreadMessages: number;
  conversationsCount: number;
}

export interface DatabaseTableInfo {
  name: string;
  count: number;
  description: string;
}

export interface DatabaseStatusInfo {
  engine: string;
  status: string;
  isPostgres: boolean;
  postgresError?: string | null;
  fileStoragePath: string;
  storageSizeBytes: number;
  storageSizeFormatted: string;
  tables: DatabaseTableInfo[];
  totalRecords: number;
}
