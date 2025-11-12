# Automated Cloud Backup and Disaster Recovery System

A complete mini project that:

- Hosts a responsive static website on **GitHub Pages**
- Automatically backs up the site to **Backblaze B2**
- Restores the site from B2 on demand and **redeploys** via `git push`

Tech stack: Python 3.x, `b2sdk`, `python-dotenv`, Git/GitHub Pages, Backblaze B2, HTML/CSS/JS.

---

## Features

- 3-page responsive site in `site/` with a clean, professional design
- `backup_to_b2.py`: uploads all `site/` files to your Backblaze B2 bucket
- `restore_from_b2.py`: downloads from B2 and commits/pushes changes to redeploy GitHub Pages
- Secure environment variables via `.env` (template included)
- Logging and helpful error messages

---

## Folder Structure

```
automated-cloud-backup/
├─ env.example                 # Copy to .env and fill in
├─ requirements.txt
├─ backup_to_b2.py
├─ restore_from_b2.py
├─ site/
│  ├─ index.html
│  ├─ about.html
│  ├─ contact.html
│  ├─ css/styles.css
│  └─ js/main.js
└─ README.md
```

> Note: Some environments hide dotfiles in editors. If you can't see `.env`, create it manually using `env.example` as a template.

---

## Frontend Editing (Live content via content.json)

The site now loads visible text from `site/data/content.json`. A floating toolbar is available on every page:

- 🖋️ Edit Mode: toggles inline editing of content
- 💾 Save Changes: writes your edits back to `content.json`
- ⬆️ Backup Now: copies the backup command to your clipboard
- 🧹 Simulate Disaster: copies a command to delete `site/` locally (demo)
- 🔁 Restore Backup: copies the restore command to your clipboard

How saving works:
- The site attempts to use the browser’s File System Access API to overwrite `site/data/content.json`.
- If not supported (e.g., on GitHub Pages), it falls back to download a file named `content.json`. Replace the file at `site/data/content.json` with the downloaded one.
- Either way, the updated `content.json` is a normal file inside `site/` and is included in backups.

Data format (`site/data/content.json`):
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

Notes:
- Browsers cannot directly execute local shell commands or delete local folders for security reasons. The toolbar buttons copy commands (e.g., `python backup_to_b2.py`) to your clipboard and show toasts with instructions.
- When developing locally (opened from the file system), some browsers may restrict `fetch` from reading local JSON. Use a simple local server if needed (e.g., `python -m http.server` in the `site/` directory).

---

## Backblaze B2 Setup (Free Tier)

1. Create a Backblaze account and enable B2 (free tier).
2. Create a **Bucket**:
   - Type: Private or Public (either is fine for this demo)
   - Note the bucket name.
3. Create an **App Key** (Application Key):
   - Go to App Keys → Add a New Application Key
   - Name it (e.g., `backup-site-key`)
   - Capabilities: `listBuckets`, `readFiles`, `writeFiles`, `listFiles` are sufficient for this project
   - Restrict bucket to your bucket if you want (optional)
   - Copy the `keyID` and `applicationKey` (this pair is shown once)

---

## Environment Variables

Copy `env.example` to `.env` and fill in your values:

```
B2_APPLICATION_KEY_ID=YOUR_KEY_ID
B2_APPLICATION_KEY=YOUR_APP_KEY
B2_BUCKET_NAME=your-bucket-name

# Optional (defaults shown)
B2_PREFIX=site
SITE_DIR=site
GIT_REMOTE=origin
GIT_BRANCH=main
```

Explanation:
- `B2_*`: Backblaze credentials and the destination bucket.
- `B2_PREFIX`: Virtual folder/prefix in the bucket (keeps backups organized).
- `SITE_DIR`: Local path to the static site.
- `GIT_REMOTE` and `GIT_BRANCH`: Where to push changes that trigger GitHub Pages.

---

## GitHub Pages Setup

There are multiple ways to serve GitHub Pages. The simplest for this project:

1. Push this repository to GitHub.
2. In your GitHub repo, go to Settings → Pages.
3. Under "Build and deployment":
   - Source: Deploy from a branch
   - Branch: `main` (or your default branch)
   - Folder: `/site`
4. Save. GitHub Pages will build and serve your site from the `site/` folder.

Now any commit that changes files in `site/` will automatically redeploy your site.

---

## Installation

1. Ensure Python 3.x is installed.
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Create `.env` using `env.example` as a template and fill in your values.
4. Run the local backend and open the dashboard:
   ```
   python server.py
   ```
   Then browse to http://localhost:5000

---

## Usage

### In-Browser Editing & Automation
- Toggle **✏️ Edit Mode** to make sections editable.
- **💾 Save** writes live changes to `site/data/content.json` via the Flask backend.
- **☁️ Backup** triggers `backup_to_b2.py` (Backblaze upload).
- **🔁 Restore** triggers `restore_from_b2.py` (download + git deploy).
- **⚠️ Simulate Disaster** copies a command you can run manually to delete the `site/` folder (for demo safety).

Saving automatically pushes the latest content to Backblaze B2, so edits are backed up immediately after each save.

Each action displays toast notifications with status messages.

### Manual CLI usage (optional)
You can still run the scripts yourself:

```
python backup_to_b2.py
```

```
python restore_from_b2.py
```

After pushing, GitHub Pages will update automatically (usually within a minute).

---

## How It Works

- `backup_to_b2.py`:
  - Authenticates with `b2sdk` using your app key
  - Walks the `SITE_DIR` and uploads each file to `B2_BUCKET_NAME` with key `B2_PREFIX/<relative_path>`
  - Logs progress and stops on errors

- `restore_from_b2.py`:
  - Lists objects under `B2_PREFIX/` and downloads to `SITE_DIR`
  - Adds, commits, and pushes the changes to your repo (`GIT_REMOTE`/`GIT_BRANCH`)
  - GitHub Pages serves from the `/site` folder, so the push redeploys the site

---

## Troubleshooting

- Auth errors:
  - Double-check `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, and `B2_BUCKET_NAME`
  - Ensure your App Key has `readFiles`, `writeFiles`, `listFiles`, `listBuckets`
  - Confirm the key is not restricted to a different bucket
- Bucket not found:
  - Verify `B2_BUCKET_NAME` exists in your account
- Nothing restored:
  - Check that `backup_to_b2.py` successfully uploaded files to `B2_PREFIX/`
  - Verify `B2_PREFIX` in `.env` matches what you used during backup
- Git push fails:
  - Ensure you have a valid remote and proper authentication (SSH keys or HTTPS PAT)
  - Confirm `GIT_REMOTE` and `GIT_BRANCH` are correct
  - If there are no changes to commit, the script still attempts to push; that's okay
- GitHub Pages not updating:
  - Check Settings → Pages configuration (branch and folder)
  - Wait up to a couple minutes for the deploy to complete
- Flask backend errors:
  - Check the terminal running `python server.py` for stack traces
  - Ensure dependencies are installed and scripts are executable
  - On Windows, if script execution stalls, confirm `python` is available on PATH

---

## Notes on Free Tier / Billing

- This project uses only the free tiers: Backblaze B2 free allocation and GitHub Pages free hosting for public repos.
- Storage and egress beyond free tier limits may incur charges; monitor your usage in Backblaze.

---



