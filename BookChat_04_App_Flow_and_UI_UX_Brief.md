# 🧭 BookChat — App Flow & UI/UX Brief

**Companion documents:** `01_Vision_and_Design_Document.md`, `02_Product_Requirements_Document.md`, `03_Technical_Requirements_Document.md`, `05_Implementation_Workflow.md`
**Version:** 2.1
**Status:** Updated — Aligned with the exact layout elements from the primary visual design reference.

---

## 1. Purpose of This Document

This document bridges the creative vision of BookChat with its frontend implementation. It defines the layout grid, component hierarchy, visual depth layering, and specific motion attributes to realize a realistic skeuomorphic open book based on the primary visual design reference.

---

## 2. Hardcover Book Layout Direction (Locked)

The primary interface layout is defined as a **handcrafted hardcover book opened flat on a wooden library desk**, taking direct visual inspiration from the primary design reference:

*   **Desk Background**: A dark wood-grain texture (`#241A12` to `#3B2A1C`) forming the desk surface. Soft, long ambient shadows cast by the book outward.
*   **Hardcover Edges**: A thick, dark leather or cloth cover outline (`#4A3223`) peeking out slightly (4–8px) from underneath the stacked pages on the left, right, top, and bottom.
*   **Layered Page Stack**: Beneath the active pages lies a visible "stack of pages" outline (stepped thin borders and shadows) implying depth and thickness—as if hundreds of cream paper pages are stacked beneath.
*   **Deep Center Spine (Gutter)**:
    *   A central vertical gutter separating the left and right pages.
    *   Curved shadows on both pages fading inward toward the center to simulate paper bending downward into the spine binding crease.
    *   Visible binder stitching or gold-embossed spine rings at the top and bottom of the center gutter.
*   **Page Curvature (Skeuomorphism)**:
    *   Linear/radial gradients overlaying the pages, creating highlights on the outer flat areas and soft shadows near the spine.
    *   The paper corners are rounded (`border-radius: 12px` to `16px`) with organic, slightly imperfect borders (using SVG path shapes or clip-paths) to imply a handmade cut.
*   **Left Page Layout (Book Shelf)**:
    *   *Header*: "• BookChat Shelf" in a large, elegant serif font (`Fraunces`) with a brown bullet point, followed by the italicized subtitle "Volume IV - Active Dialogues".
    *   *Search*: "search archives..." with a dashed border below.
    *   *Primary CTA*: "edit + Write to member" button in a solid dark brown block with rounded corners.
    *   *Section*: "CONVERSATIONS" heading in small uppercase.
    *   *Conversation Cards*: Rounded cards with a tan background; the active conversation card is highlighted with a solid dark brown left border accent and a circular letter avatar.
    *   *Footer Profile*: Circular avatar, "THE ARCHIVIST" (bold, uppercase), "Vol. III - Curator", and a lowercase "settings" trigger on the bottom-right.
*   **Right Page Layout (Ruled Writing Area)**:
    *   *Title*: Active channel name ("UI/UX Design Ideas").
    *   *Subtitle*: "Started on Oct 14th, 1894" in a light brown color.
    *   *Bookmark Pin*: A dark green fabric ribbon/pin tag anchored in the top-right corner.
    *   *Sheet Styling*: Lined paper background with horizontal rules.
    *   *Conversation Alignment*:
        *   **Sender Messages**: Titled "10:45 AM YOU" with a solid brown right vertical margin line and italicized text block underneath.
        *   **Recipient Messages**: Titled "ARYAN 10:48 AM" in plain red-brown ink, with normal body text block underneath.
    *   *Composer*: Pill-shaped input containing "attachment" text button on the left and "edit" on the right.

---

