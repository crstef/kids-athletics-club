# 🚀 Production Deployment Guide - Kids Athletics Club# Production Deployment Guide



**Last Updated:** October 20, 2025  This application is now production-ready with a Node.js backend and PostgreSQL database.

**Status:** ✅ Production Ready

## Architecture

---

- **Frontend**: React + TypeScript + Vite

## 📋 Overview- **Backend**: Node.js + Express + TypeScript

- **Database**: PostgreSQL

This is a **COMPLETE PRODUCTION-READY** multi-user application with:- **Authentication**: JWT-based

- ✅ React frontend with role-based dashboards

- ✅ Node.js/Express backend with 15+ API endpoints## Prerequisites

- ✅ PostgreSQL database with 10+ tables

- ✅ JWT authentication- Node.js 18+ and npm

- ✅ CORS configured for production- PostgreSQL 14+

- ✅ Error handling & logging- Git



**Deployment Time:** 30-50 minutes  ## Local Development Setup

**Estimated Cost:** $0 additional (uses your existing hosting resources)

### 1. Clone the Repository

---

```bash

## 🔧 Phase 1: Database Setup (PostgreSQL)git clone <repository-url>

cd kids-athletics-club

### Step 1: Access PostgreSQL```



Via hardweb.ro Control Panel → SQL Database Manager### 2. Install Dependencies



### Step 2: Initialize Database Schema```bash

# Install frontend dependencies

```bashnpm install

# Option A: Using pgAdmin or SQL interface in control panel

# Copy all contents from: server/schema.sql# Install backend dependencies

# Paste into SQL editor and executecd server

npm install

# Option B: Via command line (if SSH access available)cd ..

psql -h your-db-host \```

     -U your-db-user \

     -d kids_athletics \### 3. Set Up PostgreSQL Database

     -f server/schema.sql

```Make sure PostgreSQL is running on your system, then:



### Step 3: Verify Database```bash

# Create database and user

```bashsudo -u postgres psql

# Check tables createdCREATE DATABASE kids_athletics;

SELECT tablename FROM pg_tables CREATE USER athletics_user WITH ENCRYPTED PASSWORD 'your_password';

WHERE schemaname = 'public';GRANT ALL PRIVILEGES ON DATABASE kids_athletics TO athletics_user;

\q

# Should list: users, athletes, results, events, coaches, etc.```

```

### 4. Configure Environment Variables

---

```bash

## 🚀 Phase 2: Backend Deployment# Copy example env file

cp server/.env.example server/.env

### Step 1: Prepare Backend Files

# Edit server/.env with your database credentials

```bashnano server/.env

# Build backend```

cd server

npm installUpdate the following values in `server/.env`:

npm run build```

DB_HOST=localhost

# Verify dist/ folder createdDB_PORT=5432

ls -la dist/DB_NAME=kids_athletics

```DB_USER=athletics_user

DB_PASSWORD=your_password

### Step 2: Create Production EnvironmentJWT_SECRET=generate-a-strong-random-secret-key-here

```

Create file: `server/.env.production`

### 5. Initialize Database

```bash

PORT=3001```bash

NODE_ENV=production# Make the init script executable

DB_HOST=your-database-hostchmod +x init-db.sh

DB_PORT=5432

DB_NAME=kids_athletics# Run database initialization

DB_USER=your_db_user./init-db.sh

DB_PASSWORD=your_db_password```

JWT_SECRET=<generate-with: openssl rand -hex 32>

JWT_EXPIRES_IN=7dThis will:

FRONTEND_URL=https://hardweb.ro- Create all necessary tables

API_URL=https://api.hardweb.ro- Set up indexes and constraints

```- Insert default SuperAdmin user (admin@clubatletism.ro / admin123)

- Create default roles and permissions

**⚠️ Generate JWT Secret:**- Create default age categories and coach probes

```bash

openssl rand -hex 32### 6. Start Development Servers

# Copy output to JWT_SECRET above

``````bash

# Terminal 1: Start backend server

### Step 3: Deploy to Hostingcd server

npm run dev

**Via Control Panel - Advanced Installer Hub:**

# Terminal 2: Start frontend dev server

1. Navigate to **Advanced Installer Hub** → **Node.js App**cd ..

2. Create new Node.js applicationnpm run dev

3. Upload files from `server/dist/` directory```

4. Upload `.env.production` file

5. Set **Main Entry Point** to: `index.js`The application will be available at:

6. Copy environment variables from `.env.production` to control panel settings- Frontend: http://localhost:5173

7. Click **Start**- Backend API: http://localhost:3001



**Via FTP Upload:**## Production Deployment



1. Connect via FTP to your hosting### Option 1: Deploy to a VPS (Ubuntu/Debian)

2. Navigate to Node.js app directory (ask support)

3. Upload all files from `server/dist/`#### 1. Server Setup

4. Upload `.env.production`

5. Start via control panel```bash

