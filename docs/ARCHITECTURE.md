# Architektur — Timetracker

## System-Uebersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser/PWA)                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              React + Vite + TailwindCSS                     │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │ │
│  │  │Dashboard │ │ Projekte │ │  Zeiten  │ │   Reports     │  │ │
│  │  │  Page    │ │  Page    │ │  Page    │ │   Page        │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │  Shared: Auth Context, API Client, i18n (de/en)     │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                            │ REST API (JSON)                     │
│                            ▼ Port 5173 (dev) / 80 (prod)        │
└─────────────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   Nginx Proxy   │  (Docker/Prod)
                    │   Port 80/443   │
                    └────────┬────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                     BACKEND (Express.js + TS)                    │
│                         Port 3000                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      Middleware                              │ │
│  │  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │ │
│  │  │Helmet  │ │  CORS    │ │Rate Limit│ │ JWT Auth Guard  │  │ │
│  │  └────────┘ └──────────┘ └──────────┘ └─────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Feature Modules                           │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │ │
│  │  │  Auth    │ │Projects  │ │ Entries  │ │   Reports     │  │ │
│  │  │  Module  │ │ Module   │ │ Module   │ │   Module      │  │ │
│  │  │─────────│ │─────────│ │─────────│ │──────────────│  │ │
│  │  │router   │ │router   │ │router   │ │router        │  │ │
│  │  │controller│ │controller│ │controller│ │controller    │  │ │
│  │  │service  │ │service  │ │service  │ │service       │  │ │
│  │  │validator│ │validator│ │validator│ │validator     │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Shared Layer                               │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │ │
│  │  │AppError  │ │ Logger   │ │  Types   │ │ Prisma Client │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Prisma ORM                                      │ │
│  │  SQLite (dev) ◄──────────────────► PostgreSQL (prod)         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

## Datenmodell

┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│    User      │     │   Project     │     │   TimeEntry      │
│──────────────│     │───────────────│     │──────────────────│
│ id (PK)      │     │ id (PK)       │     │ id (PK)          │
│ email        │◄───┐│ name          │◄───┐│ description      │
│ password     │    ││ description   │    ││ startTime        │
│ name         │    ││ color         │    ││ endTime          │
│ locale (de/en)│    ││ hourlyRate    │    ││ duration (min)   │
│ createdAt    │    ││ isActive      │    ││ date             │
│ updatedAt    │    ││ userId (FK)───┘    ││ projectId (FK)───┘
└──────────────┘    ││ clientId (FK)──┐   ││ userId (FK)──────┘
                    │└───────────────┘ │   └──────────────────┘
                    │                  │
                    │ ┌───────────────┐│
                    │ │   Client      ││
                    │ │───────────────││
                    │ │ id (PK)       ││
                    └─│ name          ││
                      │ email         │┘
                      │ company       │
                      │ address       │
                      │ userId (FK)   │
                      │ isActive      │
                      └───────────────┘

## API Endpoints

### Auth
POST   /api/auth/register     — Registrierung
POST   /api/auth/login        — Login (JWT)
POST   /api/auth/refresh      — Token Refresh
POST   /api/auth/logout       — Logout (Blacklist Token)

### Clients
GET    /api/clients           — Alle Kunden (paginiert)
POST   /api/clients           — Neuer Kunde
GET    /api/clients/:id       — Einzelner Kunde
PUT    /api/clients/:id       — Kunde aktualisieren
DELETE /api/clients/:id       — Kunde loeschen (soft)

### Projects
GET    /api/projects          — Alle Projekte (paginiert, filter)
POST   /api/projects          — Neues Projekt
GET    /api/projects/:id      — Einzelnes Projekt
PUT    /api/projects/:id      — Projekt aktualisieren
DELETE /api/projects/:id      — Projekt loeschen (soft)

### Time Entries
GET    /api/entries           — Alle Eintraege (paginiert, filter)
POST   /api/entries           — Neuer Eintrag
GET    /api/entries/:id       — Einzelner Eintrag
PUT    /api/entries/:id       — Eintrag aktualisieren
DELETE /api/entries/:id       — Eintrag loeschen
POST   /api/entries/timer/start  — Timer starten
POST   /api/entries/timer/stop   — Timer stoppen

### Reports
GET    /api/reports/summary   — Zusammenfassung (Zeitraum)
GET    /api/reports/project/:id — Projekt-Report
GET    /api/reports/client/:id  — Kunden-Report
GET    /api/reports/export/csv  — CSV Export
GET    /api/reports/export/pdf  — PDF Export

## Deployment-Optionen

### 1. Lokal (Docker)
docker-compose up --build → Backend:3000, Frontend:5173, DB:SQLite

### 2. Hosttech/Hostinger VPS
- Node.js + PM2 (Backend)
- Nginx (Reverse Proxy + Static Frontend)
- PostgreSQL (Datenbank)

### 3. GitHub Pages (Frontend PWA)
- vite build → dist/ → gh-pages Branch
- Backend als separate API auf VPS
```
