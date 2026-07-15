# BookChat Feature Prompt — Sticky Note Notification System

## Feature Name
**Paper Sticky Note Notifications**

---

# Objective

Replace ordinary toast notifications with an immersive paper-themed notification system.

Whenever a new message arrives—whether from someone reading the **same book** or **another book**—a realistic sticky note should physically fall onto the screen as if someone placed a handwritten note inside a book.

The animation should feel handcrafted, cozy, premium, and magical rather than like a modern app notification.

---

# User Experience

When a new message is received:

1. Generate a realistic sticky note.
2. Spawn it above the visible screen.
3. Let it naturally fall using gravity.
4. Add a slight wobble and rotation while falling.
5. Make it bounce softly when it lands.
6. Stick it at a random safe location on the screen.
7. Keep it visible until the user manually dismisses it.

The notification must **never disappear automatically**.

---

# Visual Design

The sticky note should include:

- Slight paper texture
- Soft shadow
- Rounded corners
- Tiny imperfections
- Folded paper corner (optional)
- Handwritten-style typography
- Warm, soft colors

Randomly choose one of these colors:

- Soft Yellow
- Cream
- Mint
- Light Blue
- Pale Orange
- Soft Pink

---

# Animation

The motion should imitate real paper.

Sequence:

Spawn Above Screen

↓

Gravity Drop

↓

Small Rotation

↓

Tiny Horizontal Drift

↓

Soft Bounce

↓

Paper Wobble

↓

Stick To Screen

Use physics-based spring animations.

Avoid robotic or linear motion.

---

# Placement Rules

The note should land only in safe UI zones.

Examples:

- Top Left
- Upper Right
- Middle Left
- Middle Right
- Bottom Left
- Bottom Right

Never cover:

- Chat Input
- Navigation
- Reading Controls
- Profile
- Important Buttons

Multiple notes must intelligently avoid overlapping.

Maximum visible sticky notes:

**5**

If more arrive, collapse older notifications into:

> +3 Notes

Clicking expands them.

---

# Sticky Note Layout

Example:

📚 Same Book

**Aryan**

*"The ending shocked me!"*

2 sec ago

[X]

---

Another example:

🌍 Other Book

**Emma**

*"You'll love Chapter 8."*

Now

[X]

Include:

- Sender Avatar
- Sender Name
- Message Preview
- Time
- Book Badge
- Close Button

---

# Notification Types

## Same Book

Badge:

📚 Same Book

Use warm colors.

---

## Other Book

Badge:

🌍 Other Book

Use a slightly different accent color.

---

# Interaction

## Click Sticky Note

Animate:

Sticky Note

↓

Expand

↓

Transform into paper

↓

Slide into the correct chat

↓

Open conversation

---

## Close Sticky Note

Clicking the X should:

- Curl paper slightly
- Shrink
- Fade
- Fall downward
- Disappear

---

# Hover Effect

When hovered:

- Lift slightly
- Rotate a little
- Increase shadow
- Feel like real paper being touched

---

# Accessibility

Respect the browser setting:

prefers-reduced-motion

If enabled:

- Skip falling animation
- Fade gently into position

---

# Performance

Use GPU-friendly transforms only.

Animate:

- translate
- rotate
- scale
- opacity

Target smooth 60 FPS performance.

Avoid layout shifts.

---

# Overall Experience

The user should feel that another reader has physically slipped a handwritten sticky note into the pages of their digital book.

The animation should create the feeling of studying with friends in a quiet library where people leave notes for one another.

Never make this look like a standard toast notification.

The experience should be warm, tactile, charming, and memorable.

---

# Recommended Tech Stack

- React / Next.js
- GSAP (preferred for realistic physics)
- Framer Motion (alternative)
- CSS variables for paper colors
- SVG paper texture
- Optional subtle paper sound effect

---

# Best Free AI Tool

## **Claude Code (Free tier available through Claude.ai)** ⭐⭐⭐⭐⭐

Why:

- Excellent at turning detailed prompts into production-ready React components.
- Very strong at GSAP and Framer Motion animations.
- Understands UI/UX intent instead of generating generic code.
- Produces cleaner architecture than most free alternatives.

If Claude Code isn't available, the next best free options are:

1. **Google AI Studio (Gemini 2.5 Pro)** — Excellent prompt-based coding with generous free usage.
2. **Cursor (Free plan)** — Great for implementing features inside an existing project.
3. **Windsurf (Free plan)** — Good for full-stack implementation from prompts.

For BookChat, the strongest free combination is:

**Google AI Studio (Gemini 2.5 Pro) + GSAP**

or

**Claude Code + GSAP** (when free usage is available)

