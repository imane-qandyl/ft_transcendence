*This project has been created as part of the 42 curriculum by ymrabeti, imqandyl, reahmed, fishaq, ahashem.*

# ft_transcendence - Street Pixel Wars

Hey there! Welcome to **Street Pixel Wars** - a gangster-themed PvP combat game we built from scratch. Think old-school pixel art meets modern web tech. You create characters, fight other players in turn-based battles, take over city territories, and climb the criminal ranks.

## Team

| Login | Role | What they did |
|-------|------|---------------|
| **ymrabeti** | PM + Developer | Game logic, AI opponents, combat system, frontend game pages, Phaser 3 integration |
| **imqandyl** | Tech Lead + Developer | Backend API, database, Docker/DevOps, security, 2FA, Google OAuth |
| **ahashem** | PO + Developer | Frontend UI/UX, pixel-art design, Tailwind theme, Privacy Policy & ToS pages |
| **reahmed** | Developer | WebSocket infrastructure, real-time chat, friend panel, notifications |
| **fishaq** | Developer | User profiles, avatar upload, user management |

## How We Worked Together

We used **WhatsApp** for daily communication and **GitHub Issues** to track tasks. Each person owned their feature area, made branches, and we reviewed each other's pull requests before merging. We had regular syncs to check progress and sort out any blockers.

## Description

**Street Pixel Wars** is a multiplayer web app where players create characters with customizable stats, battle each other or AI opponents in turn-based combat, capture territories, and complete crime missions for resources and XP.

**What you can do:**
- Fight other players (or AI) with Attack/Defend/Special moves
- Level up, allocate stats, and customize your character
- Chat with other players, add friends, block users
- Compete on the ELO leaderboard
- Secure your account with 2FA or sign in with Google

## Instructions

**Prerequisites:** Docker, Docker Compose, Git, Google Chrome

**Setup:**
```bash
git clone <repository-url>
cd final
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
make
```

That's it. `make` builds the containers, generates SSL certs, runs migrations, and starts everything.

Open **https://localhost:8443** in Chrome.

API docs at **https://localhost:8443/docs** (Swagger UI).

**Other commands:** `make down`, `make restart`, `make clean`, `make logs`

## Tech Stack

**Frontend:** React 18 (component-based UI with hooks), Phaser 3 (2D game engine for the battle scenes), Tailwind CSS (utility-first styling with our custom pixel-art theme), React Router v6, Socket.IO Client, Axios

**Backend:** Fastify (faster than Express, has built-in schema validation), Socket.IO (real-time game + chat), Knex.js (SQL query builder with migrations), SQLite (simple and easy to deploy), bcrypt (password hashing), JWT (auth tokens), Speakeasy (2FA/TOTP), google-auth-library (OAuth)

**DevOps:** Docker + Docker Compose (single-command deployment), Nginx (reverse proxy, SSL termination, WebSocket proxying), OpenSSL (auto-generated HTTPS certs), Makefile

## Database Schema

```
users  ─────┬──── characters (1:N) ──── matches (N:M)
  │         │                        
  │         │                        
  ├── friends (N:M, self-ref)
  ├── chat_participants ── chats ── messages (1:N)
  ├── notifications (1:N)
  └── refresh_tokens (1:N)

```

**Main tables:** `users` (auth + profile), `characters` (stats, level, ELO), `matches` (PvP records), `friends` (relationships), `chats`/`messages` (chat system), `notifications`, `refresh_tokens`, `character_resources` (energy tracking)

All managed through 13 Knex.js migration files.

## Features

| Feature | Who built it |
|---------|-------------|
| Turn-based combat (Attack/Defend/Special, speed turns, crits) | ymrabeti |
| AI opponents (4 difficulty tiers, weighted decisions, ELO scaling) | ymrabeti |
| Character system (multiple slots, stat allocation, sprites, leveling) | ymrabeti, ahashem |
| WebSocket infrastructure (Socket.IO server setup, connection handling) | ymrabeti, reahmed |
| Real-time chat (persistent history, read receipts, blocking) | reahmed |
| Friends panel (requests, accept/decline, online status) | reahmed |
| Notification system (messages, friend requests, match results) | reahmed |
| User profiles (avatar upload, bio, match history display) | fishaq |
| User management (CRUD, search, account deletion) | fishaq |
| Auth flows (registration, login, password change) | imqandyl |
| 2FA with Google Authenticator (TOTP, QR code setup) | imqandyl |
| Google OAuth sign-in | imqandyl |
| Backend API (Fastify routes, JSON Schema validation, Swagger) | imqandyl |
| Database design (13 migrations, indexes, Knex.js) | imqandyl |
| Docker deployment (Compose, auto SSL, Makefile) | imqandyl |
| Frontend UI/UX (React pages, Tailwind pixel-art theme) | ymrabeti,ahashem |
| Game canvas (Phaser 3 scenes, sprite rendering) | ymrabeti |
| Security (bcrypt, rate limiting, CORS, HTTPS, input sanitization) | imqandyl |
| Privacy Policy & Terms of Service pages | ahashem |
| Shop system and leaderboard | ymrabeti |

## Modules (17 points)

