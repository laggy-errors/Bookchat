# 📋 BookChat — Product Requirements Document (PRD)

**Companion documents:** `01_Vision_and_Design_Document.md`, `03_Technical_Requirements_Document.md`
**Version:** 1.0
**Status:** Ready for handoff to development / AI coding agent

---

## 1. Purpose & Scope

This PRD defines every feature, user flow, user story, and edge case required to build BookChat v1 — a real-time, book-themed group messaging application. It assumes the visual/interaction language defined in the Vision & Design Document and should be read alongside it. This document is functionality-first; it intentionally avoids prescribing implementation details (see the TRD for those).

### 1.1 In Scope (v1)
- Email/password authentication (sign up, sign in, logout)
- Book (chat room) creation, joining via code, optional password protection
- Default Book selection
- Real-time messaging within a Book (1:1 and group, since a Book can have 2+ members)
- Conversation list (left page) per Book
- Message composer and thread (right page)
- Theme system (Paper default, Anime, one reserved theme slot) with the pull-tab switcher
- First-time user onboarding (name capture → Preamble → guided tour)
- Returning-user auto-open of default Book
- Basic notification indicators (unread counts / new-message markers)
- Settings (profile, default Book, logout, theme)

### 1.2 Out of Scope (v1 — explicitly deferred)
- Voice/video calling
- Message reactions/emoji
- File/image attachments beyond basic image sharing (flag as Phase 2 unless the developer confirms otherwise)
- Message editing/deletion history (soft-delete only, see §7)
- Push notifications to native mobile (web-based only for v1)
- Multi-language / i18n
- Admin/moderation tooling beyond "creator can remove members"

---

## 2. Personas

| Persona | Description | Primary need |
|---|---|---|
| **The Storyteller** | Creates a Book, invites 2–5 close friends/family, uses it like a shared journal | Warmth, low friction, emotional resonance |
| **The Correspondent** | Uses BookChat 1:1 with a single person (partner, best friend) | Intimacy, message history, reliability |
| **The Returning User** | Already onboarded, opens the app daily | Speed — land directly in their default Book |

---

## 3. User Stories & Acceptance Criteria

### 3.1 Authentication

**US-1:** As a new user, I want to sign up with email and password so that I can create an account.
- AC: Email must be valid format and unique; password meets minimum strength (see TRD §Auth).
- AC: On success, user is logged in immediately and routed into the New User Flow (§4).
- AC: Duplicate email shows an inline, book-toned error ("That name is already written in our ledger.") — no harsh system error text.

**US-2:** As a returning user, I want to sign in with email and password so that I can access my Books.
- AC: Invalid credentials show a single generic error (do not reveal whether email or password was wrong, for security).
- AC: Successful login triggers the Opening Animation (book cover → open pages) before showing the main interface.

**US-3:** As a user, I want to log out so that my session ends securely.
- AC: Logout is accessible from the left hardcover navigation.
- AC: Logout clears session/token and returns to the Closed Book auth screen.

**US-4 (edge case):** As a user, if my session expires while I'm active, I should be gracefully returned to the auth screen without losing an in-progress unsent message where reasonably possible (draft retained in local state until re-auth).

### 3.2 New User Onboarding

**US-5:** As a first-time user, immediately after signing up, I am asked for a display name via a centered popup.
- AC: Name is required, 1–50 characters, profanity/empty-string validated.
- AC: Cannot be dismissed without a valid name (no "skip" in v1).

**US-6:** As a first-time user, after naming myself, I see the Preamble page explaining the four house rules verbatim as specified in the Vision doc (create/join a Book via code; every Book has a unique code; multiple Books allowed; switching Books is free) plus the closing line.
- AC: Preamble is shown exactly once per account (tracked via a `hasSeenPreamble` flag), never again on subsequent logins.
- AC: A clear, book-styled "Continue" affordance closes the Preamble.

**US-7:** As a first-time user, after closing the Preamble, I see an empty book interface with a centered "Create Book" call to action (joining via code is also possible from here — see US-9).

**US-8:** As a first-time user, once I create my first Book, a guided tour introduces each major UI region (Books list, writing area, invite mechanism, theme tab) one at a time with dismissible/advanceable steps.
- AC: Tour can be skipped entirely at any step.
- AC: Tour is shown once per account (`hasSeenTour` flag) and is not repeated on later logins, but should be re-triggerable manually from Settings ("Replay tour").

### 3.3 Book (Room) Management

