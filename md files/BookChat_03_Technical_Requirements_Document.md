# 🏗 BookChat — Technical Requirements Document (TRD)

**Companion documents:** `01_Vision_and_Design_Document.md`, `02_Product_Requirements_Document.md`
**Version:** 1.0
**Status:** Ready for handoff to development / AI coding agent

---

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Vite | SPA, deployed on Netlify |
| Realtime/backend | Node.js + Express + Socket.IO | Deployed on Render |
| Database | PostgreSQL (Neon, serverless) | Connection pooling via Neon's pooled connection string |
| ORM | Prisma | Schema-first, migrations |
| Auth | JWT (access + refresh token pair) via httpOnly cookies | See §5 |
| Grid/table utility | Handsontable | Reserved for any tabular admin/export views if needed; not core to chat UI |
| Styling | CSS Modules or Tailwind (developer's choice) + custom design tokens per Vision doc | Terracotta-and-sage token set noted in project history — reconcile with Vision doc's cream/wood/ink/olive/brass palette before implementation (see §2 note) |
| Realtime transport | Socket.IO (WebSocket with polling fallback) | |
| File storage (if attachments added later) | Deferred — recommend S3-compatible bucket when Phase 2 attachments are built | |

> **Note on palette naming:** prior project notes reference a "terracotta-and-sage" design system from earlier sessions; this brief's Vision doc specifies cream/beige/wood-brown/ink/olive/brass. Treat olive-green + brass as the closest reconciliation (olive ≈ sage-adjacent, brass ≈ warm terracotta-adjacent accent) unless the developer is told otherwise — flag for a quick confirmation before finalizing CSS tokens.

---

## 2. Resolved Data Model Ambiguity (read before building schema)

The PRD flagged an open question: does a **Book** contain multiple addressable conversations, or is a Book itself always one single thread?

**Resolution adopted for this TRD:** A **Book** is a container/space (e.g., "The Smith Family," "Me & Alex"). Within a Book, one or more **Conversations** exist:
- Every Book automatically gets one default **group Conversation** including all its members (this satisfies "every message in the book is visible to the book" for simple use cases).
- Optionally, members can start a **direct Conversation** with one other member within the same Book (this satisfies the left-page "stacked paper strips" showing individual **User Names** as described in the Vision doc).

This keeps the simple case simple (a 2-person Book = effectively just one DM conversation, auto-created) while supporting the richer "conversation list inside a Book" described in the source brief. If the developer/product owner prefers to hard-simplify to **one Book = one Conversation only** (dropping sub-conversations entirely), the schema below can be trimmed by removing the `Conversation` join layer and pointing `Message.bookId` directly — this is called out inline in §4.

---

## 3. Folder Structure

```
bookchat/
├── apps/
│   ├── client/                      # React + Vite frontend (Netlify)
│   │   ├── public/
│   │   │   └── assets/
│   │   │       ├── textures/        # paper, wood-grain, leather textures
│   │   │       └── fonts/
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── routes/
│   │   │   │   ├── AuthPage.tsx
│   │   │   │   ├── OnboardingPreamble.tsx
│   │   │   │   ├── BookSelectionPage.tsx
│   │   │   │   └── MainBookView.tsx
│   │   │   ├── components/
│   │   │   │   ├── book/
│   │   │   │   │   ├── ClosedBook.tsx
│   │   │   │   │   ├── BookOpenAnimation.tsx
│   │   │   │   │   ├── LeftHardcoverNav.tsx
│   │   │   │   │   ├── LeftPageConversationList.tsx
│   │   │   │   │   ├── RightPageWritingArea.tsx
│   │   │   │   │   └── MessageEntry.tsx
│   │   │   │   ├── theme/
│   │   │   │   │   ├── ThemePullTab.tsx
│   │   │   │   │   └── ThemePanel.tsx
│   │   │   │   ├── onboarding/
│   │   │   │   │   ├── DisplayNameModal.tsx
│   │   │   │   │   └── GuidedTour.tsx
│   │   │   │   └── shared/
│   │   │   ├── hooks/
│   │   │   │   ├── useSocket.ts
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useTheme.ts
│   │   │   ├── stores/               # Zustand/Redux — developer's choice
│   │   │   ├── themes/
│   │   │   │   ├── paper.tokens.ts
│   │   │   │   ├── anime.tokens.ts
│   │   │   │   └── reserved.tokens.ts
│   │   │   ├── lib/
│   │   │   │   └── apiClient.ts
│   │   │   └── styles/
│   │   └── vite.config.ts
│   │
│   └── server/                       # Express + Socket.IO backend (Render)
│       ├── src/
│       │   ├── index.ts              # server bootstrap
│       │   ├── socket/
│       │   │   ├── index.ts          # Socket.IO server setup
│       │   │   ├── handlers/
│       │   │   │   ├── message.handlers.ts
│       │   │   │   ├── presence.handlers.ts
│       │   │   │   └── book.handlers.ts
│       │   │   └── middleware/
│       │   │       └── socketAuth.ts
│       │   ├── routes/
│       │   │   ├── auth.routes.ts
│       │   │   ├── user.routes.ts
│       │   │   ├── book.routes.ts
│       │   │   ├── conversation.routes.ts
│       │   │   └── message.routes.ts
│       │   ├── controllers/
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── book.service.ts
│       │   │   └── message.service.ts
│       │   ├── middleware/
│       │   │   ├── requireAuth.ts
│       │   │   ├── errorHandler.ts
│       │   │   └── rateLimit.ts
│       │   ├── utils/
│       │   │   └── joinCode.ts        # unique code generator
│       │   └── prisma/
│       │       └── client.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── package.json
│
├── packages/
│   └── shared-types/                  # shared TS types/DTOs between client & server
│
├── .env.example
├── package.json                       # workspace root (npm/pnpm workspaces)
└── README.md
```

---

## 4. Database Schema (Prisma)

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String
  displayName     String
  hasSeenPreamble Boolean   @default(false)
  hasSeenTour     Boolean   @default(false)
  themePreference String    @default("paper") // "paper" | "anime" | "reserved"
  defaultBookId   String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  memberships     BookMember[]
  messages        Message[]
  createdBooks    Book[]              @relation("BookCreator")
  conversations   ConversationMember[]

  defaultBook     Book?     @relation("DefaultBook", fields: [defaultBookId], references: [id], onDelete: SetNull)
}

