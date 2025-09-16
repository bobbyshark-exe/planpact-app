const request = require('supertest');
const app = require('../server');

describe('PlanPact API Tests', () => {
    let authToken;
    let testUser;

    describe('Health Check', () => {
        it('should return health status', async () => {
            const res = await request(app)
                .get('/api/health')
                .expect(200);
            
            expect(res.body.status).toBe('OK');
            expect(res.body.message).toBe('PlanPact API is running');
        });
    });

    describe('Authentication', () => {
        it('should register a new user', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(res.body.message).toBe('User created successfully');
            expect(res.body.user.email).toBe(userData.email);
            expect(res.body.token).toBeDefined();
            
            authToken = res.body.token;
            testUser = res.body.user;
        });

        it('should login existing user', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const res = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            expect(res.body.message).toBe('Login successful');
            expect(res.body.user.email).toBe(loginData.email);
            expect(res.body.token).toBeDefined();
        });

        it('should reject invalid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);
        });
    });

    describe('User Profile', () => {
        it('should get user profile with valid token', async () => {
            const res = await request(app)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(res.body.email).toBe('test@example.com');
            expect(res.body.name).toBe('Test User');
        });

        it('should reject request without token', async () => {
            await request(app)
                .get('/api/user/profile')
                .expect(401);
        });
    });

    describe('Pacts', () => {
        let pactId;

        it('should create a new pact', async () => {
            const pactData = {
                title: 'Test BBQ',
                description: 'A test BBQ event',
                date: '2025-04-01',
                time: '14:00',
                location: 'Central Park',
                address: 'Central Park, New York',
                sendReminders: true,
                allowPlusOnes: false,
                guests: [
                    { name: 'Guest One', email: 'guest1@example.com' },
                    { name: 'Guest Two', email: 'guest2@example.com' }
                ]
            };

            const res = await request(app)
                .post('/api/pacts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(pactData)
                .expect(201);

            expect(res.body.message).toBe('Pact created successfully');
            expect(res.body.pact.title).toBe(pactData.title);
            expect(res.body.pact.guests).toHaveLength(2);
            
            pactId = res.body.pact.id;
        });

        it('should get user pacts', async () => {
            const res = await request(app)
                .get('/api/pacts')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });

        it('should get specific pact', async () => {
            const res = await request(app)
                .get(`/api/pacts/${pactId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(res.body.id).toBe(pactId);
            expect(res.body.title).toBe('Test BBQ');
        });

        it('should update pact', async () => {
            const updateData = {
                title: 'Updated Test BBQ',
                description: 'Updated description'
            };

            const res = await request(app)
                .put(`/api/pacts/${pactId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(res.body.message).toBe('Pact updated successfully');
            expect(res.body.pact.title).toBe('Updated Test BBQ');
        });

        it('should delete pact', async () => {
            await request(app)
                .delete(`/api/pacts/${pactId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('RSVPs', () => {
        let testPactId;

        beforeEach(async () => {
            // Create a test pact for RSVP testing
            const pactData = {
                title: 'RSVP Test Event',
                description: 'Testing RSVP functionality',
                date: '2025-04-15',
                time: '18:00',
                location: 'Test Location',
                guests: [
                    { name: 'RSVP Guest', email: 'rsvp@example.com' }
                ]
            };

            const res = await request(app)
                .post('/api/pacts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(pactData);

            testPactId = res.body.pact.id;
        });

        it('should submit RSVP confirmation', async () => {
            const rsvpData = {
                response: 'confirmed',
                plusOnes: 1
            };

            const res = await request(app)
                .post(`/api/pacts/${testPactId}/rsvp`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(rsvpData)
                .expect(200);

            expect(res.body.message).toBe('RSVP recorded successfully');
            expect(res.body.rsvp.response).toBe('confirmed');
        });

        it('should submit RSVP decline', async () => {
            const rsvpData = {
                response: 'declined',
                plusOnes: 0
            };

            const res = await request(app)
                .post(`/api/pacts/${testPactId}/rsvp`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(rsvpData)
                .expect(200);

            expect(res.body.message).toBe('RSVP recorded successfully');
            expect(res.body.rsvp.response).toBe('declined');
        });

        it('should get pact RSVPs (host only)', async () => {
            const res = await request(app)
                .get(`/api/pacts/${testPactId}/rsvps`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid pact ID', async () => {
            await request(app)
                .get('/api/pacts/invalid-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should handle unauthorized access', async () => {
            await request(app)
                .get('/api/pacts')
                .expect(401);
        });

        it('should validate required fields', async () => {
            const invalidPactData = {
                // Missing required fields
                description: 'Missing title and date'
            };

            await request(app)
                .post('/api/pacts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidPactData)
                .expect(400);
        });
    });
});

describe('Frontend Routes', () => {
    it('should serve landing page', async () => {
        await request(app)
            .get('/')
            .expect(200);
    });

    it('should serve login page', async () => {
        await request(app)
            .get('/login')
            .expect(200);
    });

    it('should serve dashboard page', async () => {
        await request(app)
            .get('/dashboard')
            .expect(200);
    });

    it('should serve create pact page', async () => {
        await request(app)
            .get('/create-pact')
            .expect(200);
    });

    it('should serve pact detail page', async () => {
        await request(app)
            .get('/pact-detail')
            .expect(200);
    });

    it('should serve pipeline page', async () => {
        await request(app)
            .get('/pipeline')
            .expect(200);
    });
});
