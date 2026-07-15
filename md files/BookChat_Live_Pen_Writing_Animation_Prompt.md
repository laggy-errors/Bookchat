# BookChat Premium Animation Prompt
## Live Fountain Pen Writing Animation

### Objective
Replace the standard typing experience with a premium handwriting animation. As the user types into the message input at the bottom-right page of the open book, every character should appear as if it is being written by a real fountain pen moving across the paper.

The user types normally with the keyboard, but visually it should feel like a physical pen is writing every letter in real time.

### Animation Flow
1. User presses a key.
2. A realistic fountain pen appears at the writing cursor.
3. The pen moves naturally to draw the character.
4. Ink appears progressively behind the pen tip.
5. The completed letter remains on the paper.
6. The pen lifts slightly and moves to the next character.
7. Continue seamlessly until typing stops.

### Pen Design
- Premium black fountain pen
- Gold nib
- Metallic reflections
- Soft shadow
- Slight tilt (45–60°)
- Tiny natural wobble and micro movements
- Pen never hides the text completely

### Ink
- Dark ink, not plain text rendering
- Progressive stroke drawing
- Slight stroke width variation
- Tiny ink imperfections
- Very subtle wet-ink shine for a brief moment

### Typing Behaviour
- Follow the user's typing speed naturally.
- Fast typing becomes smooth continuous writing.
- Slow typing includes tiny pauses and idle pen movement.
- Never allow the animation to feel delayed.

### Cursor
Replace the blinking cursor with the pen while writing.
When idle, the pen rests near the insertion point with a gentle floating motion.

### Editing
Backspace:
- Pen moves backwards.
- Previous letter disappears with a clean paper-style erase animation.

Paste:
- Animate rapid handwriting instead of instantly displaying text.

Line Wrap:
- Move naturally to the next line like real handwriting.

### Performance
Use GPU-friendly transforms and SVG stroke animations.
Maintain smooth 60 FPS.

### Accessibility
Respect prefers-reduced-motion by disabling the pen animation and showing text instantly while preserving the paper appearance.

### Overall Experience
The user should feel like they are writing a personal letter inside a premium hardcover book. The interaction must feel elegant, tactile, warm, and handcrafted rather than like a standard text input.