model Book {
  id              String    @id @default(cuid())
  name            String
  joinCode        String    @unique
  passwordHash    String?             // null = no password
  creatorId       String
  creator         User      @relation("BookCreator", fields: [creatorId], references: [id])
  createdAt       DateTime  @default(now())

  members         BookMember[]
  conversations   Conversation[]
  defaultForUsers User[]    @relation("DefaultBook")
}

model BookMember {
  id        String   @id @default(cuid())
  bookId    String
  userId    String
  role      String   @default("member") // "creator" | "member"
  joinedAt  DateTime @default(now())

  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([bookId, userId])
}

// --- See §2: this Conversation layer can be removed if product decides
// a Book is always exactly one thread. Kept here to support the
// left-page "conversation list of people" behavior from the Vision doc.
model Conversation {
  id          String   @id @default(cuid())
  bookId      String
  isGroup     Boolean  @default(false) // true = the Book's auto-created all-member thread
  createdAt   DateTime @default(now())

  book        Book                  @relation(fields: [bookId], references: [id], onDelete: Cascade)
  members     ConversationMember[]
  messages    Message[]

  @@index([bookId])
}

model ConversationMember {
  id             String   @id @default(cuid())
  conversationId String
  userId         String
  lastReadAt     DateTime? // powers unread indicator

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([conversationId, userId])
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  senderId       String
  content        String   @db.Text
  status         String   @default("sent") // "sent" | "delivered" | "failed_pending_retry"
  createdAt      DateTime @default(now())
  editedAt       DateTime?
  deletedAt      DateTime? // soft delete

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User         @relation(fields: [senderId], references: [id])

  @@index([conversationId, createdAt])
}
```

**Indexes/constraints called out explicitly:**
- `Book.joinCode` unique, generated via a collision-checked short code (see `utils/joinCode.ts`, recommend 8-character base32 excluding ambiguous characters like `0/O`, `1/I`).
- `Message` indexed on `(conversationId, createdAt)` to support efficient reverse-chronological pagination (see §6.4).
- Cascade deletes: removing a Book removes its memberships, conversations, and messages. Removing a User cascades their memberships and conversation memberships but **not** their sent messages (kept for other members' history — sender relation has no cascade; consider anonymizing `senderId`/`displayName` snapshot instead of hard-deleting content if account deletion is later supported).

---

## 5. Authentication

- **Strategy:** JWT access token (short-lived, ~15 min) + refresh token (long-lived, ~30 days), both delivered as httpOnly, Secure, SameSite=Lax cookies (never exposed to client JS) to mitigate XSS token theft.
- **Password hashing:** bcrypt (or argon2id, preferred if available in the runtime), cost factor tuned per Render instance CPU budget.
- **Endpoints:**
  - `POST /api/auth/signup` — `{ email, password }` → creates User, sets cookies, returns user profile (no password hash).
  - `POST /api/auth/login` — `{ email, password }` → validates, sets cookies, returns user profile.
  - `POST /api/auth/refresh` — rotates access token using refresh cookie.
  - `POST /api/auth/logout` — clears cookies, optionally blacklists refresh token (recommend a `RefreshToken` table with revocation if time allows; otherwise short refresh TTL is an acceptable v1 tradeoff).
- **Socket auth:** On socket connection, the client sends the access token (from cookie, forwarded via `withCredentials`); `socketAuth.ts` middleware verifies the JWT before allowing the connection to join any Book/Conversation rooms. Reject unauthenticated sockets immediately.
- **Rate limiting:** Login and signup endpoints rate-limited per IP (e.g., 10 attempts / 15 min) to blunt credential-stuffing, per PRD's baseline security expectation.

---

## 6. REST API Surface

All routes prefixed `/api`. All (except auth) require a valid access token.

### 6.1 User / Onboarding
- `GET /users/me` — current user profile + flags (`hasSeenPreamble`, `hasSeenTour`, `themePreference`, `defaultBookId`)
- `PATCH /users/me` — update `displayName`, `themePreference`, `defaultBookId`
- `POST /users/me/preamble-seen` — sets `hasSeenPreamble = true`
- `POST /users/me/tour-seen` — sets `hasSeenTour = true` (and a separate `POST /users/me/tour-replay` simply re-triggers client-side tour without touching the flag)

### 6.2 Books
- `POST /books` — `{ name, password?, setAsDefault? }` → creates Book, generates joinCode, creates creator's `BookMember` (role: creator), auto-creates the group `Conversation`.
- `GET /books` — list current user's Books (with unread summary per Book).
- `GET /books/:bookId` — Book detail (members, conversations the requester participates in).
- `POST /books/join` — `{ joinCode, password? }` → validates code/password, creates `BookMember`, adds user to the group Conversation.
- `PATCH /books/:bookId` — update name/password/creator-only settings.
- `DELETE /books/:bookId` — creator-only, cascades per schema; broadcasts a socket event so active viewers are redirected (PRD US-15).
- `DELETE /books/:bookId/members/:userId` — creator-only removal (PRD US-14); broadcasts a `book:member_removed` socket event to force the removed client out of the room.

### 6.3 Conversations (only if the sub-conversation model from §2 is kept)
- `GET /books/:bookId/conversations` — list conversations the current user participates in within this Book (this powers the left page).
- `POST /books/:bookId/conversations` — `{ targetUserId }` → creates or returns existing 1:1 conversation with another Book member.

### 6.4 Messages
- `GET /conversations/:conversationId/messages?cursor=&limit=50` — cursor-based (createdAt+id) reverse-chronological pagination for infinite scroll-up (PRD US-17). Default `limit=50`, max `100`.
- `POST /conversations/:conversationId/messages` — REST fallback for sending (primary path is the socket event in §7, but a REST endpoint should exist for resilience/testing and for environments where sockets are momentarily unavailable).
- `PATCH /conversations/:conversationId/messages/:messageId` — edit (sets `editedAt`); only sender.
- `DELETE /conversations/:conversationId/messages/:messageId` — soft delete (sets `deletedAt`); only sender or Book creator.

---

## 7. Socket.IO Events

**Rooms:** clients join a Socket.IO room per active `conversationId` they have open, and a room per `bookId` for Book-level events (member removed, book deleted, presence).

### 7.1 Client → Server
| Event | Payload | Purpose |
|---|---|---|
| `conversation:join` | `{ conversationId }` | Join the socket room for an open conversation |
| `conversation:leave` | `{ conversationId }` | Leave when navigating away |
| `message:send` | `{ conversationId, content, clientTempId }` | Send a message (optimistic UI reconciled via `clientTempId`) |
| `message:read` | `{ conversationId, upToMessageId }` | Update `lastReadAt` for unread indicator |
| `presence:heartbeat` | `{}` | Periodic ping to maintain online status (or rely on socket connect/disconnect if heartbeat is unnecessary) |
| `typing:start` / `typing:stop` | `{ conversationId }` | Reserved for Phase 2 typing indicators — architect the room structure to support this even if UI isn't built in v1 |

### 7.2 Server → Client
| Event | Payload | Purpose |
|---|---|---|
| `message:new` | full `Message` object | Broadcast to all sockets in the conversation room |
| `message:sent_ack` | `{ clientTempId, message }` | Reconciles sender's optimistic entry with the persisted message |
| `message:failed` | `{ clientTempId, reason }` | Triggers the "unsent, faded ink" retry state (PRD US-20) |
| `message:updated` | updated `Message` | Edit/soft-delete broadcast |
| `book:member_removed` | `{ bookId, userId }` | Forces the removed client to leave the Book room and redirects UI |
| `book:deleted` | `{ bookId }` | Forces all active viewers out with a themed notice |
| `presence:update` | `{ userId, status }` | Online/offline dot updates (PRD US-18) |
| `conversation:unread_update` | `{ conversationId, unreadCount }` | Drives the left-page notification indicator |

**Reconnect handling:** on reconnect, client re-joins all previously-open conversation/book rooms and requests a delta sync (`GET /conversations/:id/messages?since=<lastKnownMessageId>`) to backfill anything missed while disconnected — this directly supports PRD US-20's offline queue/retry requirement.

---

## 8. Frontend Animation Implementation Notes

(Reference: Vision Doc §6 for the intended *feel*; this section is the technical "how.")

- **Book open animation:** implement as a CSS 3D transform (`perspective` + `rotateX`/`rotateY` on cover + page layers) or a dedicated library (e.g., Framer Motion for orchestration, optionally a lightweight page-flip library such as `react-pageflip` for the curl effect) — evaluate `react-pageflip` specifically for the page-turn/curl interactions in §4.3 of Vision doc; if its physics don't match the desired feel, a custom SVG-clip-path curl is an acceptable fallback.
- **Theme pull-tab:** implement with pointer events (`onPointerDown/Move/Up`), track vertical drag delta, apply resistance via an easing curve (e.g., `1 - Math.exp(-delta/k)`) rather than linear following, and cross a defined pixel threshold to commit to "open panel" state; use Framer Motion's `useDragControls` if adopted for consistency with other motion in the app.
- **Message ink-reveal:** for the sender's own new message only, a simple CSS `clip-path` inset animation (left-to-right reveal) approximates "handwriting appearing" cheaply without needing an actual stroke-order font animation. Do not apply this to every incoming message at scale — reserve for the sender's freshly sent entry per Vision doc guidance, to protect perceived performance in busy conversations.
- **Reduced motion:** respect `prefers-reduced-motion` — all page-turn/curl/pull-tab animations should have a substantially shortened or cross-fade fallback for accessibility, per PRD §5 non-functional accessibility requirement.

---

## 9. Deployment

| Component | Platform | Notes |
|---|---|---|
| Frontend | Netlify | Connect repo, build command `vite build`, publish `apps/client/dist`. Environment variable for API base URL (`VITE_API_URL`) pointed at Render backend. |
| Backend | Render (Web Service) | Node runtime, `npm run start` after `npm run build` (if TS compiled) or `ts-node`/`tsx` in production if preferred. Health check endpoint `GET /health`. |
| Database | Neon (PostgreSQL, serverless) | Use the pooled connection string for the Render app (`DATABASE_URL` with `-pooler` host) to avoid exhausting connections; use the direct (non-pooled) URL only for `prisma migrate deploy` in CI. |
| Sockets | Same Render service as REST API | Ensure Render service plan supports persistent WebSocket connections (confirm on the plan tier used); enable sticky sessions if the service ever scales to multiple instances, or move to a Redis adapter for Socket.IO (`@socket.io/redis-adapter`) once horizontal scaling is needed. |
| Secrets | Netlify env vars (frontend, public-safe only) + Render env vars (backend: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`) | Never expose JWT secrets or DB URL to the frontend. |
| CORS | Backend restricts `Access-Control-Allow-Origin` to the Netlify domain(s), with `credentials: true` to allow httpOnly cookies cross-origin. | |

