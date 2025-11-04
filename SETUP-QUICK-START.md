# 🚀 Quick Setup Guide - Kids Athletics Club

## One-Command Setup for New Subdomains

Perfect for setting up the application on a new subdomain after cloning from GitHub.

---

## 📋 Prerequisites

Before running the setup script, ensure:

1. **Server Access**: SSH access to your web server
2. **PostgreSQL Database**: Created and accessible
   - Database name
   - Database user
   - Database password
3. **Node.js 18+**: Installed on the server
4. **Git**: Configured with GitHub access

---

## 🎯 Quick Start

### Step 1: SSH into Your Server

```bash
ssh your-user@subdomain.hardweb.ro
```

### Step 2: Navigate to Web Directory

```bash
# For cPanel/shared hosting subdomains:
cd /home/youruser/public_html/subdomain

# For standard installations:
cd /var/www/subdomain
```

### Step 3: Clone Repository

```bash
git clone https://github.com/crstef/kids-athletics-club.git .
```

### Step 4: Run Setup Script

```bash
chmod +x setup-server.sh
./setup-server.sh
```

### Step 5: Follow Prompts

The script will ask you for:

1. **Domain/Subdomain** (auto-detected from path)
   - Example: `dev.clubatletism.ro`
   
2. **Database Credentials**
   - Host (default: `localhost`)
   - Port (default: `5432`)
   - Database name
   - Username
   - Password

3. **Application Port** (default: `5000`)

4. **Confirmations**
   - Initialize database schema
   - Run migrations
   - Initialize permissions

---

## ✅ What the Script Does

The setup script automates:

- ✅ **Environment Detection**: Auto-detects subdomain from directory path
- ✅ **Prerequisites Check**: Verifies Node.js, PostgreSQL, Git installation
- ✅ **Database Testing**: Tests connection before proceeding
- ✅ **Security**: Generates random JWT secret
- ✅ **Configuration**: Creates `.env.production` file
- ✅ **Dependencies**: Installs npm packages (root + server)
- ✅ **Database Setup**: Runs schema.sql, init-data.sql, and migrations
- ✅ **Directory Creation**: Creates tmp/, logs/, uploads/ directories
- ✅ **Web Server Config**: Sets up Passenger/.htaccess or PM2
- ✅ **Permissions Init**: Initializes roles and permissions via API
- ✅ **Health Checks**: Verifies application is responding
- ✅ **Logging**: Creates detailed setup log file

---

## 📊 Expected Output

```
╔═══════════════════════════════════════════════════════════════════════════╗
║         Kids Athletics Club - Server Setup Script                        ║
╚═══════════════════════════════════════════════════════════════════════════╝

==============================================================================
Checking Prerequisites
==============================================================================

✓ Node.js v18.20.0 detected
✓ npm 10.8.0 detected
✓ PostgreSQL client 14.5 detected
✓ Git 2.34.1 detected

==============================================================================
Detecting Environment
==============================================================================

Current directory: /home/user/public_html/dev
Detected subdomain from path: dev
Domain set to: dev.clubatletism.ro
Base URL: https://dev.clubatletism.ro

==============================================================================
Configuring Database
==============================================================================

✓ Database connection successful!

==============================================================================
Creating Environment Configuration
==============================================================================

✓ Environment file created at server/.env.production

... (continues with all setup steps)

==============================================================================
Setup Complete!
==============================================================================

✓ Kids Athletics Club setup completed successfully!

Configuration Summary:
  • Domain: dev.clubatletism.ro
  • Base URL: https://dev.clubatletism.ro
  • Database: your_db on localhost:5432
  • Application Directory: /home/user/public_html/dev

Default SuperAdmin Account:
  • Email: admin@clubatletism.ro
  • Password: admin123
  ⚠ IMPORTANT: Change this password immediately after first login!

Next Steps:
  1. Test: https://dev.clubatletism.ro
  2. Login and change admin password
  3. Future updates: git pull origin main && touch tmp/restart.txt
```

---

## 🔧 Troubleshooting

### Script Fails on Prerequisites

**Problem**: Node.js version too old

```bash
# Update Node.js (using nvm)
nvm install 18
nvm use 18
```

### Database Connection Fails

**Problem**: Wrong credentials or database doesn't exist

```bash
# Create database manually
createdb -U postgres your_db_name

# Or via psql
psql -U postgres
CREATE DATABASE your_db_name;
\q
```

### Permission Denied on Script

**Problem**: Script not executable

```bash
chmod +x setup-server.sh
```

### Port Already in Use

**Problem**: Default port 5000 occupied

- When prompted, enter a different port (e.g., 5001, 3000, etc.)

### Health Checks Fail

**Problem**: Application not responding immediately

- Wait 30-60 seconds and manually test:
  ```bash
  curl https://your-subdomain.hardweb.ro
  ```

---

## 📝 Files Created by Setup

After successful setup, you'll have:

```
/home/user/public_html/subdomain/
├── server/
│   └── .env.production          # Environment configuration
├── tmp/
│   └── restart.txt               # Passenger restart trigger
├── logs/                          # Application logs
├── uploads/
│   └── athletes/                 # User uploads
├── .deployment-backups/          # Future deployment backups
├── .htaccess                     # Apache/Passenger config
└── setup-YYYYMMDD_HHMMSS.log    # Setup log file
```

---

## 🎯 Post-Setup Tasks

### 1. Test Application

Visit your subdomain:
```
https://your-subdomain.hardweb.ro
```

### 2. Login as SuperAdmin

- Email: `admin@clubatletism.ro`
- Password: `admin123`

### 3. Change Admin Password

⚠️ **CRITICAL**: Change the default password immediately!

1. Login as admin
2. Go to profile settings
3. Update password
4. Logout and login with new password

### 4. Configure Custom Settings

- Add age categories
- Define custom probes
- Create coach accounts
- Configure specializations

---

## 🔄 Future Deployments

After initial setup, deploy updates with:

```bash
# SSH into server
ssh your-user@subdomain.hardweb.ro
cd /path/to/application

# Pull latest changes
git pull origin main

# Restart application
touch tmp/restart.txt  # Passenger
# OR
pm2 restart kids-athletics-club  # PM2
```

**For complex deployments with migrations, see:** [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)

---

## 📞 Support

- **Setup Log**: Check `setup-YYYYMMDD_HHMMSS.log` for detailed output
- **Application Logs**: `tail -f logs/production.log`
- **Documentation**: See README.md and DEPLOYMENT-GUIDE.md
- **Repository**: https://github.com/crstef/kids-athletics-club

---

## ⚡ Quick Command Reference

```bash
# Run setup
./setup-server.sh

# View setup log
tail -f setup-*.log

# Restart app (Passenger)
touch tmp/restart.txt

# Restart app (PM2)
pm2 restart kids-athletics-club

# View app logs
tail -f logs/production.log
pm2 logs kids-athletics-club

# Test health
curl https://your-subdomain.hardweb.ro/api/health

# Reset permissions
curl https://your-subdomain.hardweb.ro/api/setup/initialize-data?reset_permissions=true
```

---

## 🎉 Success!

Once setup is complete, you'll have a fully functional Kids Athletics Club installation ready for:

- ✅ User registration and management
- ✅ Athlete profiles and tracking
- ✅ Coach approval workflows
- ✅ Granular permissions system
- ✅ Performance monitoring
- ✅ File uploads (athlete avatars)
- ✅ Role-based dashboards

**Happy coaching! 🏃‍♂️⚡**
