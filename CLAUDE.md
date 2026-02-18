# CLAUDE.md — Timetracker

Dieses File definiert die Regeln fuer Claude Code in diesem Repository.

## Projekt-Uebersicht

Stundenerfassungs-App fuer einen Schweizer IT-Spezialisten (Solothurn).
Trackt Stunden pro Projekt/Kunde, generiert Reports, laeuft lokal (Docker)
oder auf Hosttech/Hostinger (Shared Hosting / VPS).

## Sprachregeln

- **Swiss German Konvention**: Verwende `ss` statt `ß` (z.B. "Strasse", "Gruss").
- **Code-Sprache**: Englisch (Variablen, Funktionen, Kommentare).
- **UI-Sprache**: Deutsch (Standard) + Englisch (Option). i18n via react-i18next.
- **Dokumentation**: Deutsch (README, CLAUDE.md), Englisch (Code-Kommentare).

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Backend**: Node.js 20+ / Express.js
- **Frontend**: React 18+ / Vite / TailwindCSS / PWA (Workbox)
- **Database**: SQLite (lokal/dev) / PostgreSQL (prod)
- **ORM**: Prisma
- **Auth**: JWT (Access + Refresh Tokens), bcrypt
- **Testing**: Jest (Backend), Vitest + React Testing Library (Frontend)
- **Package Manager**: npm
- **Runtime (Prod)**: PM2
- **Container**: Docker + Docker Compose

## Common Commands

```bash
# Install dependencies (from root)
npm ci

# Install all workspaces
npm ci --workspaces

# Run development (backend + frontend)
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend

# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Build for production
npm run build

# Lint
npm run lint

# Format
npm run format

# Docker (local)
docker-compose up --build

# Database migrations
npm run db:migrate
npm run db:seed
```

## Projekt-Struktur

```
timetracker/
├── .github/
│   └── workflows/
│       ├── ci.yml          # Tests on Push/PR
│       └── deploy.yml      # Deploy on main push
├── .vscode/
│   ├── settings.json
│   ├── extensions.json
│   ├── tasks.json
│   └── launch.json
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/         # App config, env validation
│   │   │   ├── middleware/     # Auth, error handler, rate limit
│   │   │   ├── modules/       # Feature modules (auth, projects, entries, reports)
│   │   │   │   ├── auth/
│   │   │   │   ├── projects/
│   │   │   │   ├── entries/
│   │   │   │   └── reports/
│   │   │   ├── shared/        # Shared utilities, types
│   │   │   └── index.ts       # Entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── tests/
│   │   ├── jest.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── components/    # Shared UI components
│       │   ├── features/      # Feature-based modules
│       │   ├── hooks/         # Custom React hooks
│       │   ├── i18n/          # Translations (de, en)
│       │   ├── lib/           # API client, utils
│       │   ├── pages/         # Route pages
│       │   └── main.tsx
│       ├── public/
│       ├── tests/
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json              # Root workspace
├── tsconfig.base.json
├── .env.example
├── .gitignore
├── CLAUDE.md
└── README.md
```

## Coding Conventions

- **Style**: Prettier (2 spaces, single quotes, trailing comma).
- **Linting**: ESLint mit TypeScript-Plugin (strict).
- **Naming**: camelCase (Variablen/Funktionen), PascalCase (Klassen/Interfaces/Components).
- **Files**: kebab-case (Dateinamen), PascalCase (React Components).
- **Imports**: Absolute Imports via tsconfig paths (`@/`).
- **Error Handling**: Immer typisierte Errors, nie `any`. Custom AppError Klasse.
- **API**: RESTful, konsistente Response-Struktur `{ success, data, error, meta }`.
- **Commits**: Conventional Commits (feat:, fix:, chore:, docs:, test:, refactor:).
- **Branches**: main (stable), develop (aktuell), feature/* (neue Features).
- **Tests**: Failing Tests zuerst schreiben, dann fixen (TDD-Ansatz).
- **Security**: Input-Validierung (zod), Rate Limiting, Helmet, CORS, SQL Injection Prevention via Prisma.
- **No `any`**: TypeScript strict, kein `any` ausser in Ausnahmefaellen (mit Kommentar).

## Security-First Prinzipien

- Alle Inputs via Zod validieren
- JWT mit kurzer Laufzeit (15min Access, 7d Refresh)
- Passwords via bcrypt (min 12 rounds)
- Rate Limiting auf Auth-Endpoints
- Helmet fuer HTTP Security Headers
- CORS strikt konfiguriert
- Environment Variables via .env (nie committen!)
- SQL Injection: Prisma parameterized queries
- XSS: React escaped by default + DOMPurify wo noetig

## Key Files / Entry Points

- `packages/backend/src/index.ts` — Backend Server Start
- `packages/frontend/src/main.tsx` — Frontend Entry
- `packages/backend/prisma/schema.prisma` — Database Schema
- `docker-compose.yml` — Local Development Setup

## Environment / Config

- `.env` wird NIE committed (in .gitignore)
- `.env.example` zeigt alle benoetigten Variablen
- Validierung via `zod` beim Start (fail fast)

## Known Gotchas

- SQLite hat kein `RETURNING *` — Prisma handhabt das.
- Docker auf Windows: Line endings beachten (LF, nicht CRLF).
- Vite Dev Server und Express muessen auf verschiedenen Ports laufen (5173 / 3000).
- PWA Service Worker nur im Production Build aktiv.
