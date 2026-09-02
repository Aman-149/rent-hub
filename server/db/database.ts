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

// Helper to seed initial high quality data
function getInitialSeedData(): DatabaseData {
  const salt = bcrypt.genSaltSync(10);
  const defaultHash = bcrypt.hashSync('password123', salt);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const landlordHash = bcrypt.hashSync('landlord123', salt);
  const renterHash = bcrypt.hashSync('renter123', salt);

  const users: User[] = [
    {
      id: 'usr_admin',
      name: 'System Admin',
      email: 'admin@renthub.com',
      passwordHash: adminHash,
      role: 'admin',
      phone: '+251 911 000 001',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: 'RentHub Platform Compliance and Trust Team.',
      isVerified: true,
      status: 'active',
      createdAt: '2025-01-01T08:00:00.000Z',
      updatedAt: '2025-01-01T08:00:00.000Z',
    },
    {
      id: 'usr_landlord_1',
      name: 'Abebe Tadesse',
      email: 'landlord@renthub.com',
      passwordHash: landlordHash,
      role: 'landlord',
      phone: '+251 911 234 567',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      bio: 'Experienced property owner in Bole and Kazanchis with high-end residential suites.',
      isVerified: true,
      status: 'active',
      createdAt: '2025-01-05T10:00:00.000Z',
      updatedAt: '2025-01-05T10:00:00.000Z',
    },
    {
      id: 'usr_landlord_2',
      name: 'Sara Worku',
      email: 'sara.worku@example.com',
      passwordHash: defaultHash,
      role: 'landlord',
      phone: '+251 922 987 654',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      bio: 'Owner of modern family villas and luxury condominiums in CMC and Ayat.',
      isVerified: true,
      status: 'active',
      createdAt: '2025-01-10T09:30:00.000Z',
      updatedAt: '2025-01-10T09:30:00.000Z',
    },
    {
      id: 'usr_landlord_3',
      name: 'Dawit Mengistu',
      email: 'dawit.m@example.com',
      passwordHash: defaultHash,
      role: 'landlord',
      phone: '+251 933 456 789',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      bio: 'Offering furnished executive suites near diplomatic zones in Old Airport.',
      isVerified: true,
      status: 'active',
      createdAt: '2025-01-15T11:20:00.000Z',
      updatedAt: '2025-01-15T11:20:00.000Z',
    },
    {
      id: 'usr_renter_1',
      name: 'Bethlehem Haile',
      email: 'renter@renthub.com',
      passwordHash: renterHash,
      role: 'renter',
      phone: '+251 912 345 678',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      bio: 'Software engineer looking for modern 1 or 2 bedroom furnished apartments in Addis.',
      isVerified: true,
      status: 'active',
      createdAt: '2025-02-01T14:00:00.000Z',
      updatedAt: '2025-02-01T14:00:00.000Z',
    },
    {
      id: 'usr_renter_2',
      name: 'Yonas Kebede',
      email: 'yonas.k@example.com',
      passwordHash: defaultHash,
      role: 'renter',
      phone: '+251 944 112 233',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
      bio: 'Young professional relocating to Addis Ababa.',
      isVerified: false,
      status: 'active',
      createdAt: '2025-02-05T16:45:00.000Z',
      updatedAt: '2025-02-05T16:45:00.000Z',
    }
  ];

  const properties: Property[] = [
    {
      id: 'prop_1',
      landlordId: 'usr_landlord_1',
      title: 'Modern 2 Bedroom Luxury Apartment in Bole',
      description: 'Stunning fully furnished 2-bedroom apartment situated in the heart of Bole near Medhanialem. Features open-plan living, custom Italian kitchen, large sunny balcony, 24/7 backup generator, water reserve tank, and secure underground parking. Ideal for expats and professionals.',
      propertyType: 'Apartment',
      price: 35000,
      currency: 'ETB',
      city: 'Addis Ababa',
      neighborhood: 'Bole',
      address: 'Near Medhanialem Church, Bole Road',
      bedrooms: 2,
      bathrooms: 2,
      sizeSqFt: 120,
      isFurnished: true,
      availableFrom: '2026-09-01',
      contactPreference: 'Platform Chat & Phone',
      status: 'active',
      viewsCount: 142,
      isFeatured: true,
      amenities: ['Wi-Fi', 'Parking', 'Water Tank', 'Backup Generator', 'Security 24/7', 'Balcony', 'Elevator', 'Furnished', 'Modern Kitchen'],
      images: [
        {
          id: 'img_1_1',
          propertyId: 'prop_1',
          imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
          isPrimary: true,
          caption: 'Spacious living room with natural light',
          sortOrder: 1
        },
        {
          id: 'img_1_2',
          propertyId: 'prop_1',
          imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80',
          isPrimary: false,
          caption: 'Modern dining and kitchen area',
          sortOrder: 2
        },
        {
          id: 'img_1_3',
          propertyId: 'prop_1',
          imageUrl: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?w=1200&auto=format&fit=crop&q=80',
          isPrimary: false,
          caption: 'Master bedroom with en-suite bath',
          sortOrder: 3
        },
        {
          id: 'img_1_4',
          propertyId: 'prop_1',
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop&q=80',
          isPrimary: false,
          caption: 'Clean contemporary bathroom',
          sortOrder: 4
        }
      ],
      createdAt: '2026-08-10T10:00:00.000Z',
      updatedAt: '2026-08-10T10:00:00.000Z'
    },
    {
      id: 'prop_2',
      landlordId: 'usr_landlord_2',
      title: 'Spacious 4 Bedroom Family Villa with Garden in CMC',
      description: 'Elegant standalone 4-bedroom family villa in the peaceful residential community of CMC Michael. Offers private gated compound, manicured green garden, staff quarters, multiple parking spaces, and high ceiling living room with fireplace.',
      propertyType: 'Villa',
      price: 65000,
      currency: 'ETB',
      city: 'Addis Ababa',
      neighborhood: 'CMC',
      address: 'CMC Michael Residential Zone',
      bedrooms: 4,
      bathrooms: 3,
      sizeSqFt: 350,
      isFurnished: false,
      availableFrom: '2026-09-15',
      contactPreference: 'Platform Chat',
      status: 'active',
      viewsCount: 98,
      isFeatured: true,
      amenities: ['Parking', 'Water Tank', 'Security 24/7', 'Private Garden', 'Pet Friendly', 'Balcony', 'Staff Quarters'],
      images: [
        {
          id: 'img_2_1',
          propertyId: 'prop_2',
          imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
          isPrimary: true,
          caption: 'Villa exterior and entrance',
          sortOrder: 1
        },
        {
          id: 'img_2_2',
          propertyId: 'prop_2',
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
          isPrimary: false,
          caption: 'Expansive family room',
          sortOrder: 2
        },
        {
          id: 'img_2_3',
          propertyId: 'prop_2',
          imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
          isPrimary: false,
          caption: 'Garden patio area',
          sortOrder: 3
        }
      ],
      createdAt: '2026-08-12T14:30:00.000Z',
      updatedAt: '2026-08-12T14:30:00.000Z'
    },
    {
      id: 'prop_3',
      landlordId: 'usr_landlord_1',
      title: 'Chic Studio Apartment Near UNECA Kazanchis',
      description: 'Compact, beautifully designed studio apartment steps away from the UN ECA and Radisson Blu in Kazanchis. Includes high-speed fiber internet, kitchenette with induction stove, smart TV, hot shower, and quiet workspace. Water and electricity are fully included in rent.',
      propertyType: 'Studio',
      price: 20000,
      currency: 'ETB',
      city: 'Addis Ababa',
      neighborhood: 'Kazanchis',
      address: 'Behind Radisson Blu, Kazanchis',
      bedrooms: 1,
      bathrooms: 1,
      sizeSqFt: 45,
      isFurnished: true,
      availableFrom: '2026-08-28',
      contactPreference: 'Platform Chat',
      status: 'active',
      viewsCount: 230,
      isFeatured: true,
      amenities: ['Wi-Fi', 'Water Tank', 'Backup Generator', 'Elevator', 'Security 24/7', 'Furnished', 'Utilities Included'],
      images: [
        {
          id: 'img_3_1',
          propertyId: 'prop_3',
          imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80',
          isPrimary: true,
          caption: 'Cozy studio layout with workspace',
          sortOrder: 1
        },
        {
          id: 'img_3_2',
          propertyId: 'prop_3',
          imageUrl: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=1200&auto=format&fit=crop&q=80',
          isPrimary: false,
          caption: 'Modern bathroom fixture',
          sortOrder: 2
        }
      ],
      createdAt: '2026-08-15T09:00:00.000Z',
      updatedAt: '2026-08-15T09:00:00.000Z'
    },
    {
      id: 'prop_4',
      landlordId: 'usr_landlord_3',
      title: 'Diplomatic 3 Bedroom Penthouse in Old Airport',
      description: 'Exclusive 3-bedroom penthouse with panoramic views over the green hills of Old Airport. Top floor privacy, expansive wrap-around terrace, master suite with walk-in closet, jacuzzi bath, dual water reservoirs, dedicated standby generator, and concierge service.',
      propertyType: 'Apartment',
      price: 80000,
      currency: 'ETB',
      city: 'Addis Ababa',
      neighborhood: 'Old Airport',
      address: 'Near International Community School (ICS)',
      bedrooms: 3,
      bathrooms: 3,
      sizeSqFt: 220,
      isFurnished: true,
      availableFrom: '2026-09-01',
      contactPreference: 'Platform Chat & Phone',
      status: 'active',
      viewsCount: 175,
      isFeatured: true,
      amenities: ['Wi-Fi', 'Parking', 'Water Tank', 'Backup Generator', 'Security 24/7', 'Balcony', 'Elevator', 'Furnished', 'Air Conditioning', 'Gym Access'],
      images: [
        {
          id: 'img_4_1',
          propertyId: 'prop_4',
          imageUrl: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200&auto=format&fit=crop&q=80',
          isPrimary: true,
          caption: 'Penthouse living space with terrace views',
          sortOrder: 1
        },
        {
          id: 'img_4_2',
          propertyId: 'prop_4',
          imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80',
          isPrimary: false,
          caption: 'Gourmet kitchen with island',
          sortOrder: 2
        },
        {
          id: 'img_4_3',
          propertyId: 'prop_4',
          imageUrl: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&auto=format&fit=crop&q=80',
          isPrimary: false,
          caption: 'Master ensuite bath',
          sortOrder: 3
        }
      ],
      createdAt: '2026-08-16T12:00:00.000Z',
      updatedAt: '2026-08-16T12:00:00.000Z'
    },
    {
      id: 'prop_5',
      landlordId: 'usr_landlord_2',
      title: 'Newly Built 2 Bedroom Condominium in Ayat',
      description: 'Brand new 2-bedroom condominium located in Ayat Zone 2. Features clean ceramic tiling throughout, ample storage, reliable water tank system, secured gated building, and walking distance to the light rail station and supermarkets.',
      propertyType: 'Condominium',
      price: 18000,
      currency: 'ETB',
      city: 'Addis Ababa',
      neighborhood: 'Ayat',
      address: 'Ayat Zone 2 near Light Rail',
      bedrooms: 2,
      bathrooms: 1,
      sizeSqFt: 85,
      isFurnished: false,
      availableFrom: '2026-08-30',
      contactPreference: 'Platform Chat',
      status: 'active',
      viewsCount: 88,
      isFeatured: false,
      amenities: ['Water Tank', 'Parking', 'Balcony', 'Security 24/7'],
      images: [
        {
          id: 'img_5_1',
          propertyId: 'prop_5',
          imageUrl: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&auto=format&fit=crop&q=80',
          isPrimary: true,
          caption: 'Bright living and dining space',
          sortOrder: 1
        },
        {
          id: 'img_5_2',
          propertyId: 'prop_5',
          imageUrl: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200&auto=format&fit=crop&q=80',
          isPrimary: false,
          caption: 'Kitchen space with cabinets',
          sortOrder: 2
        }
      ],
      createdAt: '2026-08-18T15:20:00.000Z',
      updatedAt: '2026-08-18T15:20:00.000Z'
    },
    {
      id: 'prop_6',
      landlordId: 'usr_landlord_1',
      title: 'Sunlit 3 Bedroom House in Gerji',
      description: 'Comfortable family townhouse in Gerji Mebrat Hail. Well maintained with private courtyard, separate kitchen, dedicated laundry room, reliable backup utilities, and strong 24/7 neighborhood security watch.',
      propertyType: 'House',
      price: 45000,
      currency: 'ETB',
      city: 'Addis Ababa',
      neighborhood: 'Gerji',
      address: 'Gerji Mebrat Hail, Addis Ababa',
      bedrooms: 3,
      bathrooms: 2,
      sizeSqFt: 180,
      isFurnished: false,
      availableFrom: '2026-09-10',
      contactPreference: 'Platform Chat',
      status: 'active',
      viewsCount: 110,
      isFeatured: false,
      amenities: ['Parking', 'Water Tank', 'Backup Generator', 'Balcony', 'Laundry', 'Security 24/7'],
      images: [
        {
          id: 'img_6_1',
          propertyId: 'prop_6',
          imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80',
          isPrimary: true,
          caption: 'Front facade and driveway',
          sortOrder: 1
        },
        {
          id: 'img_6_2',
          propertyId: 'prop_6',
          imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=80',
          isPrimary: false,
          caption: 'Living hall with high ceiling',
          sortOrder: 2
        }
      ],
      createdAt: '2026-08-19T08:15:00.000Z',
      updatedAt: '2026-08-19T08:15:00.000Z'
    },
    {
      id: 'prop_7',
      landlordId: 'usr_landlord_3',
      title: 'Prime 1 Bedroom Executive Flat in Megenagna',
      description: 'Convenient 1-bedroom flat in commercial Megenagna district near Zefmesh Grand Mall. Perfect for single professionals. Fully serviced building with elevator, backup generator, fast WiFi, and round the clock security.',
      propertyType: 'Apartment',
      price: 24000,
      currency: 'ETB',
      city: 'Addis Ababa',
      neighborhood: 'Megenagna',
      address: 'Near Zefmesh Mall, Megenagna',
      bedrooms: 1,
      bathrooms: 1,
      sizeSqFt: 60,
      isFurnished: true,
      availableFrom: '2026-09-01',
      contactPreference: 'Platform Chat',
      status: 'active',
      viewsCount: 160,
      isFeatured: true,
      amenities: ['Wi-Fi', 'Backup Generator', 'Elevator', 'Security 24/7', 'Furnished', 'Water Tank'],
      images: [
        {
          id: 'img_7_1',
          propertyId: 'prop_7',
          imageUrl: 'https://images.unsplash.com/photo-1502005229762-ee1afd5583e5?w=1200&auto=format&fit=crop&q=80',
          isPrimary: true,
          caption: 'Modern open concept interior',
          sortOrder: 1
        },
        {
          id: 'img_7_2',
          propertyId: 'prop_7',
          imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200&auto=format&fit=crop&q=80',
          isPrimary: false,
          caption: 'Comfortable bedroom suite',
          sortOrder: 2
        }
      ],
      createdAt: '2026-08-20T11:40:00.000Z',
      updatedAt: '2026-08-20T11:40:00.000Z'
    },
    {
      id: 'prop_8',
      landlordId: 'usr_landlord_2',
      title: 'Affordable Furnished Private Room in Saris',
      description: 'Cozy private room with shared modern kitchen and bathroom in Saris Abo. Perfect for university students or interns. Clean, peaceful, includes fast Wi-Fi and water supply.',
      propertyType: 'Room',
      price: 8500,
      currency: 'ETB',
      city: 'Addis Ababa',
      neighborhood: 'Saris',
      address: 'Saris Abo near Ring Road',
      bedrooms: 1,
      bathrooms: 1,
      sizeSqFt: 25,
      isFurnished: true,
      availableFrom: '2026-08-29',
      contactPreference: 'Platform Chat',
      status: 'active',
      viewsCount: 65,
      isFeatured: false,
      amenities: ['Wi-Fi', 'Water Tank', 'Furnished', 'Security 24/7'],
      images: [
        {
          id: 'img_8_1',
          propertyId: 'prop_8',
          imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&auto=format&fit=crop&q=80',
          isPrimary: true,
          caption: 'Neat private bedroom',
          sortOrder: 1
        }
      ],
      createdAt: '2026-08-21T13:10:00.000Z',
      updatedAt: '2026-08-21T13:10:00.000Z'
    },
    {
      id: 'prop_9',
      landlordId: 'usr_landlord_1',
      title: 'High-Floor 3 Bedroom Luxury Apartment in Bole Atlas',
      description: 'Top grade 3-bedroom apartment with scenic mountain and airport views. Features wooden flooring, en-suite bathrooms, balcony, German kitchen equipment, gym access, backup generators, and fiber connection.',
      propertyType: 'Apartment',
      price: 52000,
      currency: 'ETB',
      city: 'Addis Ababa',
      neighborhood: 'Bole',
      address: 'Bole Atlas, near Desalegn Hotel',
      bedrooms: 3,
      bathrooms: 2.5,
      sizeSqFt: 165,
      isFurnished: true,
      availableFrom: '2026-09-01',
      contactPreference: 'Platform Chat & Phone',
      status: 'rented',
      viewsCount: 310,
      isFeatured: false,
      amenities: ['Wi-Fi', 'Parking', 'Water Tank', 'Backup Generator', 'Elevator', 'Security 24/7', 'Gym Access', 'Balcony', 'Furnished'],
      images: [
        {
          id: 'img_9_1',
          propertyId: 'prop_9',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
          isPrimary: true,
          caption: 'Spacious open living room',
          sortOrder: 1
        },
        {
          id: 'img_9_2',
          propertyId: 'prop_9',
          imageUrl: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&auto=format&fit=crop&q=80',
          isPrimary: false,
          caption: 'Modern luxury kitchen',
          sortOrder: 2
        }
      ],
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-22T10:00:00.000Z'
    },
    {
      id: 'prop_10',
      landlordId: 'usr_landlord_3',
      title: 'Spacious 2 Bedroom Modern Apartment in Kazanchis',
      description: 'Modern and quiet 2-bedroom residence situated just 2 minutes from Intercontinental Hotel. Large living room, master suite, high-speed lift, underground secure parking, 24-hour security guards, water reserve.',
      propertyType: 'Apartment',
      price: 32000,
      currency: 'ETB',
      city: 'Addis Ababa',
      neighborhood: 'Kazanchis',
      address: 'Kazanchis Business Corridor',
      bedrooms: 2,
      bathrooms: 2,
      sizeSqFt: 110,
      isFurnished: true,
      availableFrom: '2026-09-05',
      contactPreference: 'Platform Chat',
      status: 'active',
      viewsCount: 140,
      isFeatured: true,
      amenities: ['Wi-Fi', 'Parking', 'Water Tank', 'Backup Generator', 'Elevator', 'Security 24/7', 'Balcony', 'Furnished'],
      images: [
        {
          id: 'img_10_1',
          propertyId: 'prop_10',
          imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&auto=format&fit=crop&q=80',
          isPrimary: true,
          caption: 'Well-appointed living area',
          sortOrder: 1
        },
        {
          id: 'img_10_2',
          propertyId: 'prop_10',
          imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&auto=format&fit=crop&q=80',
          isPrimary: false,
          caption: 'Guest bedroom with work desk',
          sortOrder: 2
        }
      ],
      createdAt: '2026-08-22T16:00:00.000Z',
      updatedAt: '2026-08-22T16:00:00.000Z'
    },
    {
      id: 'prop_11',
      landlordId: 'usr_landlord_2',
      title: 'Grand 5 Bedroom Luxury Residence in Old Airport',
      description: 'Immaculate luxury estate in prime Old Airport enclave with private security post, expansive swimming pool, landscaped gardens, 3-car garage, backup solar and generator systems, and staff quarters.',
      propertyType: 'Villa',
      price: 120000,
      currency: 'ETB',
      city: 'Addis Ababa',
      neighborhood: 'Old Airport',
      address: 'Old Airport Diplomatic Quarter',
      bedrooms: 5,
      bathrooms: 4,
      sizeSqFt: 480,
      isFurnished: true,
      availableFrom: '2026-09-15',
      contactPreference: 'Platform Chat & Phone',
      status: 'active',
      viewsCount: 195,
      isFeatured: true,
      amenities: ['Wi-Fi', 'Parking', 'Water Tank', 'Backup Generator', 'Security 24/7', 'Private Garden', 'Balcony', 'Furnished', 'Air Conditioning', 'Gym Access', 'Pet Friendly'],
      images: [
        {
          id: 'img_11_1',
          propertyId: 'prop_11',
          imageUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&auto=format&fit=crop&q=80',
          isPrimary: true,
          caption: 'Grand luxury estate frontage',
          sortOrder: 1
        },
        {
          id: 'img_11_2',
          propertyId: 'prop_11',
          imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80',
          isPrimary: false,
          caption: 'Living room with garden views',
          sortOrder: 2
        }
      ],
      createdAt: '2026-08-23T10:00:00.000Z',
      updatedAt: '2026-08-23T10:00:00.000Z'
    },
    {
      id: 'prop_12',
      landlordId: 'usr_landlord_1',
      title: 'Cozy 1 Bedroom Apartment in Saris near Transport Hub',
      description: 'Clean and well-maintained 1-bedroom apartment close to Kadisco / Saris junction. Great access to public transit, quiet compound with gatekeeper and water storage.',
      propertyType: 'Apartment',
      price: 15000,
      currency: 'ETB',
      city: 'Addis Ababa',
      neighborhood: 'Saris',
      address: 'Near Kadisco, Saris',
      bedrooms: 1,
      bathrooms: 1,
      sizeSqFt: 55,
      isFurnished: false,
      availableFrom: '2026-09-01',
      contactPreference: 'Platform Chat',
      status: 'active',
      viewsCount: 82,
      isFeatured: false,
      amenities: ['Water Tank', 'Parking', 'Security 24/7', 'Balcony'],
      images: [
        {
          id: 'img_12_1',
          propertyId: 'prop_12',
          imageUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&auto=format&fit=crop&q=80',
          isPrimary: true,
          caption: 'Kitchen and living space',
          sortOrder: 1
        }
      ],
      createdAt: '2026-08-24T14:15:00.000Z',
      updatedAt: '2026-08-24T14:15:00.000Z'
    }
  ];

  const favorites: Favorite[] = [
    {
      id: 'fav_1',
      userId: 'usr_renter_1',
      propertyId: 'prop_1',
      createdAt: '2026-08-20T12:00:00.000Z'
    },
    {
      id: 'fav_2',
      userId: 'usr_renter_1',
      propertyId: 'prop_3',
      createdAt: '2026-08-22T08:30:00.000Z'
    }
  ];

  const conversations: Conversation[] = [
    {
      id: 'conv_1',
      propertyId: 'prop_1',
      landlordId: 'usr_landlord_1',
      renterId: 'usr_renter_1',
      createdAt: '2026-08-22T10:00:00.000Z',
      updatedAt: '2026-08-22T10:35:00.000Z',
      lastMessageAt: '2026-08-22T10:35:00.000Z'
    }
  ];

  const messages: Message[] = [
    {
      id: 'msg_1',
      conversationId: 'conv_1',
      senderId: 'usr_renter_1',
      receiverId: 'usr_landlord_1',
      content: 'Hello Ato Abebe, is this 2-bedroom apartment in Bole still available for long term rent?',
      isRead: true,
      createdAt: '2026-08-22T10:00:00.000Z'
    },
    {
      id: 'msg_2',
      conversationId: 'conv_1',
      senderId: 'usr_landlord_1',
      receiverId: 'usr_renter_1',
      content: 'Hello Bethlehem! Yes, it is fully available starting September 1st. Would you like to schedule an in-person viewing?',
      isRead: true,
      createdAt: '2026-08-22T10:15:00.000Z'
    },
    {
      id: 'msg_3',
      conversationId: 'conv_1',
      senderId: 'usr_renter_1',
      receiverId: 'usr_landlord_1',
      content: 'That would be great! Can I come tomorrow at 3:00 PM?',
      isRead: true,
      createdAt: '2026-08-22T10:30:00.000Z'
    },
    {
      id: 'msg_4',
      conversationId: 'conv_1',
      senderId: 'usr_landlord_1',
      receiverId: 'usr_renter_1',
      content: 'Perfect! I will meet you at the main gate near Medhanialem. See you tomorrow at 3:00 PM.',
      isRead: false,
      createdAt: '2026-08-22T10:35:00.000Z'
    }
  ];

  const inquiries: Inquiry[] = [
    {
      id: 'inq_1',
      propertyId: 'prop_1',
      renterId: 'usr_renter_1',
      landlordId: 'usr_landlord_1',
      message: 'Interested in leasing this apartment for a 1-year contract. I would love to check the water pressure and parking spot.',
      preferredViewingDate: '2026-08-28',
      preferredContactTime: 'Afternoon (2:00 PM - 5:00 PM)',
      status: 'viewing_scheduled',
      landlordNotes: 'Scheduled visit for Friday at 3:00 PM.',
      createdAt: '2026-08-22T09:55:00.000Z',
      updatedAt: '2026-08-22T10:40:00.000Z'
    },
    {
      id: 'inq_2',
      propertyId: 'prop_3',
      renterId: 'usr_renter_1',
      landlordId: 'usr_landlord_1',
      message: 'Hi, does the rent include high-speed Wi-Fi and power backup?',
      preferredViewingDate: '2026-08-30',
      preferredContactTime: 'Morning (9:00 AM - 12:00 PM)',
      status: 'contacted',
      landlordNotes: 'Replied via messaging confirming all utilities are included.',
      createdAt: '2026-08-24T11:20:00.000Z',
      updatedAt: '2026-08-24T12:00:00.000Z'
    }
  ];

  const reports: Report[] = [
    {
      id: 'rep_1',
      propertyId: 'prop_8',
      reporterId: 'usr_renter_2',
      reason: 'Wrong information',
      details: 'Inquired about water availability, owner said water is scheduled 3 days a week instead of constant.',
      status: 'pending',
      adminNotes: undefined,
      createdAt: '2026-08-25T14:10:00.000Z'
    }
  ];

  const notifications: Notification[] = [
    {
      id: 'notif_1',
      userId: 'usr_renter_1',
      title: 'Viewing Confirmed',
      message: 'Abebe Tadesse scheduled your viewing for Modern 2 Bedroom Luxury Apartment in Bole.',
      type: 'inquiry_update',
      link: '/dashboard/renter',
      isRead: false,
      createdAt: '2026-08-22T10:40:00.000Z'
    },
    {
      id: 'notif_2',
      userId: 'usr_landlord_1',
      title: 'New Property Inquiry',
      message: 'Bethlehem Haile submitted an inquiry for Modern 2 Bedroom Luxury Apartment.',
      type: 'new_inquiry',
      link: '/dashboard/landlord',
      isRead: true,
      createdAt: '2026-08-22T09:55:00.000Z'
    }
  ];

  const reviews: Review[] = [
    {
      id: 'rev_1',
      propertyId: 'prop_1',
      landlordId: 'usr_landlord_1',
      renterId: 'usr_renter_1',
      rating: 5,
      comment: 'Superb apartment! Reliable water reserve and standby generator were a lifesaver during power outages. Ato Abebe is a prompt, professional landlord.',
      createdAt: '2026-08-15T14:30:00.000Z'
    },
    {
      id: 'rev_2',
      propertyId: 'prop_3',
      landlordId: 'usr_landlord_1',
      renterId: 'usr_renter_2',
      rating: 5,
      comment: 'Very cozy studio in Kazanchis with high speed internet. Walking distance to UN ECA. Highly recommended.',
      createdAt: '2026-08-18T10:15:00.000Z'
    }
  ];

  return {
    users,
    properties,
    favorites,
    conversations,
    messages,
    inquiries,
    reports,
    notifications,
    reviews
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
      console.error('Error loading database from file, re-initializing with seed data:', e);
    }

    const initial = getInitialSeedData();
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

  public resetSeedData(): DatabaseData {
    const fresh = getInitialSeedData();
    this.data = fresh;
    this.persist();
    return fresh;
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