**US-9:** As a user, I want to create a Book by providing a name, an optional password, and a default-Book toggle.
- AC: Book Name required, 1–60 chars.
- AC: Password optional; if set, stored hashed, never returned to any client.
- AC: A unique Join Code is generated automatically (human-shareable format, see TRD).
- AC: If "Set as default" is toggled, this Book becomes the auto-opened Book on future logins (and unsets any prior default for this user).

**US-10:** As a user, I want to join an existing Book using a Join Code.
- AC: If the Book requires a password, prompt for it before granting access; wrong password shows inline error, no lockout in v1 beyond basic rate-limiting (see TRD security notes).
- AC: If no password, joining is immediate on valid code.
- AC: Invalid/unknown code shows a book-toned error ("No page matches that code.").
- AC: A user cannot join the same Book twice (idempotent — if already a member, just open it).

**US-11:** As a user, I want to switch between my Books from the left hardcover navigation ("Change Book").
- AC: Switching triggers a page-turn style transition (not a hard reload) per the Vision doc.
- AC: The previously open Book's scroll position/draft message is preserved in memory for the session.

**US-12:** As a Book creator, I want to designate (or change) which Book is my default, so it auto-opens on future logins.
- AC: Only one default Book per user at a time.
- AC: Default can be changed from Settings or from the Book's own settings panel.

**US-13 (edge case):** As a user, if my default Book is deleted or I am removed from it, the next login should fall back to the Book selection screen rather than erroring.

**US-14:** As a Book creator, I want to remove a member from my Book.
- AC: Only the creator (or a role explicitly granted — see TRD roles) can remove members.
- AC: Removed member loses access to the Book immediately (including any live socket connection) and it disappears from their Book list.

**US-15:** As a Book creator, I want to delete a Book entirely.
- AC: Requires a confirmation step (typed confirmation or double-confirm modal), since this is destructive and removes access for all members.
- AC: All members are notified/redirected if they are actively viewing the deleted Book.

### 3.4 Messaging

**US-16:** As a user inside a Book, I want to send a real-time text message that all other members see immediately.
- AC: Message appears in the sender's UI optimistically, then confirmed/reconciled once the server acknowledges.
- AC: Other online members receive the message via a live connection without needing to refresh.
- AC: Message includes sender name, timestamp, and content, rendered as a handwritten-style entry per the Vision doc.

**US-17:** As a user, I want to see message history when I open a conversation, loaded in reasonable pages (infinite scroll upward) rather than all at once.
- AC: Initial load returns the most recent N messages (see TRD pagination defaults); scrolling up loads older messages.

**US-18:** As a user, I want to see who is online/active within a Book.
- AC: A lightweight presence indicator is acceptable for v1 (online/offline dot); typing indicators are a nice-to-have, not required for v1 but should be architected for (see TRD Socket.IO events).

**US-19:** As a user, I want unread messages to be visually indicated on the conversation list (left page) so I know where to look.
- AC: Unread state clears when the user opens/views that conversation.
- AC: Indicator style follows the Vision doc (ink dot / folded-corner motif, not a loud red badge).

**US-20 (edge case):** As a user, if I send a message while offline/disconnected, it should be queued locally and retried on reconnect, with a visible "not yet sent" state on the entry (e.g., faded ink) rather than silently failing.

**US-21 (edge case):** As a user, extremely long messages should be handled gracefully (soft max length with a counter, e.g., 5,000 characters) rather than breaking the page layout.

### 3.5 Theme System

**US-22:** As a user, I want to change the app's visual theme using the pull-tab interaction described in the Vision doc.
- AC: Dragging the bottom-center tab upward past a threshold reveals the theme panel; releasing below threshold snaps the tab back down.
- AC: Selecting a theme applies immediately across the whole interface without a page reload.
- AC: Selected theme persists per-user across sessions.

**US-23:** As a user, my theme choice should not affect other members' view of the same Book (theme is a personal display preference, not a Book-level setting).

### 3.6 Settings

**US-24:** As a user, I want a Settings area accessible from the left hardcover where I can: update my display name, change my default Book, change my theme (alternative entry point to the pull-tab), replay the guided tour, and log out.

**US-25 (edge case):** As a user, if I try to change my password (if supported) or email, I should be asked to re-authenticate first (security best practice) — flag for developer confirmation whether email/password change is in v1 scope.

---

## 4. Core Flows (Sequenced)

### 4.1 First-Time User Flow
1. Land on Closed Book auth screen → Sign Up
2. Enter email/password → account created → auto-logged-in
3. Opening Animation plays
4. Display name popup (required)
5. Preamble page shown (once ever)
6. Empty book interface with centered "Create Book"
7. User creates first Book (name, optional password, default toggle)
8. Guided tour plays across Books nav / writing area / invite / theme tab
9. User lands in their first Book, ready to write

