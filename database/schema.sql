-- PlanPact Database Schema
-- This file contains the SQL schema for PostgreSQL database

-- Create database (run this separately)
-- CREATE DATABASE planpact;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Pacts table (events/plans)
CREATE TABLE IF NOT EXISTS pacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT,
    rsvp_deadline TIMESTAMP WITH TIME ZONE,
    send_reminders BOOLEAN DEFAULT true,
    allow_plus_ones BOOLEAN DEFAULT false,
    max_attendees INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Guests table (people invited to pacts)
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pact_id UUID NOT NULL REFERENCES pacts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    invitation_sent BOOLEAN DEFAULT false,
    invitation_opened BOOLEAN DEFAULT false,
    UNIQUE(pact_id, email)
);

-- RSVPs table (responses to invitations)
CREATE TABLE IF NOT EXISTS rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pact_id UUID NOT NULL REFERENCES pacts(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    response VARCHAR(20) NOT NULL CHECK (response IN ('confirmed', 'declined', 'pending')),
    plus_ones INTEGER DEFAULT 0,
    message TEXT,
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pact_id, guest_id)
);

-- Reminders table (track sent reminders)
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pact_id UUID NOT NULL REFERENCES pacts(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('invitation', 'event_reminder', 'rsvp_reminder')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email_status VARCHAR(20) DEFAULT 'sent' CHECK (email_status IN ('sent', 'delivered', 'opened', 'failed'))
);

-- Notifications table (in-app notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pact_id UUID REFERENCES pacts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    reminder_frequency INTEGER DEFAULT 24, -- hours before event
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_pacts_host_id ON pacts(host_id);
CREATE INDEX IF NOT EXISTS idx_pacts_event_date ON pacts(event_date);
CREATE INDEX IF NOT EXISTS idx_pacts_status ON pacts(status);
CREATE INDEX IF NOT EXISTS idx_guests_pact_id ON guests(pact_id);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_rsvps_pact_id ON rsvps(pact_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_id ON rsvps(guest_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_response ON rsvps(response);
CREATE INDEX IF NOT EXISTS idx_reminders_pact_id ON reminders(pact_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pacts_updated_at BEFORE UPDATE ON pacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON rsvps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development
INSERT INTO users (name, email, password_hash) VALUES 
('John Doe', 'john@example.com', '$2b$10$example.hash.for.development'),
('Jane Smith', 'jane@example.com', '$2b$10$example.hash.for.development'),
('Mike Johnson', 'mike@example.com', '$2b$10$example.hash.for.development');

-- Get the user IDs for sample data
DO $$
DECLARE
    john_id UUID;
    jane_id UUID;
    mike_id UUID;
BEGIN
    SELECT id INTO john_id FROM users WHERE email = 'john@example.com';
    SELECT id INTO jane_id FROM users WHERE email = 'jane@example.com';
    SELECT id INTO mike_id FROM users WHERE email = 'mike@example.com';
    
    -- Sample pacts
    INSERT INTO pacts (host_id, title, description, event_date, event_time, location, address, rsvp_deadline, send_reminders, allow_plus_ones) VALUES
    (john_id, 'Weekend BBQ at Central Park', 'Join us for a fun BBQ in Central Park! We''ll have burgers, hot dogs, and all the fixings. Bring your appetite and a blanket to sit on.', '2025-03-15', '14:00:00', 'Central Park, New York', 'Central Park, New York, NY 10024', '2025-03-14 23:59:59', true, true),
    (jane_id, 'Book Club Meeting', 'Monthly book club discussion. This month we''re reading "The Midnight Library" by Matt Haig. Coffee and light snacks provided.', '2025-03-20', '19:00:00', 'Sarah''s Coffee Shop', '123 Coffee St, New York, NY 10001', '2025-03-19 23:59:59', true, false),
    (mike_id, 'Birthday Party - Mike''s 30th', 'Celebrate Mike''s 30th birthday with drinks, dancing, and great company! Dress code: Smart casual. There will be a bar tab for the first 2 hours.', '2025-03-22', '20:00:00', 'The Rooftop Bar, Downtown', '456 Rooftop Ave, New York, NY 10002', '2025-03-21 23:59:59', true, true);
END $$;
