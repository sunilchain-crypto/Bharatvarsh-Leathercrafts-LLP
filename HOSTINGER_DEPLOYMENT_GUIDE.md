# Hostinger Shared Hosting (hPanel) Deployment Guide
**Bharatvarsh Leathercrafts LLP — Production Architecture**

This guide provides end-to-end instructions for deploying your luxury leathercraft storefront on **Hostinger Shared Hosting (hPanel)** using the built-in Node.js Application Runner, MySQL database, local disk media storage, and Hostinger SMTP mail.

---

## 1. Architecture & Production Specifications

| Specification | Configuration |
| :--- | :--- |
| **Hosting Type** | Traditional Shared Hosting (Hostinger hPanel) |
| **Process Manager** | Built-in Node.js Application Runner (`node server.js`) |
| **Database Engine** | MySQL 8.0+ (`localhost:3306`, DB: `Name`, User: `our_username_here`) |
| **Media & File Storage** | Stored directly on Host's Local Disk (`./uploads`) |
| **Primary Domain URL** | Temporary preview domain initially &rarr; seamlessly replaced with permanent domain |
| **Mail / SMTP** | `support@bharatvarshcrafts.com` via `smtp.hostinger.com:465` (SSL) |
| **Node.js Version** | Node.js 20.x or 22.x (LTS) |

---

## 2. Solution to the Hostinger `esbuild` & Bundling Issue

### The Root Cause:
Hostinger's deployment pipeline runs `npm install` with `NODE_ENV=production`, which automatically skips all `devDependencies`. When deployment build scripts attempt to run `esbuild server.ts --bundle ...`, the deployment crashes with:
`sh: esbuild: command not found`

### How We Solved It:
1. **Unbundled Native ES Module `server.js`:**
   `server.js` is written as a clean, standalone, native ES Module file (`import express from 'express'`, `import mysql from 'mysql2/promise'`, etc.). It **never** needs to be bundled.
2. **Zero `esbuild` in Build Script:**
   The `npm run build` script in `package.json` contains only `"vite build"` for compiling front-end client assets into the `dist/` directory.
3. **Runtime Dependencies in `"dependencies"`:**
   All production modules (`mysql2`, `multer`, `nodemailer`, `dotenv`, `express`, `@google/genai`) are declared in `"dependencies"` (not `devDependencies`). They are guaranteed to be installed during Hostinger's production `npm install`.
4. **Instant Startup:**
   Hostinger's built-in application runner directly executes:
   ```bash
   node server.js
   ```
   No compilation or bundling is required at runtime on Hostinger.

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Create the MySQL Database in Hostinger hPanel
1. Log in to **Hostinger hPanel**.
2. Navigate to **Databases** &rarr; **MySQL Databases**.
3. Create a new database:
   - **Database Name:** `Name` (or your Hostinger prefix e.g., `u123456789_name`)
   - **Username:** `our_username_here` (or your Hostinger prefix e.g., `u123456789_user`)
   - **Password:** `our_password_here`
4. Click **Create**.
5. Click **Enter phpMyAdmin** next to your newly created database.
6. Click the **Import** tab at the top.
7. Click **Choose File**, select the `schema.sql` file located in the root of this project, and click **Import**.
   - This creates the `categories`, `products`, `orders`, and `inquiries` tables and seeds initial luxury leather products.

---

### Step 2: Upload Files to Hostinger
1. In hPanel, go to **Files** &rarr; **File Manager** (or connect via SFTP / Git).
2. Navigate to your application root (e.g., `domains/yourdomain.com/public_html` or a dedicated Node.js subfolder).
3. Upload all project files:
   ```
   ├── dist/                 (built by running npm run build)
   ├── server.js             (standalone unbundled production server)
   ├── package.json          (dependencies)
   ├── schema.sql            (database schema)
   ├── .env                  (environment credentials)
   └── uploads/              (local disk directory for media)
   ```
4. Ensure the `uploads/` directory exists and has write permissions (`chmod 755` or `775`).

---

### Step 3: Configure the Hostinger Node.js Application Manager
1. In hPanel, navigate to **Advanced** &rarr; **Node.js**.
2. Click **Create Application** (or select your existing app):
   - **Node.js Version:** `20.x` or `22.x`
   - **Application Mode:** `Production`
   - **Application Root:** Path where your files reside (e.g., `/public_html` or `/app`)
   - **Application Startup File:** `server.js`
3. Click **Save** / **Create**.
4. Click **Run npm install** in the hPanel Node.js dashboard to install all production dependencies.

---

### Step 4: Configure Environment Variables (`.env`)
Create or edit the `.env` file in the application root with your credentials:

```env
# Server Port & Mode
PORT=3000
NODE_ENV=production

# Primary Domain URL (temporary preview URL or your permanent production domain)
APP_URL="https://your-temporary-preview-domain.hostinger.com"

# Database Details (MySQL)
DB_HOST="localhost"
DB_PORT=3306
DB_NAME="Name"
DB_USER="our_username_here"
DB_PASSWORD="our_password_here"

# Mail Configuration (Hostinger Email: support@bharatvarshcrafts.com)
# A) Incoming Mail: IMAP (Fetches customer inquiries & support emails)
IMAP_HOST="imap.hostinger.com"
IMAP_PORT=993
IMAP_SECURE="true"
IMAP_USER="support@bharatvarshcrafts.com"
IMAP_PASS="your_hostinger_webmail_password_here"

# B) Outgoing Mail: SMTP (Sends GST receipts, order confirmations, quote alerts)
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT=465
SMTP_SECURE="true"
SMTP_USER="support@bharatvarshcrafts.com"
SMTP_PASS="your_hostinger_webmail_password_here"
SMTP_FROM="Bharatvarsh Leathercrafts LLP <support@bharatvarshcrafts.com>"
NOTIFICATION_EMAIL="support@bharatvarshcrafts.com"

# Media Storage (Host Local Disk)
UPLOAD_DIR="./uploads"

# Gemini AI Key (Optional - for AI Story generator)
GEMINI_API_KEY=""

# Payment Gateways (Optional - Test Mode active when empty)
VITE_RAZORPAY_KEY_ID="rzp_test_your_razorpay_key_id_here"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
```

---

### Step 5: Start and Verify
1. In the Hostinger Node.js manager, click **Restart Application**.
2. Test the health check endpoint:
   ```bash
   curl https://your-domain.com/api/health
   ```
   **Expected Response:**
   ```json
   {
     "status": "ok",
     "database": {
       "connected": true,
       "engine": "MySQL",
       "host": "localhost",
       "port": 3306,
       "database": "Name"
     },
     "smtp": {
       "user": "support@bharatvarshcrafts.com",
       "host": "smtp.hostinger.com"
     },
     "storage": {
       "engine": "Host Local Disk",
       "uploadPath": "./uploads"
     }
   }
   ```
3. Open your browser and navigate to your domain.
4. Click **Store Admin** &rarr; **Host & MySQL Engine** tab to view live connection metrics, database table counts, and media stored on local disk.

---

## 4. Switching from Temporary Domain to Permanent Domain
When your custom domain (e.g., `https://bharatvarshcrafts.com`) is ready:
1. Point your domain DNS A-record to your Hostinger server IP.
2. In Hostinger hPanel, assign the domain to your Node.js application.
3. In `.env`, change:
   ```env
   APP_URL="https://bharatvarshcrafts.com"
   ```
4. Restart the Node.js application in hPanel. No code rebuild or redeployment is necessary!
