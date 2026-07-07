# Review Radar brand tokens

These vector assets are hand-authored from the Review Radar concept direction. They do not embed or trace the raster reference image.

## Assets

- `review-radar-icon.svg` — transparent full-color source mark.
- `review-radar-icon-dark.svg` — rounded navy app-icon tile.
- `review-radar-icon-light.svg` — rounded light app-icon tile.
- `review-radar-lockup-horizontal.svg` — dark horizontal lockup with icon and wordmark.

## Palette

| Token | Value | Usage |
| --- | --- | --- |
| `radar-green` | `#32D46B` | Sweep, active nodes, Radar wordmark accent |
| `radar-green-dark` | `#1FA85A` | Light-surface ring contrast |
| `navy-950` | `#020B12` | Dark tile and dark node fill |
| `navy-900` | `#06131D` | Dark tile inner field |
| `white` | `#FFFFFF` | Dark-surface graph strokes and Review wordmark |
| `slate-300` | `#CBD5E1` | Supporting neutral for future copy near the lockup |
| `slate-900` | `#0F172A` | Light-surface graph strokes |

The suggested palette values are preserved. The light icon uses `radar-green-dark` for rings so the radar stays legible on white.

## Geometry and spacing

- Icon source viewBox: `0 0 512 512`.
- Keep at least one outer-ring stroke width of clear space around the transparent mark.
- For app-icon tiles, preserve the rounded square and centered mark proportions.
- Do not place the mark over busy imagery; use the dark or light tile when contrast is uncertain.

## Small-size guidance

- Preferred minimum icon size: 24px.
- At 16px, use `review-radar-icon-dark.svg` or `review-radar-icon-light.svg` so the outer shape and graph nodes remain anchored.
- Avoid adding extra inner rings or graph branches; the current geometry is intentionally sparse for favicon-scale readability.

## Wordmark notes

The horizontal lockup uses SVG `<text>` with a system UI font stack. This avoids a webfont dependency, but exact glyph metrics can vary by platform. If strict brand rendering is needed later, convert the wordmark to paths from an approved typeface in a follow-up asset pass.

## Export notes

- Keep SVGs vector-only; do not embed base64 images or local file references.
- Generate PNG, ICO, or Apple touch icons from these SVGs only when a consuming surface needs them.
- Favicon wiring is intentionally left for a follow-up so this asset pass stays independent from docs configuration.