# Update system

### Step 4: Verify Backendsudo apt update && sudo apt upgrade -y



```bash# Install Node.js

curl https://api.hardweb.ro/healthcurl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

sudo apt install -y nodejs

# Expected response:

{# Install PostgreSQL

  "status": "ok",sudo apt install -y postgresql postgresql-contrib

  "timestamp": "2025-10-20T10:00:00Z",

  "environment": "production"# Install Nginx

}sudo apt install -y nginx

```

# Install PM2 for process management

---sudo npm install -g pm2

```

## 💻 Phase 3: Frontend Deployment

#### 2. Database Setup

### Step 1: Create Production Environment

```bash

Create file: `.env.production`# Switch to postgres user

sudo -u postgres psql

```bash

VITE_API_URL=https://api.hardweb.ro/api# Create database and user

```CREATE DATABASE kids_athletics;

CREATE USER athletics_user WITH ENCRYPTED PASSWORD 'strong_password_here';

### Step 2: Build FrontendGRANT ALL PRIVILEGES ON DATABASE kids_athletics TO athletics_user;

\q

```bash```

# From root directory

npm run build#### 3. Clone and Setup Application



# Verify dist/ created with optimized bundles```bash

ls -la dist/# Clone repository

```git clone <repository-url>

cd kids-athletics-club

### Step 3: Deploy Files

# Install dependencies

**Via Control Panel - File Manager:**npm install

cd server && npm install && cd ..

1. Go to **Website Management** → **File Manager**

2. Navigate to `public_html/`# Configure environment

3. Delete any old filescp server/.env.example server/.env

4. Upload all files from `dist/` foldernano server/.env  # Edit with production values

5. Ensure `index.html` in root

# Initialize database

**Via FTP:**chmod +x init-db.sh

./init-db.sh

1. Connect to FTP

2. Navigate to `public_html/`# Build frontend

3. Upload all files from `dist/`npm run build



### Step 4: Configure SPA Routing# Build backend

cd server && npm run build && cd ..

Create file: `public_html/.htaccess````



```apache#### 4. Start Application with PM2

<IfModule mod_rewrite.c>

  RewriteEngine On```bash

  RewriteBase /# Start backend server

  RewriteCond %{REQUEST_FILENAME} !-fcd server

  RewriteCond %{REQUEST_FILENAME} !-dpm2 start dist/index.js --name kids-athletics-api

  RewriteRule ^ index.html [QSA,L]

</IfModule># Save PM2 process list

pm2 save

<IfModule mod_deflate.c>

  AddOutputFilterByType DEFLATE text/html# Setup PM2 to start on boot

  AddOutputFilterByType DEFLATE text/csspm2 startup

  AddOutputFilterByType DEFLATE text/javascript

  AddOutputFilterByType DEFLATE application/javascript# Go back to root

</IfModule>cd ..

```

<FilesMatch "\.(jpg|jpeg|png|gif|ico|css|js|svg|woff2)$">

  Header set Cache-Control "max-age=31536000, public"#### 5. Configure Nginx

</FilesMatch>

```bash

<FilesMatch "\.html$">sudo nano /etc/nginx/sites-available/kids-athletics

  Header set Cache-Control "max-age=3600, must-revalidate"```

</FilesMatch>

```Add this configuration:



### Step 5: Test Frontend```nginx

