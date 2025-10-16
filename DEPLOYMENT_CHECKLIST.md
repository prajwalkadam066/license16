# 📋 cPanel Deployment Quick Checklist

## Before You Start
- [ ] MySQL credentials from cPanel ready
- [ ] Domain/subdomain configured
- [ ] cPanel login access confirmed
- [ ] Node.js support available on hosting (check with provider)

## Step 1: Build Frontend
```bash
npm run build
```
- [ ] Build completed successfully
- [ ] `dist` folder created

## Step 2: Prepare Backend Package
Create a ZIP file with:
- [ ] `server/` folder
- [ ] `package.json`
- [ ] `package-lock.json`
- [ ] `.env.example` (rename to `.env` after upload)

## Step 3: Database Setup in cPanel
- [ ] Create MySQL database (e.g., `lms_production`)
- [ ] Create MySQL user
- [ ] Add user to database with ALL PRIVILEGES
- [ ] Import database schema (export from current DB)
- [ ] Save credentials:
  ```
  DB_HOST: localhost
  DB_USER: yourusername_lms_user
  DB_PASSWORD: ___________
  DB_NAME: yourusername_lms_production
  ```

## Step 4: Frontend Deployment
- [ ] Upload contents of `dist/` to `public_html/`
- [ ] Create/upload `.htaccess` file (use `public_html.htaccess`)
- [ ] Verify `index.html` exists in `public_html/`

## Step 5: Backend Deployment
- [ ] Create folder: `/home/yourusername/lms_backend`
- [ ] Upload and extract backend ZIP
- [ ] Update `.env` with database credentials
- [ ] Set PORT to 49152-65535 range

## Step 6: Configure Node.js in cPanel
Go to "Setup Node.js App":
- [ ] Node.js version: 18.x or 20.x
- [ ] Application mode: Production
- [ ] Application root: `lms_backend`
- [ ] Application startup file: `server/index.ts`
- [ ] Click "Create"

## Step 7: Install Dependencies
- [ ] Click "Run NPM Install"
- [ ] Wait for success message
- [ ] If fails, use SSH method (see main guide)

## Step 8: Start Application
- [ ] Click "Start Application"
- [ ] Status shows "Running"
- [ ] Check logs for errors

## Step 9: Testing
- [ ] Frontend loads: `https://yourdomain.com/lms`
- [ ] API responds: `https://yourdomain.com/api`
- [ ] Login works
- [ ] Dashboard displays data
- [ ] Can create new license
- [ ] Vendor names display correctly

## Step 10: Security & Final Steps
- [ ] Enable SSL certificate (AutoSSL in cPanel)
- [ ] Set up automatic database backups
- [ ] Monitor error logs for first 24 hours
- [ ] Update DNS if needed

## Important Files
1. **Frontend (.htaccess):** Use `public_html.htaccess` from project
2. **Backend (.env):** Update with YOUR database credentials
3. **Database:** Export current schema and import to cPanel MySQL

## Quick Troubleshooting
- **Blank page?** Check browser console (F12) and `.htaccess`
- **API not responding?** Verify Node.js app is "Running" in cPanel
- **Database error?** Double-check credentials in `.env`
- **npm install fails?** Use SSH method (see main guide)

## Next Steps After Deployment
1. Test all functionality thoroughly
2. Set up monitoring/alerts
3. Document any custom configurations
4. Create backup schedule

---

**📖 For detailed instructions, see:** `CPANEL_DEPLOYMENT_GUIDE.md`