| # | Module | Category | Type | Pts | Who |
|---|--------|----------|------|-----|-----|
| 1 | **Use frameworks (frontend + backend)** | Web | Major | 2 | imqandyl, ahashem, ymrabeti |
| 2 | **Real-time features (WebSockets)** | Web | Major | 2 | reahmed, ymrabeti |
| 3 | **User interaction (chat + profile + friends)** | Web | Major | 2 | reahmed, fishaq |
| 4 | **Standard user management** | User Mgmt | Major | 2 | fishaq |
| 5 | **Web-based game** | Gaming | Major | 2 | ymrabeti |
| 6 | **AI Opponent** | AI | Major | 2 | ymrabeti |
| 7 | **Notification system** | Web | Minor | 1 | reahmed |
| 8 | **OAuth 2.0 (Google)** | User Mgmt | Minor | 1 | imqandyl |
| 9 | **Two-Factor Auth (2FA)** | User Mgmt | Minor | 1 | imqandyl |
| 10 | **Game stats & match history** | User Mgmt | Minor | 1 | ymrabeti, fishaq |
| 11 | **ORM (Knex.js)** | Web | Minor | 1 | imqandyl |

**6 Major (12 pts) + 5 Minor (5 pts) = 17 points total (minimum required: 14)**

### Module justifications

1. **Frameworks** - React 18 with hooks and component architecture for frontend. Fastify with built-in validation and plugin system for backend. Both are proper frameworks with routing, state management, and ecosystems.
2. **WebSockets** - Socket.IO handles real-time game state sync during PvP battles, live chat messaging, and instant notifications. Graceful connection/disconnection handling.
3. **User interaction** - Chat with persistent messages and blocking, user profiles with avatars, friend system with add/remove/accept/block.
4. **User management** - Profile updates, avatar upload with default fallback, friend list with online status, dedicated profile page with stats.
5. **Web-based game** - Turn-based PvP combat with Phaser 3. Clear rules, win/loss conditions, ELO ranking. Players choose Attack/Defend/Special each turn.
6. **AI Opponent** - 4 difficulty levels (Easy to Expert). Scales with player level and ELO. Uses weighted probability to pick moves based on health ratios, turn count, and stat matchups. Simulates human-like play.
7. **Notifications** - Full CRUD notification system for messages, friend requests, match results. Aggregation to prevent spam. Mark-as-read support.
8. **OAuth** - Google Sign-In via google-auth-library. Token verification, account creation/linking, refresh token management.
9. **2FA** - TOTP via Speakeasy. QR code generation, 6-digit code validation, enable/disable flows.
10. **Game stats** - Win/loss tracking, ELO ranking, match history with dates and opponents, leaderboard. Requires game module (implemented).
11. **ORM** - Knex.js for all DB operations. 13 migrations, parameterized queries, transaction support.

## Individual Contributions

**ymrabeti (PM + Developer)** - Managed the team, planned sprints. Built the entire game engine: Phaser 3 integration (BattleScene, game config), combat service (damage calc, crits, speed turns), AI opponent system (4 difficulty tiers with weighted decision-making), territory wars, crime missions, shop, character progression, and leaderboard. Biggest challenge was syncing real-time game state between players and balancing the AI.

**imqandyl (Tech Lead + Developer)** - Set up the whole technical architecture. Built the Fastify backend (app.js, routes, middleware, schemas), designed the database (13 Knex.js migrations), implemented JWT auth with refresh tokens, bcrypt password hashing, Google OAuth, and the full 2FA system with Speakeasy. Handled all DevOps: Docker multi-stage builds, Docker Compose, Nginx reverse proxy, SSL auto-generation, and the Makefile. Also did rate limiting, CORS, input sanitization, and HTTPS config. Hardest part was getting nginx to properly proxy WebSockets with SSL.

**ahashem (PO + Developer)** - Designed the pixel-art visual theme, created the custom Tailwind CSS config with retro colors, built React page layouts and responsive design. Worked on character sprites and battle scene visuals. Created the Privacy Policy and Terms of Service pages. Challenge was making pixel art look crisp across different screen sizes.

**reahmed (Developer)** - Owned the entire WebSocket infrastructure: set up Socket.IO on the backend (socketSetup.js), configured connection handling, authentication middleware for sockets, and event management. Built the real-time chat system (wsChatRoutes.js, useWebSocketChat.js hook) with persistent messages, read receipts, and user blocking. Implemented the friends panel (FriendsPanel.js, Friend.js model) with request/accept/decline/block flows. Built the notification system (Notification.js model, 292 lines) supporting message alerts, friend requests, and match results with aggregation. Toughest part was handling WebSocket reconnections and preventing duplicate notifications.

**fishaq (Developer)** - Built the user profile page with avatar upload (file type/size validation, base64 conversion), username/email editing, and stats display. Implemented user CRUD operations (userRoutes.js, userController.js), search, and account deletion. Handled registration/login forms with frontend validation, password change flow, and the settings page. Integrated match history display and leaderboard ranking into profiles. Challenge was getting avatar uploads working with proper validation on both frontend and backend.

## Resources

- [Fastify](https://fastify.dev/docs/latest/), [React](https://react.dev/), [Phaser 3](https://phaser.io/docs/3.80.0), [Socket.IO](https://socket.io/docs/v4/), [Knex.js](https://knexjs.org/guide/), [Tailwind CSS](https://tailwindcss.com/docs), [Docker](https://docs.docker.com/), [Speakeasy](https://github.com/speakeasyjs/speakeasy), [Google OAuth](https://github.com/googleapis/google-auth-library-nodejs), [bcrypt](https://github.com/kelektiv/node.bcrypt.js), [Nginx SSL](https://nginx.org/en/docs/http/configuring_https_servers.html)


**Run it:** `make` then open https://localhost:8443
