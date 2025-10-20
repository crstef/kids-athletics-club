# ⚡ QUICK START GUIDE - PRODUCTION DEPLOYMENT

**Time to Production:** 30-50 minutes  
**Complexity:** Low (follow steps exactly)

---

## 🚀 3-STEP DEPLOYMENT

### STEP 1: Database (5 min)
```
1. Open hardweb.ro Control Panel → SQL Database Manager
2. Open SQL Editor
3. Paste contents of: server/schema.sql
4. Execute
5. Done ✅
```

### STEP 2: Backend (15 min)
```
1. Open Control Panel → Advanced Installer Hub → Node.js App
2. Create new Node.js application
3. Upload files from: server/dist/
4. Upload file: server/.env.production (with your values!)
5. Set Main Entry Point: index.js
6. Copy env variables from .env.production to control panel
7. Click Start
8. Verify: curl https://api.hardweb.ro/health
9. Done ✅
```

### STEP 3: Frontend (10 min)
```
1. Open Control Panel → File Manager
2. Navigate to: public_html/
3. Delete old files (if any)
4. Upload all files from: dist/
5. Upload .htaccess file (see below)
6. Done ✅
```

---

## 📝 .htaccess (Copy & Paste)

Create file in `public_html/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [QSA,L]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/javascript
</IfModule>

<FilesMatch "\.(jpg|css|js|svg|woff2)$">
  Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
```

---

## 🔐 Environment Variables

### Frontend: `.env.production`
```
VITE_API_URL=https://api.hardweb.ro/api
```

### Backend: `server/.env.production`
```
PORT=3001
NODE_ENV=production
DB_HOST=<your-host>
DB_PORT=5432
DB_NAME=kids_athletics
DB_USER=<your-user>
DB_PASSWORD=<your-password>
JWT_SECRET=<generate: openssl rand -hex 32>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://hardweb.ro
API_URL=https://api.hardweb.ro
```

---

## ✅ TEST IT

1. Open: `https://hardweb.ro`
   - Should see login page ✅

2. Open Dev Console (F12)
   - Check Network tab
   - Try login
   - Should see POST to `/api/auth/login`

3. Test API directly:
   ```
   curl https://api.hardweb.ro/health
   ```
   Should return: `{"status":"ok",...}`

---

## 🎯 YOU'RE DONE! 🎉

Your app is now **LIVE** and **PRODUCTION-READY**!

**Features available:**
- Multi-user login
- Role-based dashboards (Admin, Coach, Parent, Athlete)
- Athlete management
- Results tracking
- Performance analytics
- Secure data isolation

**Need help?** See `DEPLOYMENT.md` for detailed troubleshooting.

---

Generated: October 20, 2025
