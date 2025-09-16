const db = require('../database/config');

class Pact {
    constructor(data) {
        this.id = data.id;
        this.host_id = data.host_id;
        this.title = data.title;
        this.description = data.description;
        this.event_date = data.event_date;
        this.event_time = data.event_time;
        this.location = data.location;
        this.address = data.address;
        this.rsvp_deadline = data.rsvp_deadline;
        this.send_reminders = data.send_reminders;
        this.allow_plus_ones = data.allow_plus_ones;
        this.max_attendees = data.max_attendees;
        this.status = data.status;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Create a new pact
    static async create(data) {
        const {
            host_id,
            title,
            description,
            event_date,
            event_time,
            location,
            address,
            rsvp_deadline,
            send_reminders = true,
            allow_plus_ones = false,
            max_attendees
        } = data;

        const query = `
            INSERT INTO pacts (
                host_id, title, description, event_date, event_time, 
                location, address, rsvp_deadline, send_reminders, 
                allow_plus_ones, max_attendees
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const values = [
            host_id, title, description, event_date, event_time,
            location, address, rsvp_deadline, send_reminders,
            allow_plus_ones, max_attendees
        ];

        const result = await db.query(query, values);
        return new Pact(result.rows[0]);
    }

    // Find pact by ID
    static async findById(id) {
        const query = `
            SELECT p.*, u.name as host_name, u.email as host_email
            FROM pacts p
            JOIN users u ON p.host_id = u.id
            WHERE p.id = $1
        `;
        
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? new Pact(result.rows[0]) : null;
    }

    // Find pacts by host ID
    static async findByHostId(hostId, status = 'active') {
        const query = `
            SELECT p.*, 
                   COUNT(g.id) as total_guests,
                   COUNT(CASE WHEN r.response = 'confirmed' THEN 1 END) as confirmed_count,
                   COUNT(CASE WHEN r.response = 'declined' THEN 1 END) as declined_count,
                   COUNT(CASE WHEN r.response IS NULL THEN 1 END) as pending_count
            FROM pacts p
            LEFT JOIN guests g ON p.id = g.pact_id
            LEFT JOIN rsvps r ON g.id = r.guest_id
            WHERE p.host_id = $1 AND p.status = $2
            GROUP BY p.id
            ORDER BY p.event_date ASC
        `;
        
        const result = await db.query(query, [hostId, status]);
        return result.rows.map(row => new Pact(row));
    }

    // Find pacts where user is invited
    static async findByGuestEmail(email, status = 'active') {
        const query = `
            SELECT p.*, u.name as host_name, g.name as guest_name,
                   r.response, r.responded_at, r.plus_ones
            FROM pacts p
            JOIN users u ON p.host_id = u.id
            JOIN guests g ON p.id = g.pact_id
            LEFT JOIN rsvps r ON g.id = r.guest_id
            WHERE g.email = $1 AND p.status = $2
            ORDER BY p.event_date ASC
        `;
        
        const result = await db.query(query, [email, status]);
        return result.rows.map(row => new Pact(row));
    }

    // Update pact
    async update(updates) {
        const allowedFields = [
            'title', 'description', 'event_date', 'event_time',
            'location', 'address', 'rsvp_deadline', 'send_reminders',
            'allow_plus_ones', 'max_attendees', 'status'
        ];
        
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
            UPDATE pacts 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await db.query(query, values);
        return new Pact(result.rows[0]);
    }

    // Delete pact
    async delete() {
        const query = 'DELETE FROM pacts WHERE id = $1';
        await db.query(query, [this.id]);
    }

    // Cancel pact (soft delete)
    async cancel() {
        const query = `
            UPDATE pacts 
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        
        const result = await db.query(query, [this.id]);
        this.status = 'cancelled';
        return this;
    }

    // Add guests to pact
    async addGuests(guests) {
        if (!guests || guests.length === 0) return [];

        const values = guests.map(guest => [this.id, guest.name, guest.email]);
        const query = `
            INSERT INTO guests (pact_id, name, email)
            VALUES ${values.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ')}
            ON CONFLICT (pact_id, email) DO UPDATE SET
                name = EXCLUDED.name,
                invited_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        const flatValues = values.flat();
        const result = await db.query(query, flatValues);
        return result.rows;
    }

    // Get guests for this pact
    async getGuests() {
        const query = `
            SELECT g.*, r.response, r.responded_at, r.plus_ones, r.message
            FROM guests g
            LEFT JOIN rsvps r ON g.id = r.guest_id
            WHERE g.pact_id = $1
            ORDER BY g.name ASC
        `;
        
        const result = await db.query(query, [this.id]);
        return result.rows;
    }

    // Get RSVPs for this pact
    async getRSVPs() {
        const query = `
            SELECT r.*, g.name as guest_name, g.email as guest_email
            FROM rsvps r
            JOIN guests g ON r.guest_id = g.id
            WHERE r.pact_id = $1
            ORDER BY r.responded_at DESC
        `;
        
        const result = await db.query(query, [this.id]);
        return result.rows;
    }

    // Get RSVP statistics
    async getRSVPStats() {
        const query = `
            SELECT 
                COUNT(*) as total_invited,
                COUNT(CASE WHEN r.response = 'confirmed' THEN 1 END) as confirmed,
                COUNT(CASE WHEN r.response = 'declined' THEN 1 END) as declined,
                COUNT(CASE WHEN r.response IS NULL THEN 1 END) as pending,
                COALESCE(SUM(CASE WHEN r.response = 'confirmed' THEN 1 + r.plus_ones ELSE 0 END), 0) as total_attendees
            FROM guests g
            LEFT JOIN rsvps r ON g.id = r.guest_id
            WHERE g.pact_id = $1
        `;
        
        const result = await db.query(query, [this.id]);
        return result.rows[0];
    }

    // Check if user can access this pact
    async canAccess(userId, userEmail) {
        // Check if user is the host
        if (this.host_id === userId) return true;

        // Check if user is invited as a guest
        const query = `
            SELECT 1 FROM guests 
            WHERE pact_id = $1 AND email = $2
        `;
        
        const result = await db.query(query, [this.id, userEmail]);
        return result.rows.length > 0;
    }

    // Get upcoming pacts
    static async getUpcoming(limit = 10) {
        const query = `
            SELECT p.*, u.name as host_name,
                   COUNT(g.id) as total_guests,
                   COUNT(CASE WHEN r.response = 'confirmed' THEN 1 END) as confirmed_count
            FROM pacts p
            JOIN users u ON p.host_id = u.id
            LEFT JOIN guests g ON p.id = g.pact_id
            LEFT JOIN rsvps r ON g.id = r.guest_id
            WHERE p.status = 'active' AND p.event_date >= CURRENT_DATE
            GROUP BY p.id, u.name
            ORDER BY p.event_date ASC
            LIMIT $1
        `;
        
        const result = await db.query(query, [limit]);
        return result.rows.map(row => new Pact(row));
    }

    // Get pacts needing reminders
    static async getPactsNeedingReminders() {
        const query = `
            SELECT p.*, u.name as host_name, u.email as host_email
            FROM pacts p
            JOIN users u ON p.host_id = u.id
            WHERE p.status = 'active' 
            AND p.send_reminders = true
            AND p.event_date >= CURRENT_DATE
            AND p.event_date <= CURRENT_DATE + INTERVAL '24 hours'
        `;
        
        const result = await db.query(query);
        return result.rows.map(row => new Pact(row));
    }

    // Convert to JSON
    toJSON() {
        return {
            id: this.id,
            host_id: this.host_id,
            title: this.title,
            description: this.description,
            event_date: this.event_date,
            event_time: this.event_time,
            location: this.location,
            address: this.address,
            rsvp_deadline: this.rsvp_deadline,
            send_reminders: this.send_reminders,
            allow_plus_ones: this.allow_plus_ones,
            max_attendees: this.max_attendees,
            status: this.status,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = Pact;
