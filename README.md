# PlanPact - Stop Flaky Plans, Start Making Pacts

PlanPact is a social planning application that eliminates "maybes" and creates firm commitments for your events. No more flaky friends or uncertain plans - just clear, reliable RSVPs.

## 🚀 Features

- **No More "Maybes"**: Guests must give a clear "I'm In" or "Can't Make It" response
- **Centralized Planning**: All event details, RSVPs, and updates in one place
- **Smart Reminders**: Automatic reminders to confirmed guests
- **Real-time Updates**: Live headcount and RSVP tracking
- **Email Notifications**: Send invitations and reminders via email
- **User Dashboard**: Manage all your pacts and invitations
- **Mobile Responsive**: Works perfectly on all devices

## 🛠️ Tech Stack

### Frontend
- **HTML5** with semantic markup
- **CSS3** with Tailwind CSS for styling
- **Vanilla JavaScript** for interactivity
- **Lucide Icons** for beautiful icons
- **Google Fonts** (Inter) for typography

### Backend
- **Node.js** with Express.js framework
- **PostgreSQL** database with comprehensive schema
- **JWT** authentication
- **bcrypt** for password hashing
- **nodemailer** for email notifications
- **UUID** for unique identifiers

## 📁 Project Structure

```
planpact/
├── index.html              # Landing page
├── login.html              # Authentication page
├── dashboard.html          # User dashboard
├── create-pact.html        # Pact creation form
├── pact-detail.html        # Individual pact details
├── pipeline.html           # How it works page
├── server.js               # Main server file
├── package.json            # Dependencies and scripts
├── env.example             # Environment variables template
├── database/
│   ├── schema.sql          # Database schema
│   └── config.js           # Database configuration
├── models/
│   ├── User.js             # User model
│   └── Pact.js             # Pact model
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- PostgreSQL (v12 or higher)
- Gmail account (for email notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/planpact.git
   cd planpact
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb planpact
   
   # Run the schema
   psql planpact < database/schema.sql
   ```

4. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-specific-password
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=planpact
   DB_PASSWORD=your-db-password
   DB_PORT=5432
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📧 Email Configuration

### Gmail Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in your `.env` file

### Other Email Providers

You can configure other SMTP providers by modifying the transporter configuration in `server.js`:

```javascript
const transporter = nodemailer.createTransporter({
    host: 'smtp.your-provider.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### User Management
- `GET /api/user/profile` - Get user profile

### Pacts
- `POST /api/pacts` - Create new pact
- `GET /api/pacts` - Get user's pacts
- `GET /api/pacts/:id` - Get specific pact
- `PUT /api/pacts/:id` - Update pact
- `DELETE /api/pacts/:id` - Delete pact

### RSVPs
- `POST /api/pacts/:id/rsvp` - Submit RSVP
- `GET /api/pacts/:id/rsvps` - Get pact RSVPs (host only)

### Health Check
- `GET /api/health` - Server health status

## 🗄️ Database Schema

### Tables

- **users** - User accounts and authentication
- **pacts** - Events/plans created by users
- **guests** - People invited to pacts
- **rsvps** - Responses to invitations
- **reminders** - Track sent reminders
- **notifications** - In-app notifications
- **user_preferences** - User settings and preferences

### Key Relationships

- Users can host multiple pacts
- Pacts can have multiple guests
- Guests can have one RSVP per pact
- Reminders are linked to specific pact-guest combinations

## 🎨 Frontend Features

### Landing Page (`index.html`)
- Hero section with compelling messaging
- Feature highlights
- User testimonials
- FAQ section
- Call-to-action buttons

### Authentication (`login.html`)
- Toggle between login and signup forms
- Form validation
- Social login placeholder
- Rotating motivational quotes

### Dashboard (`dashboard.html`)
- User statistics overview
- Quick action buttons
- List of created pacts
- Pending invitations
- RSVP management

### Pact Creation (`create-pact.html`)
- Comprehensive event form
- Guest management (individual and bulk)
- Settings and preferences
- Form validation

### Pact Details (`pact-detail.html`)
- Event information display
- RSVP interface for guests
- Guest list for hosts
- Statistics and actions

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Server-side validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Cross-origin request handling
- **Environment Variables**: Sensitive data protection

## 🚀 Deployment

### Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku app**
   ```bash
   heroku create your-planpact-app
   ```

3. **Set environment variables**
   ```bash
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set EMAIL_USER=your-email@gmail.com
   heroku config:set EMAIL_PASS=your-app-password
   heroku config:set DATABASE_URL=your-postgres-url
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run**
   ```bash
   docker build -t planpact .
   docker run -p 3000:3000 planpact
   ```

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Test Coverage
- Unit tests for models
- Integration tests for API endpoints
- End-to-end tests for user flows

## 📈 Performance Considerations

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: PostgreSQL connection management
- **Caching**: Consider Redis for session storage
- **CDN**: Static asset delivery optimization
- **Compression**: Gzip compression for responses

## 🔮 Future Enhancements

- [ ] Mobile app (React Native/Flutter)
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Payment integration for paid events
- [ ] Photo sharing for events
- [ ] Chat functionality
- [ ] Recurring events
- [ ] Event templates
- [ ] Advanced analytics
- [ ] Social media integration
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Use semantic commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide](https://lucide.dev/) for the beautiful icon set
- [Express.js](https://expressjs.com/) for the web framework
- [PostgreSQL](https://www.postgresql.org/) for the robust database
- [Nodemailer](https://nodemailer.com/) for email functionality

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

## 🔗 Links

- **Live Demo**: [https://your-planpact-app.herokuapp.com](https://your-planpact-app.herokuapp.com)
- **GitHub Repository**: [https://github.com/yourusername/planpact](https://github.com/yourusername/planpact)
- **Documentation**: [https://docs.planpact.com](https://docs.planpact.com)

---

Made with ❤️ by the PlanPact Team
