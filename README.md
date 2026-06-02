# CPE Career Tracker

A MongoDB-backed web app for tracking computer engineering internships and job applications.

## Project Structure

```text
backend/   Node HTTP API and MongoDB persistence
frontend/  Browser UI assets
```

## Run

Install dependencies:

```bash
npm install
```

Create a `.env` file or set these environment variables:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=cpe_job_tracker
PORT=5173
MONGODB_TLS_ALLOW_INVALID_CERTS=false
```

For MongoDB Atlas, use the Atlas connection string as `MONGODB_URI`.
If your local machine has a broken Node certificate store, you can set
`MONGODB_TLS_ALLOW_INVALID_CERTS=true` for local development only.

```bash
npm run dev
```

Then open `http://127.0.0.1:5173`.

## MongoDB Atlas

1. Create a free Atlas cluster in your MongoDB organization.
2. Create a database user with read/write access.
3. Add your current IP address to Network Access.
4. Copy the Node.js connection string.
5. Put it in `.env` as `MONGODB_URI`.

## Features

- Dashboard counts for total, active, interviews, offers, and due-soon follow-ups
- Application table with search and filters
- Add, edit, delete, and open application links
- MongoDB database storage
- JSON import and export

## API

- `GET /api/applications`
- `POST /api/applications`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`
