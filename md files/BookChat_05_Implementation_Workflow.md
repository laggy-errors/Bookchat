# ✅ BookChat — Implementation Workflow

**Companion documents:** All prior BookChat docs (01–04), `BookChat_Sticky_Note_Notification_Prompt(1).md`, and `BookChat_Live_Pen_Writing_Animation_Prompt.md`
**Version:** 2.0
**Status:** Updated — Aligned with the physical open hardcover layout, falling sticky notes, and live pen writing.

---

## Phase 0 — Decisions to Lock Before Writing Code

These decisions have been finalized and locked:
*   [x] **Data model**: Book → Conversation nesting confirmed. A Book contains one default group conversation plus optional direct messages (DMs) between members.
*   [x] **Sidebar scope**: Option A. Sidebar scopes to the current Book's pages/conversations. Switching Books uses a slide-out overlay.
*   [x] **Theme roster**: Swapped Anime/TBD themes for 4 frames: Notebook (default), Archive Cabinet, Library, and Sticky Note Board. Swapping themes changes surrounding chrome, not core text.
*   [x] **Palette tokens**: Olive/Brass/Cream/Wood/Ink direction is locked.
*   [x] **V1 Constraints**: Max 25 members per book. Settings password/email changes are deferred to Phase 2.
*   [x] **Presence Sockets**: Managed natively via Socket connection state.
*   [x] **Notification system**: Skeuomorphic Paper Sticky Note Notifications (gravity drop, wobble, bounce, max 5, close with paper curl/fall off-screen).
*   [x] **Live Writing Pen**: Interactive fountain pen overlay synced to typing keys, backspaces, and pastes.

---

## Phase 1 — Foundations
*   [x] Initialize monorepo workspaces (`apps/client`, `apps/server`, `packages/shared-types`)
*   [x] Prisma schema authored and generated
*   [x] Express server boots with Socket.IO attached
*   [x] Vite + React client app configured with Tailwind CSS v4 and TS
*   [x] `.env.example` configurations created for server and root

---

## Phase 2 — Authentication
*   [ ] Write JWT auth controller and services (`POST /auth/signup`, `/auth/login`, `/auth/refresh`, `/auth/logout`)
*   [ ] Configure Secure httpOnly cookies for access/refresh tokens
*   [ ] Implement rate limiting on signup/login routes
*   [ ] Build Closed Book auth screen (3D hardcover layout, debossed parchment forms, no opening animation yet)

---

## Phase 3 — Book Core
*   [ ] Implement book endpoints (`POST /books`, `GET /books`, `POST /books/join`, delete and member removal)
*   [ ] Enforce the 25-member limit at Book creation and Book joining endpoints
*   [ ] Build join-code generator (`utils/joinCode.ts`) using collision-checked base32
*   [ ] Build Book Selection screen (resembles a wooden bookshelf shell; first created Book is auto-assigned as `defaultBookId`)

---

## Phase 4 — Onboarding Flow
*   [ ] Build display name modal (sepia dim overlay, blocks Main Book View if `displayName` is empty)
*   [ ] Build Preamble page (novel frontispiece styling, serif typography, drop cap, shown once)
*   [ ] Build guided tour (underlines elements with soft ink lines, displays handwritten tour captions)

---

## Phase 5 — Messaging Core
*   [ ] Implement Conversation and Message endpoints (including cursor-based reverse-chronological pagination)
*   [ ] Connect client page lists and message panels to REST endpoints to verify basic data flow
*   [ ] Implement local draft caching in `localStorage` keyed by user and conversation ID

---

## Phase 6 — Real-Time Layer
*   [ ] Implement Socket.IO authorization middleware (`socketAuth.ts`)
*   [ ] Wire `message:send` / `message:new` client-server sockets
*   [ ] Configure server presence tracking via connection and disconnect event listeners
*   [ ] Build message delta sync logic for socket reconnect events

---

## Phase 7 — Open Book Layout Grid
*   [ ] Build `BookShell` wrapper (renders wooden desk background, leather hardcover borders, stepped margins for page depth, and ambient drop shadows)
*   [ ] Build `BookGutter` (center spine gutter showing curved shadow gradients and binder stitching/rings)
*   [ ] Build `LeftPagePanel` (chat logs, navigation rail, search bar, printed look)
*   [ ] Build `RightPagePanel` (ruler lines matching line height, conversation scroll body)
*   [ ] Build `ComposerBar` (anchored bottom-right, matches a fountain pen casing)
*   [ ] Build `RibbonBookmarkTab` (anchored top-right, hover triggers cloth sway animation)
*   [ ] Configure responsive collapse (scales to single-page-at-a-time below `960px` with page-curl swipes)

---

## Phase 8 — Visual Styling & Themes
*   [ ] Implement design token mappings (Paper, Cabinet, Library, Corkboard CSS variables)
*   [ ] Apply cream/wood/ink/brass/olive styles to all components
*   [ ] Build the `ThemePaletteStrip` preview component inside settings or pull-tab

---

## Phase 9 — Signature Animations
*   [ ] Implement 3D cover-open Y-rotation transition on login
*   [ ] Implement spring-based page-curl morphing for conversation/book switching
*   [ ] Implement the bottom-center pull-tab with elastic resistance and drag release
*   [ ] Implement the wet ink bleed SVG filter on message arrival
*   [ ] Implement the `LiveWritingPen` floating fountain pen tracking overlay component:
    *   [ ] Map keystroke changes to coordinate positions and trigger gold-nib drawing motions
    *   [ ] Create progressive line rendering with wet ink shine drying overlays (400ms)
    *   [ ] Write backspace slide-back and erasure animations
    *   [ ] Set up paste rapid scripts and idle rest loops
    *   [ ] Enforce `prefers-reduced-motion` instant typing caret fallbacks

---

## Phase 10 — Paper Sticky Note Notifications
*   [ ] Build `StickyNoteNotification` (renders a paper note card with random warm colors, close button, name, preview, and book badge)
*   [ ] Build `StickyNoteContainer` (defines safe zones, handles gravity fall, drift, wobble, and soft bounce spring physics)
*   [ ] Implement note closing (peels corner, shrinks, fades, and drops off-screen)
*   [ ] Implement note clicking (transforms to sheet, slides into target conversation)
*   [ ] Implement note overlapping logic (max 5 notes, collapses older into `+X Notes` tab)
*   [ ] Implement `prefers-reduced-motion` fallbacks (instant fade-in, no physics)

---

## Phase 11 — Edge Cases & Hardening
*   [ ] Enforce soft character limits and counter on composer
*   [ ] Handle default book deletion fallbacks
*   [ ] Conduct keyboard navigation audits on chat controls
*   [ ] Verify CORS security constraints and Neon connection pooling config

---

## Phase 12 — Deploy & Verify
*   [ ] Deploy frontend to Netlify, server to Render, database migrations to Neon PostgreSQL
*   [ ] Run end-to-end QA checks matching all product criteria