### 4.2 Returning User Flow
1. Land on Closed Book auth screen → Sign In
2. Opening Animation plays
3. If default Book exists → auto-open it directly into the main interface
4. If no default Book → show Book selection page (list of joined Books + Create/Join actions)

### 4.3 Joining a Friend's Book
1. User receives a Join Code out-of-band (verbally, text, etc. — no in-app sharing sheet required for v1 beyond "copy code")
2. From Book selection (or "Change Book" nav), user chooses "Join with code"
3. Enter code → if password-protected, enter password → joins → Book appears in list and opens

---

## 5. Non-Functional Requirements

- **Performance:** Message send-to-receive latency should feel instant (<300ms typical on a normal connection) to preserve the "writing together" illusion.
- **Reliability:** No message should be silently lost; failed sends must be visibly retried or flagged (US-20).
- **Accessibility:** Despite the decorative/handwritten aesthetic, body text must remain legible (sufficient contrast against paper texture) and the app must remain usable with keyboard navigation and screen readers for core actions (send message, switch Book, log in) — decorative fonts should not be used for content requiring high legibility at scale (see Vision §5.2).
- **Responsiveness:** Must degrade gracefully to mobile viewport — the "open book, two pages side by side" metaphor likely needs to collapse to a single-page-at-a-time view on narrow screens (left page list ⇄ right page writing area, navigable by swipe/page-turn), rather than being scaled down illegibly.
- **Security:** Passwords hashed at rest; Book passwords hashed at rest; standard session/token handling (see TRD).

---

## 6. Edge Cases & Error States (Consolidated)

| Scenario | Expected Behavior |
|---|---|
| Duplicate email at signup | Inline themed error, no account created |
| Wrong login credentials | Generic error, no field-specific hints |
| Invalid Join Code | Themed "no such page" error |
| Wrong Book password | Inline error, retry allowed |
| Joining a Book already a member of | Silently opens existing membership, no duplicate |
| Default Book deleted/removed-from | Fallback to Book selection screen |
| Message sent while offline | Queued, shown as unsent, retried on reconnect |
| Extremely long message | Soft character limit + counter |
| Session expiry mid-use | Graceful return to auth screen, draft preserved if feasible |
| Book deleted while member is viewing it | Member redirected out with a clear (themed) explanation |
| Removed from a Book while viewing it | Immediate access revocation, redirected to Book selection |
| Empty state, no Book selected | Centered "What should I write today?" prompt (does not apply until a Book exists — this is the writing-area empty state *within* a Book with no conversation partner selected, if the data model supports sub-threads; otherwise applies to the whole right page) |

*Note to developer:* the brief's phrase "What should I write today?" empty state assumes a Book may contain more than one addressable conversation/thread (e.g., a Book with multiple members might still route to a specific person). If a Book is instead always a single shared thread among all its members, this empty state instead applies to "no Book open yet." **Flag this ambiguity for confirmation before building** — see TRD §Data Model for the recommended resolution.

---

## 7. Data Retention & Moderation (v1 minimum)

- Messages: soft-delete only in v1 (a "delete for me" or "delete for everyone" toggle can be Phase 2). Flag for developer decision.
- No profanity filter required in v1; reserve as Phase 2.
- Book creator can remove members (US-14); no broader moderation roles in v1.

---

## 8. Phase 2 Candidates (explicitly deferred, not to be built now)

- Image/file attachments beyond simple inline images
- Typing indicators (architecture should allow easy addition — see TRD)
- Message reactions
- Read receipts (beyond basic unread indicator)
- Push notifications (native mobile)
- Third theme (concept undecided — see Vision §8)
- Admin roles beyond "creator"
- Message search within a Book

---

## 9. Open Questions for Developer / Product Confirmation

1. Can a Book contain more than one addressable "conversation" (e.g., sub-threads with individual members within a group Book), or is a Book always one single shared thread for all its members? This affects the left-page conversation list meaning significantly (list of *other Books/threads* vs. list of *members within this Book*). **Recommend resolving before backend schema is finalized** (see TRD §Data Model, Option A vs Option B).
2. Is email/password change in scope for v1 Settings, or deferred?
3. Is a maximum member count per Book desired for v1 (e.g., cap at 20)?
4. Should the third theme concept be selected before development starts, or is a placeholder theme slot (structurally present, visually unstyled) acceptable for v1 launch?
