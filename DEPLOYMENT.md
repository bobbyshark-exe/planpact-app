# PlanPact Deployment Guide

This guide covers various deployment options for PlanPact.

## 🚀 Quick Deployment Options

### 1. Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

### 2. Heroku (Recommended for beginners)

#### Prerequisites
- Heroku account
- Heroku CLI installed
- PostgreSQL database (Heroku Postgres addon)

#### Steps

1. **Create Heroku app**
   ```bash
   heroku create your-planpact-app
   ```

2. **Add PostgreSQL database**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

3. **Set environment variables**
   ```bash
   heroku config:set JWT_SECRET=your-super-secret-jwt-key
   heroku config:set EMAIL_USER=your-email@gmail.com
   heroku config:set EMAIL_PASS=your-app-specific-password
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Run database migrations**
   ```bash
   heroku run psql $DATABASE_URL < database/schema.sql
   ```

### 3. DigitalOcean App Platform

1. **Connect GitHub repository**
2. **Configure environment variables**
3. **Set build command**: `npm install`
4. **Set run command**: `npm start`
5. **Add PostgreSQL database**

### 4. Railway

1. **Connect GitHub repository**
2. **Add PostgreSQL service**
3. **Configure environment variables**
4. **Deploy automatically**

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Build and Run
```bash
# Build image
docker build -t planpact .

# Run container
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -e EMAIL_USER=your-email@gmail.com \
  -e EMAIL_PASS=your-password \
  -e DATABASE_URL=postgresql://user:pass@host:port/db \
  planpact
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - JWT_SECRET=your-secret
      - EMAIL_USER=your-email@gmail.com
      - EMAIL_PASS=your-password
      - DATABASE_URL=postgresql://postgres:password@db:5432/planpact
    depends_on:
      - db

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=planpact
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## ☁️ Cloud Provider Deployment

### AWS EC2

1. **Launch EC2 instance** (Ubuntu 20.04 LTS)
2. **Install Node.js and PostgreSQL**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib
   ```

3. **Set up database**
   ```bash
   sudo -u postgres createdb planpact
   sudo -u postgres psql planpact < database/schema.sql
   ```

4. **Deploy application**
   ```bash
   git clone https://github.com/yourusername/planpact.git
   cd planpact
   npm install
   cp env.example .env
   # Edit .env
   npm start
   ```

5. **Set up PM2 for process management**
   ```bash
   npm install -g pm2
   pm2 start server.js --name planpact
   pm2 startup
   pm2 save
   ```

### Google Cloud Platform

1. **Create Compute Engine instance**
2. **Install dependencies** (same as AWS)
3. **Deploy using Cloud Build**
4. **Set up Cloud SQL for PostgreSQL**

### Azure

1. **Create App Service**
2. **Connect to Azure Database for PostgreSQL**
3. **Configure environment variables**
4. **Deploy from GitHub**

## 🔧 Production Configuration

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secure-jwt-secret
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-app-specific-password
DATABASE_URL=postgresql://user:password@host:port/database
FRONTEND_URL=https://your-domain.com
```

### Security Considerations

1. **Use HTTPS** in production
2. **Set secure JWT secret** (minimum 32 characters)
3. **Configure CORS** properly
4. **Use environment variables** for sensitive data
5. **Enable database SSL** connections
6. **Set up monitoring** and logging
7. **Regular security updates**

### Performance Optimization

1. **Enable gzip compression**
2. **Set up CDN** for static assets
3. **Configure database connection pooling**
4. **Implement caching** (Redis)
5. **Set up load balancing** for high traffic

## 📊 Monitoring and Logging

### Application Monitoring

```javascript
// Add to server.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Health Checks

```javascript
// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "your-planpact-app"
        heroku_email: "your-email@example.com"
```

## 🚨 Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check database credentials
   - Verify database is running
   - Check network connectivity

2. **Email not sending**
   - Verify email credentials
   - Check Gmail app password
   - Test SMTP settings

3. **JWT token invalid**
   - Check JWT_SECRET environment variable
   - Verify token expiration
   - Check token format

4. **CORS errors**
   - Configure CORS properly
   - Check frontend URL settings
   - Verify allowed origins

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm start

# Check environment variables
node -e "console.log(process.env)"
```

## 📈 Scaling

### Horizontal Scaling

1. **Load Balancer** (nginx, HAProxy)
2. **Multiple App Instances**
3. **Database Read Replicas**
4. **Redis Session Store**

### Vertical Scaling

1. **Increase Server Resources**
2. **Database Connection Pooling**
3. **Memory Optimization**
4. **CPU Optimization**

## 🔐 SSL/TLS Setup

### Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📞 Support

For deployment issues:

1. **Check logs** for error messages
2. **Verify environment variables**
3. **Test database connectivity**
4. **Check email configuration**
5. **Review security settings**

---

This deployment guide should help you get PlanPact running in production. Choose the deployment method that best fits your needs and infrastructure.
