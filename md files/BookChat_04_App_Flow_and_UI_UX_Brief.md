# 🧭 BookChat — App Flow & UI/UX Brief

**Companion documents:** `01_Vision_and_Design_Document.md`, `02_Product_Requirements_Document.md`, `03_Technical_Requirements_Document.md`, `05_Implementation_Workflow.md`
**Version:** 2.0
**Status:** Updated — this document defines the screen-by-screen layout, dimensions, and motion design for the primary "Open Hardcover Book on a Desk" interface.

---

## 1. Purpose of This Document

This document bridges the creative vision of BookChat with its frontend implementation. It defines the layout grid, component hierarchy, visual depth layering, and specific motion attributes to realize a realistic skeuomorphic open book.

---

## 2. Hardcover Book Layout Direction (Locked)

The primary interface layout is defined as a **handcrafted hardcover book opened flat on a wooden library desk**. The layout departs from flat card components to model a physical book:

*   **Desk Background**: A dark wood-grain texture (`#241A12` to `#3B2A1C`) forming the desk surface. Soft, long ambient shadows cast by the book outward.
*   **Hardcover Edges**: A thick, dark leather or cloth cover outline (`#4A3223`) peeking out slightly (4–8px) from underneath the stacked pages on the left, right, top, and bottom.
*   **Layered Page Stack**: Beneath the active pages lies a visible "stack of pages" outline (stepped thin borders and shadows) implying depth and thickness—as if hundreds of cream paper pages are stacked beneath.
*   **Deep Center Spine (Gutter)**:
    *   A central vertical gutter separating the left and right pages.
    *   Curved shadows on both pages fading inward toward the center to simulate paper bending downward into the spine binding.
    *   Visible binder stitching or gold-embossed spine rings at the top and bottom of the center gutter.
*   **Page Curvature (Skeuomorphism)**:
    *   Linear/radial gradients overlaying the pages, creating highlights on the outer flat areas and soft shadows near the spine.
    *   The paper corners are rounded (`border-radius: 12px` to `16px`) with organic, slightly imperfect borders (using SVG path shapes or clip-paths) to imply a handmade cut.
*   **Warm Palette**: Cream (`#F4ECDD`), bone (`#EDE3D0`), warm beige (`#E3D5B8`), and faded ink (`#3B352C`). Muted gold (`#B08D57`) for page numbers, separators, and ribbon bookmarks.
*   **Left Page**: Dedicated to directory, chat log navigation, search, bookmarks, settings, and workspace switching. Designed to look printed directly on the cream paper.
*   **Right Page**: Dedicated to the active conversation thread (avatars, message blocks, and the bottom composer pill). Generous margins (40px) matching premium books.

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

*   **Viewport Constraints**: Centered book shell, max-width `1200px`, height `750px` on desktop.
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
*   **Left Page Layout**:
    1.  **Title & Header**: Book name in large serif typography (`Fraunces`), matching a chapter title.
    2.  **Search Input**: Framed as a light ink underline rather than a modern input box.
    3.  **Page List**: Chat channels rendered as text headings with metadata and unread counts displayed as ink dots.
    4.  **Settings Rail**: Positioned on the inner margin or bottom-left edge as a series of engraved icons.
*   **Right Page Layout**:
    1.  **Thread Header**: Active conversation name with "Page X" numbering.
    2.  **Message Thread**: Ruled lines flowing underneath the messages, simulating handwriting directly on notebook sheets.
    3.  **Composer Bar**: A pill-shaped composer anchored at the bottom, matching a fountain pen container.
    4.  **Ribbon Bookmark**: Top-right corner. A cloth ribbon that pulls down to expose invite links or book settings.

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

---

## 7. Accessibility & Motion Controls

*   **Reduced Motion**: Under `prefers-reduced-motion: reduce`, all 3D rotations, page-curl path morphs, and falling sticky note physics are replaced with soft opacity cross-fades (300ms).
*   **Text Legibility**: Contrast ratios for text on cream/ivory paper are maintained above `4.5:1`. High-legibility serif fonts (`Lora`) are used for main messaging, restricting script fonts to stamps and signatures.
