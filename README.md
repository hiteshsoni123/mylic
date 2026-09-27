# 📋 My LIC Record

A simple, mobile-friendly customer manager built for LIC agents — fully deployable on **Cloudflare's free plan** (Cloudflare Pages + Pages Functions + D1 database).

## ✨ Features

- **Add / Edit / Delete customers** — Name, Mobile Number, Birthday, optional notes
- **Click-to-Call** — tap 📞 Call, your phone's dialer opens instantly, and the exact date & time of the click is auto-logged
- **Call Report** — full history of every call, sorted newest first, filterable by customer (format: `27-09-2026 16:39`)
- **Birthday Reminders** — dashboard shows anyone with a birthday today or in the next 7 days, with a one-click **💬 Wish on WhatsApp** button that opens WhatsApp with a pre-filled birthday message for that exact number
- **Bulk WhatsApp** — select multiple customers, write one message (supports `{name}` for personalization, plus optional image), then step through a "Send Queue" that opens each WhatsApp chat pre-filled — you just tap Send
- **Login protected** — single password gate so randoms can't see your customer list
- **Message History** — log of everything sent via the birthday/bulk buttons

## ⚠️ Important limitations (please read)

1. **No website can silently place a phone call** from a browser — this is a phone/OS security restriction, true on every platform, free or paid. "Call" opens your phone dialer with the number ready; you press the final call button on your phone. The click is still logged automatically for your report.
2. **WhatsApp bulk-send is not 100% automatic** — WhatsApp does not allow any free tool to silently blast messages to many numbers (that's how they stop spam). The Bulk WhatsApp page instead opens one pre-filled chat at a time; you tap Send in each — much faster than typing every message manually. True one-click-to-everyone requires the paid, Meta-approved **WhatsApp Business API**.
3. **Images in bulk messages**: WhatsApp's click-to-chat links only support pre-filled text, not attaching files. If you attach an image, the app uses your phone's native **Share** sheet (text + image together) — you'll pick WhatsApp and the contact manually for that one step.

---

## 🗂️ Project structure

```
my-lic-record/
├── public/              → the website (HTML/CSS/JS)
├── functions/           → backend API (Cloudflare Pages Functions)
│   └── api/
├── migrations/0001_init.sql   → database schema
└── wrangler.toml         → Cloudflare configuration
```

## 🖥️ Run locally (already tested and working)

```bash
npm install
npm run db:migrate:local     # sets up the local database (only once)
npm run dev                   # starts at http://localhost:8788
```

Default login password for local testing: **lic123** (change this before going live — see below).

---

## 🚀 Deploy to Cloudflare (free plan)

### Step 1 — Install Wrangler & log in
```bash
npm install -g wrangler
wrangler login
```
This opens a browser to connect your Cloudflare account (create a free account at cloudflare.com if you don't have one).

### Step 2 — Create the D1 database (free)
```bash
wrangler d1 create my_lic_record_db
```
This prints a `database_id`. Copy it and paste it into `wrangler.toml`, replacing `REPLACE_WITH_YOUR_DATABASE_ID`.

### Step 3 — Apply the database schema
```bash
npm run db:migrate:remote
```

### Step 4 — Set your real login password (don't skip this!)
```bash
wrangler pages secret put APP_PASSWORD --project-name=my-lic-record
```
It will ask you to type a password — this becomes your login password on the live site.

### Step 5 — Deploy
```bash
wrangler pages deploy public --project-name=my-lic-record
```
Wrangler will print your live URL, something like:
`https://my-lic-record.pages.dev`

That's it — open it on your phone, log in, and start adding customers. Every future update is just:
```bash
wrangler pages deploy public --project-name=my-lic-record
```

### Alternative: Deploy via GitHub (auto-deploy on every change)
1. Push this folder to a new GitHub repository.
2. In the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick your repo.
3. Build settings: **Build command:** (leave empty) · **Build output directory:** `public`
4. After the first deploy, go to your Pages project → **Settings → Functions → D1 database bindings** → add binding `DB` → your `my_lic_record_db` database.
5. **Settings → Environment variables** → add `APP_PASSWORD` (encrypt it) with your chosen password.
6. Go to **Settings → Functions → D1** and run the migration once via `wrangler d1 execute my_lic_record_db --remote --file=./migrations/0001_init.sql` from your machine (Git deploys don't run migrations automatically).

### Add it to your phone's home screen (feels like an app)
Open the live URL in Chrome (Android) or Safari (iPhone) → menu → **"Add to Home Screen"**. It'll launch full-screen like a native app.

---

## 🔧 Customize
- **Colors/branding**: edit the `:root` variables at the top of `public/styles.css`.
- **Birthday wish text**: edit `birthdayWishMessage()` in `public/app.js`.
- **Reminder window** (currently 7 days ahead): search for `daysLeft <= 7` in `public/dashboard.js`.
- **Change password later**: re-run `wrangler pages secret put APP_PASSWORD --project-name=my-lic-record`.

## 💾 Backing up your data
Your customers live in Cloudflare D1 (free tier: 5GB storage, way more than enough). To export a backup any time:
```bash
wrangler d1 export my_lic_record_db --remote --output=backup.sql
```
