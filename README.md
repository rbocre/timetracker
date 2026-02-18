# Timetracker

![CI](https://github.com/rbocre/timetracker/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.7-blue.svg)

Stundenerfassungs-App fuer Schweizer IT-Spezialisten. Trackt Stunden pro Projekt/Kunde, generiert Reports, laeuft lokal (Docker) oder auf Hosttech/Hostinger.

## Features

- Zeiterfassung mit Start/Stop-Timer oder manueller Eingabe
- Projekt- und Kundenverwaltung
- Reports mit CSV-Export
- Mehrsprachig (Deutsch / English)
- Progressive Web App (PWA) — offline-faehig
- JWT-basierte Authentifizierung
- Responsive Design mit TailwindCSS

## Tech Stack

| Layer    | Technologie                          |
|----------|--------------------------------------|
| Frontend | React 18, Vite, TailwindCSS, PWA    |
| Backend  | Node.js 20, Express, TypeScript      |
| Database | SQLite (dev) / PostgreSQL (prod)     |
| ORM      | Prisma                               |
| Auth     | JWT (Access + Refresh Tokens)        |
| Testing  | Jest (Backend), Vitest (Frontend)    |
| CI/CD    | GitHub Actions                       |
| Deploy   | Docker, PM2, Nginx, GitHub Pages     |

## Schnellstart

### Voraussetzungen

- Node.js >= 20
- npm >= 10
- Docker + Docker Compose (optional)

### Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/rbocre/timetracker.git
cd timetracker

# In VS Code oeffnen
code .

# Dependencies installieren
npm ci

# Environment-Variablen konfigurieren
cp .env.example .env

# Datenbank erstellen und migrieren
npm run db:migrate

# (Optional) Demo-Daten laden
npm run db:seed

# Entwicklungsserver starten (Backend + Frontend)
npm run dev
```

Backend laeuft auf `http://localhost:3000`, Frontend auf `http://localhost:5173`.

### Mit Docker

```bash
# Alle Services starten
docker-compose up --build

# Oder im Hintergrund
docker-compose up -d --build
```

### VS Code

Das Projekt enthaelt eine vollstaendige VS Code-Konfiguration:

- **Empfohlene Extensions**: Automatische Vorschlaege beim Oeffnen
- **Tasks**: `Ctrl+Shift+B` → Dev Server, Tests, Docker
- **Debugger**: F5 → Backend oder Frontend debuggen
- **Formatting**: Prettier on Save

## Projektstruktur

```
timetracker/
├── .github/workflows/     # CI/CD Pipelines
├── .vscode/               # VS Code Konfiguration
├── packages/
│   ├── backend/           # Express.js API
│   │   ├── src/modules/   # Feature Modules (auth, projects, entries, reports)
│   │   ├── prisma/        # Database Schema + Migrations
│   │   └── tests/         # Backend Tests
│   └── frontend/          # React SPA
│       ├── src/pages/     # Route Pages
│       ├── src/i18n/      # Translations (de, en)
│       └── tests/         # Frontend Tests
├── docker/                # Dockerfiles + Nginx
└── docker-compose.yml     # Local Development
```

## API

Alle Endpoints unter `/api/`:

| Method | Endpoint                  | Beschreibung           | Auth |
|--------|---------------------------|------------------------|------|
| POST   | /auth/register            | Registrierung          | Nein |
| POST   | /auth/login               | Login                  | Nein |
| POST   | /auth/refresh             | Token erneuern         | Nein |
| GET    | /clients                  | Alle Kunden            | Ja   |
| POST   | /clients                  | Neuer Kunde            | Ja   |
| GET    | /projects                 | Alle Projekte          | Ja   |
| POST   | /projects                 | Neues Projekt          | Ja   |
| GET    | /entries                  | Alle Zeiteintraege     | Ja   |
| POST   | /entries                  | Neuer Eintrag          | Ja   |
| POST   | /entries/timer/start      | Timer starten          | Ja   |
| POST   | /entries/timer/:id/stop   | Timer stoppen          | Ja   |
| GET    | /reports/summary          | Report-Zusammenfassung | Ja   |
| GET    | /reports/export/csv       | CSV Export             | Ja   |

## Tests

```bash
# Alle Tests
npm test

# Backend Tests
npm run test:backend

# Frontend Tests
npm run test:frontend

# Mit Coverage
npm run test:backend -- --coverage
```

## Deployment

### GitHub Pages (Frontend)

Automatisch via GitHub Actions bei Push auf `main`.

### VPS (Hosttech/Hostinger)

1. VPS mit Node.js 20+ und PM2 einrichten
2. GitHub Secrets konfigurieren:
   - `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
3. Repository Variable `DEPLOY_VPS` auf `true` setzen
4. Push auf `main` → automatisches Deployment

### Manuelles Deployment

```bash
# Build
npm run build

# Backend starten (Produktion)
cd packages/backend
NODE_ENV=production node dist/index.js

# Oder mit PM2
pm2 start dist/index.js --name timetracker-backend
```

## Lizenz

MIT
