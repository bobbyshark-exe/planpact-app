const db = require('../database/config');
const bcrypt = require('bcrypt');

class User {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.email = data.email;
        this.password_hash = data.password_hash;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.is_active = data.is_active;
        this.email_verified = data.email_verified;
        this.last_login = data.last_login;
    }

    // Create a new user
    static async create({ name, email, password }) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const query = `
                INSERT INTO users (name, email, password_hash)
                VALUES ($1, $2, $3)
                RETURNING id, name, email, created_at, is_active, email_verified
            `;
            
            const result = await db.query(query, [name, email, hashedPassword]);
            return new User(result.rows[0]);
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                throw new Error('User with this email already exists');
            }
            throw error;
        }
    }

    // Find user by email
    static async findByEmail(email) {
        const query = `
            SELECT id, name, email, password_hash, created_at, updated_at, 
                   is_active, email_verified, last_login
            FROM users 
            WHERE email = $1
        `;
        
        const result = await db.query(query, [email]);
        return result.rows.length > 0 ? new User(result.rows[0]) : null;
    }

    // Find user by ID
    static async findById(id) {
        const query = `
            SELECT id, name, email, password_hash, created_at, updated_at, 
                   is_active, email_verified, last_login
            FROM users 
            WHERE id = $1
        `;
        
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? new User(result.rows[0]) : null;
    }

    // Verify password
    async verifyPassword(password) {
        return await bcrypt.compare(password, this.password_hash);
    }

    // Update user
    async update(updates) {
        const allowedFields = ['name', 'email', 'is_active', 'email_verified'];
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (updateFields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(this.id);
        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await db.query(query, values);
        return new User(result.rows[0]);
    }

    // Update last login
    async updateLastLogin() {
        const query = `
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP
            WHERE id = $1
        `;
        
        await db.query(query, [this.id]);
        this.last_login = new Date();
    }

    // Delete user (soft delete)
    async delete() {
        const query = `
            UPDATE users 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `;
        
        await db.query(query, [this.id]);
        this.is_active = false;
    }

    // Get user's pacts
    async getPacts() {
        const query = `
            SELECT p.*, 
                   COUNT(g.id) as total_guests,
                   COUNT(r.id) as total_rsvps,
                   COUNT(CASE WHEN r.response = 'confirmed' THEN 1 END) as confirmed_rsvps
            FROM pacts p
            LEFT JOIN guests g ON p.id = g.pact_id
            LEFT JOIN rsvps r ON g.id = r.guest_id
            WHERE p.host_id = $1 AND p.status = 'active'
            GROUP BY p.id
            ORDER BY p.event_date ASC
        `;
        
        const result = await db.query(query, [this.id]);
        return result.rows;
    }

    // Get user's invitations
    async getInvitations() {
        const query = `
            SELECT p.*, g.name as guest_name, g.email as guest_email,
                   r.response, r.responded_at, r.plus_ones
            FROM pacts p
            JOIN guests g ON p.id = g.pact_id
            LEFT JOIN rsvps r ON g.id = r.guest_id
            WHERE g.email = $1 AND p.status = 'active'
            ORDER BY p.event_date ASC
        `;
        
        const result = await db.query(query, [this.email]);
        return result.rows;
    }

    // Get user's notifications
    async getNotifications(limit = 50, offset = 0) {
        const query = `
            SELECT n.*, p.title as pact_title
            FROM notifications n
            LEFT JOIN pacts p ON n.pact_id = p.id
            WHERE n.user_id = $1
            ORDER BY n.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await db.query(query, [this.id, limit, offset]);
        return result.rows;
    }

    // Mark notifications as read
    async markNotificationsAsRead(notificationIds) {
        if (!notificationIds || notificationIds.length === 0) return;
        
        const placeholders = notificationIds.map((_, index) => `$${index + 2}`).join(',');
        const query = `
            UPDATE notifications 
            SET is_read = true, read_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND id IN (${placeholders})
        `;
        
        await db.query(query, [this.id, ...notificationIds]);
    }

    // Get user statistics
    async getStats() {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM pacts WHERE host_id = $1 AND status = 'active') as hosted_pacts,
                (SELECT COUNT(*) FROM guests g 
                 JOIN pacts p ON g.pact_id = p.id 
                 WHERE g.email = $2 AND p.status = 'active') as total_invitations,
                (SELECT COUNT(*) FROM guests g 
                 JOIN pacts p ON g.pact_id = p.id 
                 JOIN rsvps r ON g.id = r.guest_id 
                 WHERE g.email = $2 AND r.response = 'confirmed' AND p.status = 'active') as confirmed_rsvps,
                (SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false) as unread_notifications
        `;
        
        const result = await db.query(query, [this.id, this.email]);
        return result.rows[0];
    }

    // Convert to JSON (exclude sensitive data)
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            created_at: this.created_at,
            updated_at: this.updated_at,
            is_active: this.is_active,
            email_verified: this.email_verified,
            last_login: this.last_login
        };
    }
}

module.exports = User;
