# DevPipeline

DevPipeline is a MongoDB-backed opportunity pipeline for software engineering internships and job applications. It gives you a lightweight CRM-style dashboard for tracking companies, positions, statuses, follow-ups, contacts, links, and notes.

## How It Works

The app is split into two layers:

```text
frontend/  Browser UI for the dashboard, filters, table, and add/edit modal
backend/   Node HTTP server, REST API, validation, security headers, and MongoDB access
```

The frontend calls the backend API at `/api/applications`. The backend validates each request, stores records in MongoDB, and returns sanitized JSON to the UI. The `.env` file holds private MongoDB settings and is intentionally ignored by Git.

## Current Features

- Dashboard metrics for total, active, interviews, offers, and due-soon follow-ups
- Search and filters for status, priority, and work mode
- Add/edit modal flow with confirm-and-save behavior
- Email Intake parser that turns pasted recruiter/application emails into prefilled opportunities
- Click outside a changed opportunity modal to autosave valid edits
- Email Intake resets after each parse/close so the next email starts clean
- Contacts tab generated from recruiter/referral names stored on opportunities
- Labeled import/export controls for moving pipeline data
- MongoDB persistence through a Node backend
- Secure input validation for enum values, dates, field lengths, and URLs
- Security headers including CSP, frame blocking, no-sniff, and referrer policy
- Production password gate for hosted/public deployments
- JSON import/export for backup or migration
- `/health` endpoint for deployment checks

## Local Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=cpe_job_tracker
PORT=5173
HOST=127.0.0.1
NODE_ENV=development
MONGODB_TLS_ALLOW_INVALID_CERTS=false
APP_PASSWORD=
```

For MongoDB Atlas, use your Atlas connection string as `MONGODB_URI`.

If your local Node certificate store is broken, you can temporarily set:

```bash
MONGODB_TLS_ALLOW_INVALID_CERTS=true
```

Use that only for local development. Never enable it in production.

Start the app:

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:5173
```

## MongoDB Atlas

1. Create a free Atlas cluster.
2. Create a database user with read/write access.
3. Add your current IP address in Network Access.
4. Copy the Node.js connection string.
5. Put the connection string in `.env` as `MONGODB_URI`.

## Make It A Public Website For Free

Recommended free stack:

- App hosting: Netlify Free
- Database: MongoDB Atlas free cluster
- Code hosting: GitHub

Netlify has advertised its Free plan as no-credit-card-required, and it supports Node functions with environment variables. This repo includes `netlify.toml` and `netlify/functions/app.js` so Netlify can host the frontend and API as one protected app.

### Deploy On Netlify

1. Go to [Netlify](https://www.netlify.com/).
2. Sign up with GitHub.
3. Add new site -> Import an existing project.
4. Import this repository: `Hitthenutz/CPE-Job-Tracker`.
5. Pick branch: `codex/cpe-career-tracker`.
6. Use the settings from `netlify.toml`.
7. Add these environment variables:

```bash
NODE_ENV=production
MONGODB_URI=your_atlas_connection_string
MONGODB_DB=cpe_job_tracker
MONGODB_TLS_ALLOW_INVALID_CERTS=false
APP_PASSWORD=make_a_private_password_for_the_site
```

8. Deploy.

Netlify will give you a public URL like:

```text
https://devpipeline.netlify.app
```

When you open the site, your browser will ask for a username and password. The username can be anything; the password must match `APP_PASSWORD`.

### Vercel Option

This repo also includes `vercel.json` and `api/index.js` for Vercel Hobby. Use it only if signup works for you:

1. Go to [Vercel](https://vercel.com/).
2. Sign up with GitHub.
3. Import this repository: `Hitthenutz/CPE-Job-Tracker`.
4. Pick branch: `codex/cpe-career-tracker`.
5. Keep the project on the `Hobby` plan.
6. Leave build settings alone unless Vercel asks. This repo uses `vercel.json`.
7. Add these environment variables:

```bash
NODE_ENV=production
MONGODB_URI=your_atlas_connection_string
MONGODB_DB=cpe_job_tracker
MONGODB_TLS_ALLOW_INVALID_CERTS=false
APP_PASSWORD=make_a_private_password_for_the_site
```

8. Deploy.

Vercel will give you a public URL like:

```text
https://devpipeline.vercel.app
```

When you open the site, your browser will ask for a username and password. The username can be anything; the password must match `APP_PASSWORD`.

### Backup Free Options

GitHub Pages is free and usually does not ask for billing, but it only hosts static files. That means it cannot safely use MongoDB or the backend API by itself.

Koyeb and Render both document free web services, but some signup flows still ask for a payment method. If they ask you to pay or add billing, skip them and use Vercel Hobby first.

### Render Option

Render also documents free web services. This repo includes `render.yaml`, but make sure you choose the `Free` instance type during setup. If Render asks you to pick a paid instance, back out and choose the free web service flow instead of a paid service.

### Other Hosts

For another Node host, use:

```bash
Build Command: npm install
Start Command: npm start
```

Set the same environment variables listed above. The server binds to `0.0.0.0` automatically in production unless `HOST` is set.

## API

- `GET /health`
- `GET /api/applications`
- `POST /api/applications`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`

## Email Intake

Use `Email Intake` when you receive a recruiter email, interview invite, application confirmation, or job-posting email.

1. Click `Email Intake`.
2. Paste the email text.
3. Click `Parse & Review`.
4. Review the prefilled opportunity modal.
5. Click `Confirm & Save` to post it to MongoDB.

The parser attempts to infer company, position, contact, link, status, deadline, location, compensation, next step, and follow-up date. It does not connect to your inbox yet; direct Gmail/Outlook scanning should be added later with OAuth and explicit permissions.

## Security Notes

- Keep `.env` out of GitHub.
- Store production secrets in your host's environment variable settings.
- Set `APP_PASSWORD` before hosting publicly so strangers cannot edit your applications.
- Rotate any MongoDB password that was shared in chat or committed by mistake.
- Never set `MONGODB_TLS_ALLOW_INVALID_CERTS=true` in production.

## Feature Roadmap

- Kanban board grouped by status
- Timeline/history per opportunity
- Contact CRM with recruiter/referral tracking
- Resume version tracking per application
- Calendar view for deadlines and follow-ups
- Email reminder or notification hooks
- Analytics for response rate, interview rate, and offer rate
- CSV/XLSX import from the original spreadsheet
- Authentication for hosted/public usage
- Role-based private/public views
