# Visual craft: accessible colour and type

Research and calculation dated 22 October 2026. No product files changed for this pass. The numbers below are calculated from the proposed flat sRGB tokens with the WCAG relative-luminance formula; they are not a declaration that every rendered screen conforms. Opacity, a changed background, an illustration behind text or a small control can change the result.

## Primary references read

| Reference | What it supports | What we take; what we do not claim |
|---|---|---|
| [W3C, Contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | AA text needs 4.5:1; large text has a 3:1 exception. Thin strokes can look fainter after anti-aliasing even when token arithmetic passes. | Hold all normal copy to 4.5:1 and prefer more margin for bedside reading. A passing colour pair does not make a tiny or thin font legible. |
| [W3C, Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) | Meaningful visual controls/states need 3:1 against adjacent colours. A decorative separator need not meet that threshold. | Use the light line token only decoratively. Focus, selection and any boundary required to identify an input must use a stronger colour. Do not use colour as the only signal. |
| [W3C, Resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) | Text must reach 200% without lost content or functionality. Controls and labels are included. | Let paragraphs and controls grow; do not shrink enlarged text back to the old size merely to preserve a composition. |
| [W3C, Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | Ordinary content should reflow to a single scrolling direction at narrow widths; games can require two dimensions. | Stack the book at narrow widths, allow vertical scroll, and never let an overlay footer hide the last paragraph. The game exception is not permission to make words unreadable. |
| [W3C, Text spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) | User spacing overrides must not lose content; the test values include 1.5 line-height, 2em paragraph gaps, .12em tracking and .16em word spacing. | Keep text as HTML and allow user overrides. These are override-test values, not mandatory default typography. |
| [Android accessibility help, touch target size](https://support.google.com/accessibility/android/answer/7101858?hl=en-GB) | 48 × 48 dp targets with separation are recommended; the visible icon can be smaller than its active region. | The addendum sets our concrete web minimum at 48 × 48 CSS px. Include close, participant choices, word pieces, hints, small footer actions and garden feed controls. Do not expand adjacent invisible targets until they overlap. |
| [Dyslexia Scotland, typed formats](https://dyslexiascotland.org.uk/dyslexia-friendly-typed-formats/) | Spacing and familiarity matter; younger/less proficient readers can need more room. It rejects a universal special font and notes no consistent serif/sans advantage. | Short instructions, familiar upright letters, generous line/word separation and no long italic passages. This is relevant guidance, not evidence that these children have dyslexia or that any one font cures reading difficulty. |
| [Literata source project](https://github.com/googlefonts/literata) | The font is designed for digital editorial and long reading, and released under OFL. | Use its upright roman for the prayer. Its design purpose supports the choice; the project's marketing is not an independent reading trial. |

The British Dyslexia Association PDF appeared in search, but direct retrieval returned 403. The TypeTogether website could not be opened directly; the font's own public source project was read instead. Neither unavailable page is claimed as directly reviewed.

## Proposed token contrast

Ratios are symmetric for foreground and background. Rounded values are reported for reading; pass/fail was evaluated against the unrounded calculation. AA normal text requires at least 4.5:1.

| Setting | Foreground / background | Ratio | Use |
|---|---|---:|---|
| Day | ink `#263c31` / paper `#f3f0e5` | 10.381:1 | Strong reading pair |
| Day | accent `#ac4c2e` / paper | 4.809:1 | Passes normal text at full opacity |
| Day | muted `#677064` / paper | 4.513:1 | Technically passes, with almost no margin |
| Day | line `#cdd0bf` / paper | 1.377:1 | Decorative rules only |
| Day | ink / accent | 2.159:1 | Fails; do not put forest text on a rust fill |
| Day | muted / soft `#e8e9da` | 4.193:1 | Fails normal text |
| Day | accent / soft | 4.468:1 | Fails normal text; do not round it to a pass |
| Day | ink / soft | 9.644:1 | Strong reading pair |
| Night | ink `#e5e7d8` / paper `#192b2a` | 11.796:1 | Strong reading pair |
| Night | accent `#e6a27f` / paper | 6.927:1 | Passes normal text |
| Night | muted `#adb9aa` / paper | 7.250:1 | Passes normal text |
| Night | line `#465950` / paper | 1.975:1 | Decorative rules only |
| Night | ink / accent | 1.703:1 | Fails; use dark paper text on the light accent fill |
| Night | muted / soft `#243c35` | 5.808:1 | Passes normal text |
| Night | accent / soft | 5.550:1 | Passes normal text |

### Small safe amendments

If the visual direction needs normal accent/muted text on both paper and the soft inset background, darker day tokens avoid a background-dependent exception:

| Amendment | On paper | On soft |
|---|---:|---:|
| muted `#5b6558` | 5.339:1 | 4.960:1 |
| accent `#a4472b` | 5.237:1 | 4.865:1 |

A day control-line `#75806e` is 3.631:1 on paper, appropriate for a meaningful border; it should not become body text. A stronger existing ink or muted token can also delineate controls. Night meaningful outlines can use muted/accent instead of the decorative line.

### Opacity is not free

- Day muted at opacity .72 on paper blends to `#8e9488`, only **2.730:1**: fail.
- Night muted at opacity .72 on paper blends to `#849186`, only **4.489:1**: fail for normal text.
- The primary day button's paper text at opacity .65 on forest blends to `#abb1a6`, **5.398:1**: still passes, but this result does not transfer to another background.

Keep informational labels at full opacity and select the proper token. An opacity intended for decorative art must not leak onto the surrounding instructions. Disabled controls have a WCAG contrast exception, but essential information must not be hidden inside a disabled state.

## Typography and night decisions

- Literata roman is the prayer face, with line-height about 1.6–1.75 and a short measure. No paragraph-length italic, tight tracking or ornamental display face for essential prayer instructions.
- Cormorant belongs in the large title, where it can be expressive; use a sufficient weight, not hairlines for quietness. Night should quiet the background, not weaken the letters.
- DM Sans should carry the children's instructions and controls. Use one short instruction at a time, clear mixed case, and sufficient space around words. No all-caps paragraphs. Small editorial section labels must be supplementary rather than carrying the only useful instruction.
- Early-reader accessibility is not solved by changing the font. Short sentences, order, stable wording and a forgiving hint matter. Do not claim that the design was tested with children unless real children used it.
- Keep day/night as alternate values of one token system. Offer an explicit choice because dark mode is not universally easier. Set the initial theme before the first paint so a night launch does not flash a white page. No claim is made that the palette treats visual stress or protects sleep.

## Required 200%/small-hands checks after the tile commit

1. Open the complete first-run, home, prayer, puzzle, garden, season, confession, already-prayed and gap-return states at 390 px and 1180 × 820. Repeat at night.
2. Enlarge the actual text to 200% using a supported browser or app mechanism. Verify the computed text size really doubles; a smaller responsive font or auto-fit must not quietly cancel the enlargement.
3. Use vertical scrolling where necessary. No fixed-height reading container should clip a verse, prayer, form label or action. Buttons can become taller when labels wrap. Do not lock a footer across the last line.
4. The physical game is the main risk: its fit loop and fixed-height stage can counteract enlargement. At large text, a wrapped stationary word bank with tap/keyboard placement is a defensible accessible equivalent; do not reduce the words until they fit.
5. Inspect all active targets from their rendered bounding boxes: both dimensions at least 48 px, not merely min-height. This includes tiny text buttons, the close cross, participant controls and the shortest word pieces. Test neighbouring choices without accidental activation.
6. Test keyboard focus, Escape, labelled close controls, reduced motion and a visible indication of the next word. Free hints must stay available; no timed success state.
7. Run a spacing-override pass as well as the 200% pass, then inspect the phone screenshot. A screenshot alone does not prove that labels or controls remain reachable.
