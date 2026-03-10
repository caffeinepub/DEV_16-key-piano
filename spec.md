# Realistic 16-Key Piano

## Current State
New project. No existing frontend or backend code.

## Requested Changes (Diff)

### Add
- 16-key piano spanning C4 to E5 (10 white keys: C4 D4 E4 F4 G4 A4 B4 C5 D5 E5; 7 black keys: C#4 D#4 F#4 G#4 A#4 C#5 D#5)
- Realistic piano visual matching the provided screenshot: dark charcoal background, white keys with depth/gloss, black keys shorter and narrower with gloss
- Note labels on each key (letter name on white keys at bottom, sharp name on black keys)
- Press animation: white keys rotate slightly on Y-axis / translateY downward; black keys also press down
- Web Audio API tone synthesis using oscillators + gain envelope (ADSR) for realistic piano-like sound
- Computer keyboard mapping: A S D F G H J K L ; for white keys, W E T Y U O P for black keys
- Keyboard shortcut hints optionally shown on hover or always visible as secondary label

### Modify
- N/A (new project)

### Remove
- N/A

## Implementation Plan
1. Set up dark design tokens in index.css (charcoal background, near-black piano body)
2. Create PianoKey component with white/black variants, CSS press animation
3. Define key data array (note name, frequency, keyboard key, isBlack)
4. Implement useAudio hook using Web Audio API for piano-like tone (triangle/sine oscillator + quick decay)
5. Implement useKeyboard hook for keydown/keyup listeners mapped to piano keys
6. Render piano in centered layout with proper black key positioning overlaid on white keys
7. Show note labels on all keys; show keyboard shortcut letters as secondary labels
