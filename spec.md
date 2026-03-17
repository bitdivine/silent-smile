# Specification

## Summary
**Goal:** Add an interactive bite animation to the smiley face's mouth that triggers on mouse hover.

**Planned changes:**
- Replace the static smile path in `App.tsx` with an interactive mouth component using a `mouthState` variable (`'smile' | 'open' | 'bitten'`)
- On mouse-enter over the mouth region, animate the mouth through: open wide (~150–200ms) → snap to a closed/bitten state
- The bitten state persists until the mouse enters the mouth region again, at which point the open-bite sequence repeats
- Add a transparent SVG `<ellipse>` or `<rect>` overlay on the mouth region to reliably capture `onMouseEnter` events

**User-visible outcome:** Hovering over the smiley face's mouth causes it to open and snap shut in a playful bite animation. The mouth stays in a bitten/closed state until hovered again.