## 3. Global Layout Grid

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DESK BACKGROUND (Wood-grain, ambient drop shadow)                          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ HARDCOVER BINDING (Leather border)                                    │  │
│  │  ┌───────────────────────────────────┬─┬───────────────────────────┐  │  │
│  │  │ PAGE STACK DEPTH (Shadow layers)  │ │                           │  │  │
│  │  │ ┌───────────────────────────────┐ │G│ ┌───────────────────────┐ │  │  │
│  │  │ │ LEFT PAGE                    │ │U│ │ RIGHT PAGE            │ │  │  │
│  │  │ │                               │ │T│ │                       │ │  │  │
│  │  │ │ (Navigation, search, lists,   │ │T│ │ (Message thread list, │ │  │  │
│  │  │ │  settings rail)               │ │E│ │  active composer,     │ │  │  │
│  │  │ │                               │ │R│ │  invitation ribbons)  │ │  │  │
│  │  │ └───────────────────────────────┘ │ │ └───────────────────────┘ │  │  │
│  │  └───────────────────────────────────┴─┴───────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

*   **Viewport Constraints**: Centered book shell, max-width `1120px`, height `700px` on desktop.
*   **Left/Right Page Dimensions**: Equal widths (approximately `46%` of book width each), with the center spine taking up `8%`.
*   **Responsive Collapse**:
    *   Below `960px` (tablets), the book collapses to a single-page-at-a-time view.
    *   The page transition is executed using a page-flip curl animation.
    *   Left page acts as the directory screen; swiping or clicking a page card flips to the Right page (writing thread).

---

## 4. Screen-by-Screen Flow & Skeuomorphic Transitions

### 4.1 Closed Book (Auth Screen)
*   **Visuals**: A leather-bound book lying closed in the center of the desk. Custom title embossed in gold leaf.
*   **Forms**: Login and Signup input fields are framed inside debossed parchment labels embedded on the cover.
*   **Opening Animation**: Upon validation, the cover rotates along its left edge using CSS 3D transforms (`transform: rotateY(-180deg)`), fanning open the pages to reveal the default main view.

### 4.2 Onboarding and Preamble
*   **Name Input**: A sepia-faded paper note card appears as if placed on top of the open book, dropping into view with a slight gravity bounce.
*   **Preamble**: Fills the entire open-book surface (mocking a book's introduction page). Displays rules using classic typography and an ornamental Drop Cap.

### 4.3 Main Book View Layout
*   Matches the specifications in Section 2. All lists are styled to look printed directly on the cream/parchment pages.

---

## 5. Component Inventory

*   **`BookShell`**: Core wrapper handling 3D perspective, outer hardcover edge, page stack depth layers, and ambient desk shadows.
*   **`BookGutter`**: The center spine component creating the split-gradient curvature shadows (`linear-gradient` overlays) and physical binding lines.
*   **`LeftPagePanel`**: Left-side sheet with printed lists, bookmarks, search bar, and navigation.
*   **`RightPagePanel`**: Right-side sheet hosting conversation lists and ribbons.
*   **`MessageLines`**: Generates CSS-ruled background notebook lines aligned to text line heights.
*   **`RibbonTab`**: Animated cloth bookmark in the upper-right corner.
*   **`ThemeTab`**: A ribbon pull-tab at the bottom-center that drags up to open the frame-swapping panel.

---

## 6. Motion & Physics Easing

*   **Page Curl Transition**: When switching conversations or books, the active page sheet lifts on its outer edge and curls toward the spine. Uses Framer Motion's custom path morphing or CSS clip-paths with spring constants:
    *   `stiffness: 120`
    *   `damping: 18`
    *   `mass: 1.1`
*   **Spine Shadow Shift**: During a page turn, the gutter shadow dynamically deepens and shifts left-to-right to match the turning paper's angle.
*   **Ribbon Hover**: Small horizontal pendulum sways (`rotate(-2deg)` to `rotate(2deg)`) using slow sine-wave eases to replicate light fabric.
*   **Paper Sticky Note Notifications**: Drops vertically using gravity calculations, wobbling as it hits resistance, and lands with a soft elastic bounce.
*   **Live Fountain Pen**: Tilts, wobbles, and draws letter curves dynamically in sync with the user's keystrokes.
