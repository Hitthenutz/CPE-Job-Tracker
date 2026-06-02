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
- MongoDB persistence through a Node backend
- Secure input validation for enum values, dates, field lengths, and URLs
- Security headers including CSP, frame blocking, no-sniff, and referrer policy
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

## Deployment

For Render, Railway, or another Node host:

```bash
Build Command: npm install
Start Command: npm start
```

Set environment variables in the host dashboard:

```bash
NODE_ENV=production
MONGODB_URI=your_atlas_connection_string
MONGODB_DB=cpe_job_tracker
MONGODB_TLS_ALLOW_INVALID_CERTS=false
```

The server binds to `0.0.0.0` automatically in production unless `HOST` is set.

## API

- `GET /health`
- `GET /api/applications`
- `POST /api/applications`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`

## Security Notes

- Keep `.env` out of GitHub.
- Store production secrets in your host's environment variable settings.
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
