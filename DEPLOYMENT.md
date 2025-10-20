# Production Deployment Guide

This application is now production-ready with a Node.js backend and PostgreSQL database.

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT-based

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd kids-athletics-club
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Set Up PostgreSQL Database

Make sure PostgreSQL is running on your system, then:

```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE kids_athletics;
CREATE USER athletics_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE kids_athletics TO athletics_user;
\q
```

### 4. Configure Environment Variables

```bash
# Copy example env file
cp server/.env.example server/.env

# Edit server/.env with your database credentials
nano server/.env
```

Update the following values in `server/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kids_athletics
DB_USER=athletics_user
DB_PASSWORD=your_password
JWT_SECRET=generate-a-strong-random-secret-key-here
```

### 5. Initialize Database

```bash
# Make the init script executable
chmod +x init-db.sh

# Run database initialization
./init-db.sh
```

This will:
- Create all necessary tables
- Set up indexes and constraints
- Insert default SuperAdmin user (admin@clubatletism.ro / admin123)
- Create default roles and permissions
- Create default age categories and coach probes

### 6. Start Development Servers

```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend dev server
cd ..
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Production Deployment

### Option 1: Deploy to a VPS (Ubuntu/Debian)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE kids_athletics;
CREATE USER athletics_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE kids_athletics TO athletics_user;
\q
```

#### 3. Clone and Setup Application

```bash
# Clone repository
git clone <repository-url>
cd kids-athletics-club

# Install dependencies
npm install
cd server && npm install && cd ..

# Configure environment
cp server/.env.example server/.env
nano server/.env  # Edit with production values

# Initialize database
chmod +x init-db.sh
./init-db.sh

# Build frontend
npm run build

# Build backend
cd server && npm run build && cd ..
```

#### 4. Start Application with PM2

```bash
# Start backend server
cd server
pm2 start dist/index.js --name kids-athletics-api

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Go back to root
cd ..
```

#### 5. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/kids-athletics
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/kids-athletics-club/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/kids-athletics /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: Deploy to Cloud Platforms

#### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create kids-athletics-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# Create Procfile
echo "web: cd server && npm start" > Procfile

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# Initialize database
heroku run ./init-db.sh
```

#### Railway.app

1. Connect your GitHub repository
2. Add PostgreSQL plugin
3. Set environment variables in Railway dashboard
4. Deploy automatically on push

#### Render.com

1. Create a new Web Service
2. Connect repository
3. Add PostgreSQL database
4. Configure environment variables
5. Deploy

## Environment Variables Reference

### Backend (.env)

```bash
PORT=3001                    # Server port
DB_HOST=localhost            # Database host
DB_PORT=5432                 # Database port
DB_NAME=kids_athletics       # Database name
DB_USER=athletics_user       # Database user
DB_PASSWORD=your_password    # Database password
JWT_SECRET=secret_key        # JWT secret key (generate a strong one!)
JWT_EXPIRES_IN=7d            # Token expiration time
NODE_ENV=production          # Environment (development/production)
```

## Default Credentials

After initialization, you can login with:

**SuperAdmin Account:**
- Email: `admin@clubatletism.ro`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the SuperAdmin password immediately after first login!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user (SuperAdmin)
- `PUT /api/users/:id` - Update user (SuperAdmin)
- `DELETE /api/users/:id` - Delete user (SuperAdmin)

### Athletes
- `GET /api/athletes` - Get all athletes
- `POST /api/athletes` - Create athlete
- `PUT /api/athletes/:id` - Update athlete
- `DELETE /api/athletes/:id` - Delete athlete

### Results
- `GET /api/results` - Get all results
- `POST /api/results` - Create result
- `DELETE /api/results/:id` - Delete result

### Other Endpoints
- Events: `/api/events`
- Access Requests: `/api/access-requests`
- Messages: `/api/messages`
- Permissions: `/api/permissions`
- Roles: `/api/roles`
- Approval Requests: `/api/approval-requests`
- Age Categories: `/api/age-categories`
- Probes: `/api/probes`
- User Permissions: `/api/user-permissions`

## Security Considerations

1. **Change Default Passwords**: Immediately change the SuperAdmin password
2. **Use Strong JWT Secret**: Generate a strong random secret for JWT_SECRET
3. **Enable HTTPS**: Always use HTTPS in production
4. **Database Security**: Use strong database passwords and restrict access
5. **Environment Variables**: Never commit `.env` files to version control
6. **Rate Limiting**: Consider adding rate limiting middleware
7. **Input Validation**: All inputs are validated server-side
8. **SQL Injection Protection**: Using parameterized queries

## Monitoring and Maintenance

### View Logs

```bash
# PM2 logs
pm2 logs kids-athletics-api

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Backup

```bash
# Backup
pg_dump -U athletics_user kids_athletics > backup_$(date +%Y%m%d).sql

# Restore
psql -U athletics_user kids_athletics < backup_20231020.sql
```

### Update Application

```bash
git pull origin main
npm install
cd server && npm install && cd ..
npm run build
cd server && npm run build && cd ..
pm2 restart kids-athletics-api
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check database connection
psql -U athletics_user -d kids_athletics -h localhost
```

### Backend Not Starting

```bash
# Check PM2 status
pm2 status

# View PM2 logs
pm2 logs kids-athletics-api

# Restart
pm2 restart kids-athletics-api
```

### Frontend Build Issues

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Support

For issues and questions, please contact the development team or create an issue in the repository.

## License

Private - All rights reserved
