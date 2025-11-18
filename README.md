
# Automated Cloud Backup & Disaster Recovery System


[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-2.3+-green.svg)](https://flask.palletsprojects.com)
[![Backblaze B2](https://img.shields.io/badge/Backblaze-B2-red.svg)](https://backblaze.com)
[![Github pages](https://img.shields.io/badge/GitHub-Pages-blue?logo=github)](#)



## This project is a fully automated cloud-backup and disaster-recovery system designed to protect a static website and supporting files using Backblaze B2 Cloud Storage, Flask, and Python automation scripts.
It provides:

- Automatic scheduled backups
- Instant disaster simulation
- One-click website restoration
- Real-time monitoring dashboard
- GitHub Pages hosting for the public website (/docs)
- A persistent /admin control panel that cannot be deleted

---

## 📌 Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Project Structure](#3-project-structure)
4. [Features](#4-features)
5. [Technologies Used](#5-technologies-used)
6. [Setup Instructions](#6-setup-instructions)
7. [Environment Variables](#7-environment-variables)
8. [Running the Project](#8-running-the-project)
9. [Backup Workflow](#9-backup-workflow)
10. [Disaster Simulation](#10-disaster-simulation)
11. [Restore Workflow](#11-restore-workflow)
12. [Monitoring & Logging](#12-monitoring--logging)
13. [GitHub Pages Deployment](#13-github-pages-deployment)
14. [Admin Control Panel](#14-admin-control-panel)
15. [Future Improvements](#15-future-improvements)
16. [Conclusion](#16-conclusion)

---

## 1. Project Overview

This project solves a real-world problem:  
**➡ what happens if your website files are accidentally deleted or corrupted?**

To ensure your website always recovers, this system automatically:

- Backs up `/docs(website) to **Backblaze B2**
- Monitors backup status and logs it
- Provides a web interface to simulate disaster and recover files instantly
- Restores the site from B2 on demand and **redeploys** via `git push`

It is fully automated and runs as a scheduled background job.


---

## 2. System Architecture
```
┌───────────────────────────┐
│       GitHub Pages        │
│  Hosts the /docs website  │
└──────────────┬────────────┘
               │
               ▼
┌───────────────────────────┐
│         Local App         │
│  Flask + Python Scripts   │
└──────────────┬────────────┘
               │
               ▼
┌───────────────────────────┐
│     Admin Dashboard       │
│  /admin (never deleted)   │
└──────────────┬────────────┘
               │
┌──────────────▼────────────┐
│ Automated Backup Scripts  │
│ backup_to_b2.py           │
│ restore_from_b2.py        │
│ disaster_recovery.py      │
└──────────────┬────────────┘
               │
               ▼
       Cloud Storage  
     Backblaze B2 Bucket
```

---

## 3. Project Structure
```bash
automated-cloud-backup/
│
├── docs/                        # Public website served by GitHub Pages
│   ├── index.html
│   ├── about.html
│   ├── contact.html
│   ├── css/
│   ├── js/
│   └── data/
│
├── server.py                    # Flask web server + Admin dashboard
├── backup_to_b2.py              # Uploads latest backup to Backblaze B2
├── restore_from_b2.py           # Restores from cloud backup
├── disaster_recovery.py         # Deletes docs/ to simulate disaster
├── monitor_backups.py           # Logs backup status & timestamps
├── metrics.json                 # Stores backup metrics
├── backup.log                   # Log file for monitoring
│
├── requirements.txt             # Python dependencies
├── .env                         # API keys (ignored in Git)
└── README.md                    # Project documentation
```
---

## 4. Features

### ✅ Automated Cloud Backups
Automatically zips the `/docs` folder and uploads it to Backblaze B2.

### ✅ Disaster Simulation
One-click "⚠ Simulate Disaster" deletes the entire website folder.

### ✅ Instant Recovery System
One-click "🔁 Restore Website" downloads the backup and recreates the website.

### ✅ Admin Dashboard
Accessible at: `http://localhost:5000/admin`

Shows:
- Last backup time
- Backup status
- Restore button
- Disaster simulation button
- Backup logs

### ✅ Scheduled Backups
Using Windows Task Scheduler / Cron.

### ✅ Full Logging & Monitoring
Stores logs in:
- `backup.log`
- `metrics.json`

### ✅ GitHub Pages Hosting
The `/docs` folder is served publicly via:  
`https://nidhi-shree.github.io/automated-cloud-backup/`

### ✅ Frontend Editing (Live content via content.json)

  The site now loads visible text from `docs/data/content.json`. A floating toolbar is available on every page:

  - Edit Mode: toggles inline editing of content
  - Save Changes: writes your edits back to `docs/data/content.json`.
  - Backup: triggers automatic backup to Backblaze B2
  - Restore: triggers restore from Backblaze B2
  - Simulate Disaster: copies a command to delete `docs/` locally (demo)

  How saving works:
  - The site saves changes via the Flask backend to `docs/data/content.json`.
  - Saving automatically triggers a backup to Backblaze B2.
  - Either way, the updated `content.json` is a normal file inside `docs/` and is included in backups.

Data format (`docs/data/content.json`):
```json
{
  "title": "Disaster Recovery Dashboard",
  "tagline": "Automated Cloud Backup & Recovery Demo",
  "about": "This project demonstrates how to automatically back up and restore a website using Backblaze B2 and GitHub Pages.",
  "features": [
    { "title": "Automatic Backup", "description": "All site files are synced to Backblaze B2 cloud storage." },
    { "title": "One-Click Restore", "description": "Recover from simulated disasters instantly." },
    { "title": "Editable Frontend", "description": "Edit website content directly from your browser." }
  ],
  "contact": {
    "email": "demo@example.com",
    "message": "Contact us to learn more about automated disaster recovery systems."
  }
}
```
## 🚀 **Quick Start**

### **1-Minute Setup**

```bash
# 1. Clone and install
git clone <repository-url>
cd automated-cloud-backup
pip install -r requirements.txt

# 2. Configure environment
cp env.example .env
# Edit .env with your Backblaze B2 credentials

# 3. Start the system
python server.py
```

### **Quick Demo**

1. 🌐 **Open**: http://localhost:5000
2. 🖋️ **Edit**: Click "Edit Mode" and modify content
3. 💾 **Save**: Changes auto-backup to Backblaze B2
4. 🚨 **Test**: Click "Simulate Disaster" 
5. 🔄 **Recover**: Click "Restore" - site recovers in 60 seconds!


### 🔐 **Security Setup** (Recommended)

```bash
# Add to your .env file
ADMIN_TOKEN=your_secure_random_token_here

# Optional: Email alerts
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
ALERT_EMAIL=admin@yourdomain.com
```

> 🛡️ **Security Features**: Token auth, encrypted storage, audit logs

---

## 🔌 **API Reference**

### **Public Endpoints**
```http
GET  /              # Website interface
GET  /health        # System health check
GET  /metrics       # Real-time metrics
```

### **Authenticated Endpoints** (Require `ADMIN_TOKEN`)
```http
POST /save-content      # Save and backup content
POST /backup            # Manual backup trigger
POST /restore           # Disaster recovery
POST /simulate-disaster # Safe disaster testing
```

### **Authentication**
```bash
# Include in request headers
Authorization: Bearer your_admin_token_here
```

- `GET /` - Serve the website
- `GET /health` - Health check endpoint
- `GET /metrics` - Backup metrics and statistics
- `POST /save-content` - Save content and trigger backup (auth required)
- `POST /backup` - Manual backup trigger (auth required)
- `POST /restore` - Restore from backup (auth required)
- `POST /simulate-disaster` - Disaster simulation (auth required)

---

## 🔧 **Troubleshooting**

### **🚨 Common Issues**

<details>
<summary><strong>❌ "Bucket not found" Error</strong></summary>

**Solution:**
- Verify bucket exists in Backblaze B2 console
- Check `B2_BUCKET_NAME` in `.env` matches exactly
- Ensure bucket is in the correct region

</details>

<details>
<summary><strong>🔐 "Authentication failed" Error</strong></summary>

**Solution:**
- Verify `B2_APPLICATION_KEY_ID` and `B2_APPLICATION_KEY` in `.env`
- Check App Key has required capabilities: `listBuckets`, `readFiles`, `writeFiles`, `listFiles`
- Generate new App Key if needed

</details>

<details>
<summary><strong>📁 "No files uploaded" Warning</strong></summary>

**Solution:**
- Check `SITE_DIR` path in `.env` is correct
- Verify `docs/` directory contains files
- Check file permissions

</details>

### Common Issues

1. **"Bucket not found"**: Ensure your bucket exists in Backblaze and the name matches exactly
2. **"Authentication failed"**: Double-check your `B2_APPLICATION_KEY_ID` and `B2_APPLICATION_KEY`
3. **"Permission denied"**: Ensure your App Key has the required capabilities (`listBuckets`, `readFiles`, `writeFiles`, `listFiles`)
4. **"No files uploaded"**: Check that your `SITE_DIR` contains files and the path is correct
5. **"Authentication required"**: Set `ADMIN_TOKEN` in `.env` or click the Auth button

### **🔍 Debug Commands**

```bash
# Configuration check
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print('✅ B2 Bucket:', os.getenv('B2_BUCKET_NAME'))"

# Connection test
python -c "from backup_to_b2 import init_b2; print('✅ B2 Connection:', init_b2())"

# Log monitoring
tail -f backup.log              # Backup operations
tail -f monitor.log             # Health monitoring
tail -f disaster_recovery.log   # Recovery operations
```

---

## 5. Technologies Used

| Component | Technology |
|-----------|------------|
| Backend Server | Flask (Python) |
| Cloud Storage | Backblaze B2 |
| Automation | Python scripts |
| Frontend | HTML, CSS, JS |
| Hosting | GitHub Pages |
| Logging | backup.log + metrics.json |
| Scheduling | Windows Task Scheduler / Cron |

---

## 6. Setup Instructions

### 1️⃣ Install Python
Make sure Python 3.10+ is installed.

### 2️⃣ Create Virtual Environment
```bash
python -m venv venv
```
Activate:
Windows: venv\Scripts\activate

Linux/Mac: source venv/bin/activa

### 3️⃣ Install Dependencies
```bash
pip install -r requirements.txt

### 4️⃣ Create .env File
```
Add:
```bash
B2_APPLICATION_KEY_ID=xxxx
B2_APPLICATION_KEY=xxxx
B2_BUCKET_NAME=xxxx
```
## 6. Environment variables
| Variable | Description |
|----------|-------------|
| B2_APPLICATION_KEY_ID | Backblaze key ID |
| B2_APPLICATION_KEY | Backblaze private key |
| B2_BUCKET_NAME | Your bucket name: disaster-recovery-bucket |

## 8. Running the Project

**Start the Flask server:**
```bash
python server.py
```
Admin panel:
http://localhost:5000/admin

Public site (when running locally):
http://localhost:5000/

 ---
## 9. Backup Workflow
🔁 Steps performed by backup_to_b2.py:

- Zip the /docs folder
- Upload to Backblaze B2
- Update metrics.json
- Append to backup.log

Backups run automatically through:
- Scheduled tasks
- Manual trigger from admin panel

---

## 10. Disaster Simulation
The /admin dashboard has:
💥 Simulate Disaster

This will:
- Completely delete the /docs folder
- Website becomes unavailable
- Admin panel still works (because it is outside /docs)

This simulates real-world situations:
- Accidental deletion
- Corrupted deployment
- Malware / ransomware deletion
- Developer mistakes

---

## 11. Restore Workflow
When "Restore Website" is clicked:

- Latest backup is downloaded from Backblaze B2
- Unzipped into /docs
- Website becomes live again instantly

This demonstrates disaster recovery concepts:
- Recovery Time Objective (RTO)
- Recovery Point Objective (RPO)

---

## 12. Monitoring & Logging
backup.log shows:

text
[2025-11-12] Backup successful (2.4MB)
[2025-11-13] Backup failed: network error
metrics.json stores:

json
{
  "last_backup": "2025-11-14 09:33:12",
  "status": "SUCCESS",
  "backup_size": "2.4 MB"
}
These metrics are displayed in /admin.

---

## 13. GitHub Pages Deployment
Since GitHub Pages needs either:

- /docs folder
- root /

✔ Deployed from master branch → /docs folder

GitHub Pages website here:
https://nidhi-shree.github.io/automated-cloud-backup/

GitHub Pages serves ONLY /docs site(static).
Admin panel is local-only.

---

## 14. Admin Control Panel
Admin Panel URL:
http://localhost:5000/admin

Admin Panel Buttons:

| Button | Function |
|--------|----------|
| Backup Now | Triggers backup_to_b2.py |
| Simulate Disaster | Deletes entire /docs folder |
| Restore Website | Restores from cloud backup |
| View Logs | Shows last N log entries |

Admin panel is never deleted, even during disaster, because it lives in Flask templates folder — NOT inside /docs.

---

## 15. Future Improvements

Add user authentication for admin panel

E-mail alerts on backup failure

Versioned backups with timestamps

Real-time WebSocket monitoring

Multi-cloud backup (AWS S3 + Azure Blob)

CLI tool for automation

---

## 16. Conclusion

This project demonstrates:

Real-world cloud backup automation

Disaster recovery engineering

Flask web app development

GitHub Pages deployment

Cloud storage integration

Scheduled task automation

Monitoring/logging systems

---
