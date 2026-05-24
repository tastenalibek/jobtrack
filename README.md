# JobTrack

A full-stack SaaS web app for tracking job applications — built with Go and React.

![JobTrack](https://img.shields.io/badge/Go-1.21-00ADD8?style=flat&logo=go)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql)

## Features

- **Auth** — JWT-based register/login with bcrypt password hashing
- **Dashboard** — Stats cards (total, this week, by status), recent applications list
- **Kanban board** — Drag-and-drop cards across Applied → Interview → Offer → Rejected columns
- **Jobs list** — Filterable table with search, status filter, inline edit/delete
- **Full CRUD** — Create, edit, delete job applications with company, position, location, salary, URL, notes

## Quick start

Requires Docker Desktop (running).

```bash
git clone https://github.com/tastenalibek/jobtrack
cd jobtrack

# Start the database + backend
docker compose up --build -d

# Start the frontend
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

## Project structure

```
jobtrack/
├── backend/
│   ├── main.go                        # server, routing, startup
│   ├── Dockerfile
│   └── internal/
│       ├── auth/jwt.go                # JWT generation & validation
│       ├── db/db.go                   # connection pool + schema migration
│       ├── handler/
│       │   ├── handler.go             # Handler struct, helpers
│       │   ├── auth.go                # POST /auth/register, /auth/login
│       │   ├── jobs.go                # CRUD /jobs, /jobs/{id}
│       │   ├── stats.go               # GET /stats
│       │   └── middleware.go          # JWT auth middleware
│       └── model/
│           ├── user.go                # User, RegisterRequest, LoginRequest
│           └── job.go                 # Job, JobRequest, Stats
├── frontend/
│   └── src/
│       ├── api/                       # axios client + typed API functions
│       ├── components/                # Layout, JobForm, StatusBadge
│       ├── pages/                     # Dashboard, Board (kanban), Jobs (table)
│       ├── store/auth.ts              # Zustand auth store (persisted)
│       └── types/index.ts             # shared TypeScript types
├── docker-compose.yml
└── .env.example
```

## API

| Method | Endpoint        | Auth | Description         |
|--------|-----------------|------|---------------------|
| POST   | /auth/register  | No   | Create account      |
| POST   | /auth/login     | No   | Login, get JWT      |
| GET    | /me             | Yes  | Current user        |
| GET    | /stats          | Yes  | Dashboard stats     |
| GET    | /jobs           | Yes  | List jobs (?status= ?q=) |
| POST   | /jobs           | Yes  | Create job          |
| GET    | /jobs/{id}      | Yes  | Get job             |
| PUT    | /jobs/{id}      | Yes  | Update job          |
| DELETE | /jobs/{id}      | Yes  | Delete job          |

## Tech stack

**Backend**
- [Go 1.21](https://go.dev) + [chi](https://github.com/go-chi/chi) router
- PostgreSQL 16 with `database/sql` + `lib/pq`
- JWT auth via `golang-jwt/jwt`
- bcrypt password hashing via `golang.org/x/crypto`
- CORS via `go-chi/cors`

**Frontend**
- [React 18](https://react.dev) + TypeScript
- [Vite](https://vitejs.dev) build tool
- [Tailwind CSS](https://tailwindcss.com) styling
- [TanStack Query](https://tanstack.com/query) for data fetching & caching
- [dnd-kit](https://dndkit.com) for kanban drag-and-drop
- [Zustand](https://zustand-demo.pmnd.rs) for auth state (persisted)
- [React Router v6](https://reactrouter.com)
- [Lucide React](https://lucide.dev) icons

## License

MIT