### 9.1 Environments
Recommend at minimum: `development` (local, local Postgres or Neon dev branch), `staging` (Neon branch + Render preview + Netlify deploy preview), `production`. Neon's branching feature is well suited to spinning up a disposable staging database per PR if the developer wants CI-backed preview environments.

---

## 10. Implementation Workflow (Suggested Build Order)

1. **Foundations:** monorepo scaffold, Prisma schema + first migration, basic Express server with `/health`, Vite React app skeleton with routing shell.
2. **Auth:** signup/login/logout/refresh endpoints + cookie handling; Closed Book auth screen UI (static, no animation yet).
3. **Book core:** create/join Book endpoints + UI forms (unstyled functional first); Book selection page.
4. **Onboarding flow:** display-name modal, Preamble page, guided tour scaffold (can be a simple step-through initially, polish later).
5. **Messaging core:** Conversation + Message models wired to REST endpoints; basic non-realtime message list/send to validate data flow.
6. **Realtime layer:** Socket.IO server + client hook, wire `message:send`/`message:new`, presence, unread counts.
7. **Visual system pass:** apply Vision doc's palette/typography/textures to all screens built so far (this is intentionally sequenced *after* functionality, not before, to avoid re-theming broken flows).
8. **Signature animations:** book-open animation, page-turn transitions, pull-tab theme switcher, guided-tour highlight polish, message ink-reveal.
9. **Theme system:** implement token-swapping for Paper/Anime themes; leave the third theme as a structurally-wired-but-unstyled placeholder per PRD open question #4.
10. **Edge cases & resilience:** offline message queue/retry, reconnect delta sync, error states table from PRD §6, rate limiting.
11. **Accessibility & responsive pass:** reduced-motion fallbacks, mobile single-page-at-a-time collapse (PRD §5), keyboard nav audit.
12. **Deployment wiring:** Netlify + Render + Neon environment setup, CORS, health checks, staging verification.
13. **QA against PRD acceptance criteria**, checklist walkthrough of every US-# in the PRD before calling v1 complete.

---

## 11. Testing Notes

- Unit test Prisma service functions (Book creation/join logic, join-code collision handling, message pagination cursor logic).
- Socket integration tests: simulate two connected clients in the same conversation room, assert `message:new` delivery and `message:sent_ack` reconciliation.
- E2E (Playwright/Cypress) for the full first-time-user flow (signup → name → preamble → create book → tour) since this is the highest-risk multi-step flow for regressions.