server {

1. Open browser: `https://hardweb.ro`    listen 80;

2. Should see login page    server_name your-domain.com;

3. Open Dev Tools (F12) → Console

4. Should see minimal warnings    # Frontend

    location / {

---        root /path/to/kids-athletics-club/dist;

        try_files $uri $uri/ /index.html;

## ✅ Integration Testing    }



### Test 1: API Connection    # Backend API

    location /api {

```bash        proxy_pass http://localhost:3001;

# Browser console        proxy_http_version 1.1;

fetch('https://api.hardweb.ro/health')        proxy_set_header Upgrade $http_upgrade;

  .then(r => r.json())        proxy_set_header Connection 'upgrade';

  .then(d => console.log(d))        proxy_set_header Host $host;

```        proxy_cache_bypass $http_upgrade;

    }

### Test 2: Login Flow}

```

1. Go to `https://hardweb.ro`

2. Try loginEnable the site:

3. Open Dev Tools → Network tab

4. Should see POST to `/api/auth/login` with 200 status```bash

sudo ln -s /etc/nginx/sites-available/kids-athletics /etc/nginx/sites-enabled/

### Test 3: Databasesudo nginx -t

sudo systemctl restart nginx

```bash```

psql -h $DB_HOST -U $DB_USER -d kids_athletics -c "SELECT COUNT(*) FROM users;"

```#### 6. Setup SSL with Let's Encrypt (Optional but Recommended)



---```bash

sudo apt install -y certbot python3-certbot-nginx

## 🔒 Security Configurationsudo certbot --nginx -d your-domain.com

```

### 1. Enable SSL/HTTPS

### Option 2: Deploy to Cloud Platforms

In Control Panel → Domain Setup → Enable AutoSSL

#### Heroku

### 2. Add Security Headers

```bash

Add to `.htaccess`:# Login to Heroku

heroku login

```apache

Header set X-Content-Type-Options "nosniff"# Create app

Header set X-Frame-Options "SAMEORIGIN"heroku create kids-athletics-app

Header set X-XSS-Protection "1; mode=block"

Header set Referrer-Policy "strict-origin-when-cross-origin"# Add PostgreSQL addon

```heroku addons:create heroku-postgresql:mini



### 3. Database Backups# Set environment variables

heroku config:set JWT_SECRET=your-secret-key

Control Panel → SQL Database Manager → Enable daily automatic backupsheroku config:set NODE_ENV=production



### 4. Monitor Logs# Create Procfile

echo "web: cd server && npm start" > Procfile

- Check backend error logs regularly

- Review browser console for frontend errors# Deploy

- Monitor database performancegit add .

git commit -m "Deploy to Heroku"

---git push heroku main



## 📊 Performance Metrics# Initialize database

heroku run ./init-db.sh

**Frontend Bundle (Optimized):**```

```

Main:           531 KB → 137 KB (gzipped)#### Railway.app

React vendors:   11 KB →   4 KB (gzipped)

UI components:   82 KB →  27 KB (gzipped)1. Connect your GitHub repository

Charts:         153 KB →  50 KB (gzipped)2. Add PostgreSQL plugin

Icons:          138 KB →  29 KB (gzipped)3. Set environment variables in Railway dashboard

CSS:            302 KB →  57 KB (gzipped)4. Deploy automatically on push

───────────────────────────────────

TOTAL (gzipped):      ~305 KB#### Render.com

```

1. Create a new Web Service

**Load Time:** ~2-3 seconds (depends on connection)2. Connect repository

3. Add PostgreSQL database

---4. Configure environment variables

5. Deploy

## 🐛 Troubleshooting

## Environment Variables Reference

| Issue | Solution |

|-------|----------|### Backend (.env)

| "Cannot reach API" | Check backend is running, verify FRONTEND_URL in CORS |

| "Login fails" | Verify JWT_SECRET, check database connection |```bash

| "Styling broken" | Clear cache, verify CSS files uploaded |PORT=3001                    # Server port

| "Backend crashes" | Check Node.js version, review logs, restart app |DB_HOST=localhost            # Database host

| "404 errors" | Ensure .htaccess properly configured for SPA routing |DB_PORT=5432                 # Database port

DB_NAME=kids_athletics       # Database name

---DB_USER=athletics_user       # Database user

DB_PASSWORD=your_password    # Database password

## 📝 Post-Deployment ChecklistJWT_SECRET=secret_key        # JWT secret key (generate a strong one!)

JWT_EXPIRES_IN=7d            # Token expiration time

- [ ] Frontend loads at `https://hardweb.ro`NODE_ENV=production          # Environment (development/production)

- [ ] Backend health check returns 200```

- [ ] Login page displays correctly

- [ ] Can login successfully## Default Credentials

- [ ] Database connection verified

- [ ] SSL/HTTPS enabledAfter initialization, you can login with:

- [ ] Backups configured

- [ ] Error logging active**SuperAdmin Account:**

- Email: `admin@clubatletism.ro`

---- Password: `admin123`



## 🎉 You're Live!⚠️ **IMPORTANT**: Change the SuperAdmin password immediately after first login!



Your application is now **PRODUCTION-READY** with:## API Endpoints

- ✅ Multi-user authentication

- ✅ Role-based access (Admin, Coach, Parent, Athlete)### Authentication

- ✅ Real-time data via PostgreSQL- `POST /api/auth/register` - Register new user

- ✅ Secure API with JWT- `POST /api/auth/login` - Login

- ✅ Optimized for performance- `POST /api/auth/logout` - Logout

- `GET /api/auth/me` - Get current user

**Support:** Contact hosting provider for infrastructure issues.

### Users

---- `GET /api/users` - Get all users

- `POST /api/users` - Create user (SuperAdmin)

Generated: October 20, 2025 | Version: 1.0.0 (Production Ready)- `PUT /api/users/:id` - Update user (SuperAdmin)

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
