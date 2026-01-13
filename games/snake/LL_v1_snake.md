# Project Post-Mortem: Neon Serpent (Snake)

**Date:** January 12, 2026
**Project:** Neon Serpent (Mobile Snake)
**Tech Stack:** HTML5 Canvas, Vanilla JS, CSS Variables

---

## 1. Project Overview
A modern, mobile-first adaptation of the classic Snake game. The primary goal was to solve the "Touch Control" problem for Snake on mobile without using an ugly on-screen D-Pad.

**Key Features:**
- **Relative Turning:** Instead of 4 directional buttons, we use 2 buttons (Left/Right) relative to the snake's current heading.
- **Dynamic Themes:** CSS classes on the `<body>` drive the visual style, while JS logic handles render-specific differences (like gradients vs. flat colors).

---

## 2. Version History

### v1.3 - Modes & Mechanics (Final)
- **Feature:** Added "Color Eater" (Chameleon) mode where food has randomized colors, and eating it changes the snake's active color, creating a segmented history of meals.
- **Feature:** Added "Retro" mode (B&W) which strips all shadows and gradients for a pure 1980s look.
- **UI:** Added a description box to the start screen to explain modes.

### v1.2 - Visual Polish
- **Juice:** Implemented "Living Gradients" for the Neon snake (HSL color shift down the tail).
- **Feedback:** Added `navigator.vibrate` for haptic feedback on eating and crashing.

### v1.1 - The "Relative Turn" Control
- **Problem:** Swipe controls are often imprecise, and D-Pads are hard to hit without looking.
- **Solution:** "Tap Side to Turn".
    - Left Button = Turn 90° Left relative to current head direction.
    - Right Button = Turn 90° Right relative to current head direction.
    - *Math:* If moving (0, -1) [UP], a Left Turn becomes (-1, 0) [LEFT].

### v1.0 - Core Engine
- **Base:** Standard grid-based movement loop.
- **Resizing:** Added logic to calculate `canvas.width` based on `window.innerWidth` minus UI padding, ensuring a perfect square on any device.

---

## 3. Key Technical Insights

### A. The "Ghost Draw" Bug
We encountered a crash where `resize()` tried to draw the snake before `initGame()` had run.
- **Fix:** Added safety checks (`if(snake) draw()`) in the resize listener and the mode switcher.
- **Lesson:** Always initialize state variables to `null` and guard-clause your render functions.

### B. HSL Gradients for "Juice"
To make the snake look "alive," we used HSL color spaces in the render loop:
```javascript
const hue = 320 - (i * 4);
ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
```
This is much more performant than calculating RGB hex codes for every segment every frame.

C. Relative Turning Math

Turning logic without if/else chains:

Turn Left: newDir = { x: current.y, y: -current.x }

Turn Right: newDir = { x: -current.y, y: current.x } This vector rotation formula is cleaner and less error-prone than checking "If Up then Left...".

### 4. Todo / Future Improvements
[ ] Sound: Add retro blips for eating and crashing.

[ ] Swipe Support: Add an option to toggle between Buttons and Swipe controls for users who prefer gestures.

[ ] Speed Ramp: Increase game speed slightly every 50 points.