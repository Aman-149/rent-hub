-- RentHub Database Schema (PostgreSQL)
-- Table definitions with foreign keys, indexes, and constraints

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('renter', 'landlord', 'admin')),
    phone VARCHAR(40),
    avatar VARCHAR(500),
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(64) PRIMARY KEY,
    landlord_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('Apartment', 'House', 'Villa', 'Studio', 'Condominium', 'Room')),
    price NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETB',
    city VARCHAR(100) NOT NULL DEFAULT 'Addis Ababa',
    neighborhood VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    bedrooms INTEGER NOT NULL DEFAULT 1,
    bathrooms INTEGER NOT NULL DEFAULT 1,
    size_sqft INTEGER,
    is_furnished BOOLEAN DEFAULT FALSE,
    available_from DATE DEFAULT CURRENT_DATE,
    contact_preference VARCHAR(50) DEFAULT 'Platform Chat',
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'rented', 'pending_approval', 'archived')),
    views_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS property_images (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    caption VARCHAR(200),
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS amenities (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(80) UNIQUE NOT NULL,
    icon_name VARCHAR(50),
    category VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS property_amenities (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amenity_name VARCHAR(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, property_id)
);

CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) REFERENCES properties(id) ON DELETE SET NULL,
    landlord_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    renter_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inquiries (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    renter_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    preferred_viewing_date DATE,
    preferred_contact_time VARCHAR(100),
    status VARCHAR(40) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'viewing_scheduled', 'approved', 'rejected', 'closed')),
    landlord_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS property_views (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    viewer_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reporter_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(80) NOT NULL,
    details TEXT,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_city_neighborhood ON properties(city, neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_landlord ON inquiries(landlord_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_renter ON inquiries(renter_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
