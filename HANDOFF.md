# Handoff: Empirical-Finance Site + Content

This file is a full context dump for another LLM/agent (e.g., Claude) to pick up the project.
It covers structure, what is live, and what is next.

## Repository layout (public)

- docs/
  - index.html
  - assets/
    - styles.css
    - app.js
  - asset-pricing/
    - index.html
    - ap-01.html
    - ap-02.html
    - AP_01_CARA_Normal_Equilibrium.pdf
    - AP_02_CAPM_SDF_Foundations.pdf
    - FinanceNotes_AP1.pdf
    - FinanceNotes_AP2.pdf

- empirical-asset-pricing/
  - README.md
  - slides/
    - EAP_Template.tex
    - AP_01_CARA_Normal_Equilibrium.tex
    - AP_02_CAPM_SDF_Foundations.tex
    - README.md
  - notes/
    - AP_01_CARA_Normal_Notes.tex
    - AP_02_CAPM_SDF_Notes.tex

- slides/
  - README.md
- pages/
  - README.md
- PRIVATE/
  - (private materials live here; public site must not expose this)

GitHub Pages is configured to serve from main:/docs.

## What is live on the site now

Home page:
- docs/index.html
- Styled via docs/assets/styles.css
- JS behaviors in docs/assets/app.js

Asset Pricing track:
- docs/asset-pricing/index.html
- Links to AP-01 and AP-02 modules
- Download links for slides + notes

AP-01 module page:
- docs/asset-pricing/ap-01.html
- Interactive features: stepper walkthrough, checklist, drill generator, timer
- Embedded slide PDF and embedded notes PDF

AP-02 module page:
- docs/asset-pricing/ap-02.html
- Same interactive features as AP-01
- Embedded slide PDF and embedded notes PDF

Slides PDFs (public):
- docs/asset-pricing/AP_01_CARA_Normal_Equilibrium.pdf
- docs/asset-pricing/AP_02_CAPM_SDF_Foundations.pdf

Notes PDFs (public, book-style):
- docs/asset-pricing/FinanceNotes_AP1.pdf
- docs/asset-pricing/FinanceNotes_AP2.pdf

## WebGL study companion (Study Cat)

Implemented in docs/assets/app.js and styled in docs/assets/styles.css.

Features:
- WebGL cat using Three.js (loaded from CDN)
- Idle animations: blink, breathe, tail swish, ear twitch
- Interactions: pet (click/drag), treat (double-click), stretch, focus, break, quiet
- Reactions hooked to page events (stepper, drills, timers, checklists, progress, mode)
- Mood/Energy/Focus meters
- Drag to move; position persists in localStorage
- Quiet mode persists

Behavior hooks:
- app.js emits custom events: companion:step, :drill, :calc, :checklist, :timer, :progress, :mode, :accordion
- Companion reacts with text prompts and animation pulses

## Knowledge used in content

AP-01 (CARA-normal equilibrium):
- CARA utility with normal payoffs
- Certainty equivalent and mean-variance reduction
- Individual demand: theta* = (1/alpha) Sigma^{-1} (mu - p)
- Aggregate risk tolerance T = sum 1/alpha
- Market clearing -> price formula p = mu - (1/T) Sigma theta_bar
- Risk premia as covariance with aggregate risk

AP-02 (CAPM + SDF):
- Mean-variance optimization and tangency portfolio
- Market clearing -> Sigma w_M proportional to mu - R_f 1
- CAPM beta pricing equation
- SDF pricing equation E[m R_i] = 1
- Linear SDF implies CAPM
- Zero-beta CAPM and factor model nesting

Notes are longer, theorem/lemma style, with worked examples and practice problems + solutions.

## What still needs work (high-value)

1) AP-03 module (Cross-Sectional Regressions)
- Slides (RA-style) in empirical-asset-pricing/slides
- Notes (book-style) in empirical-asset-pricing/notes
- Live module page in docs/asset-pricing

2) Solution manual
- A separate manual that solves full qualifier problems with variants
- Could live under empirical-asset-pricing/solutions/ and be linked on site

3) Applied Econometrics track
- New folder under docs/ (e.g., docs/applied-econ/)
- Parallel structure to asset-pricing

4) Portfolio Theory track
- Same as above, new module pages

5) Site-level upgrades
- Global search (static index + JS)
- Progress dashboard across modules
- Spaced repetition engine tied to drill bank

## Important constraints

- The public site is served from /docs.
- Private content must stay inside PRIVATE/ and not be linked.
- Tone must sound like Dr. Ian Helfrich (direct, warm, rigorous, no AI vibe).
- Notes must be longer and more detailed than slides.
- All files should be ASCII unless an existing file already uses Unicode.

## Build and update flow

- Slides are in empirical-asset-pricing/slides/*.tex
- Notes are in empirical-asset-pricing/notes/*.tex
- Build PDFs with xelatex in those folders
- Copy PDFs into docs/asset-pricing/ for GitHub Pages

Example build (AP-01 notes):
- xelatex AP_01_CARA_Normal_Notes.tex
- copy AP_01_CARA_Normal_Notes.pdf -> docs/asset-pricing/FinanceNotes_AP1.pdf

## Live URLs

- Home: https://ihelfrich.github.io/Empirical-Finance/
- Asset Pricing track: https://ihelfrich.github.io/Empirical-Finance/asset-pricing/index.html
- AP-01: https://ihelfrich.github.io/Empirical-Finance/asset-pricing/ap-01.html
- AP-02: https://ihelfrich.github.io/Empirical-Finance/asset-pricing/ap-02.html
- AP-01 Notes: https://ihelfrich.github.io/Empirical-Finance/asset-pricing/FinanceNotes_AP1.pdf
- AP-02 Notes: https://ihelfrich.github.io/Empirical-Finance/asset-pricing/FinanceNotes_AP2.pdf

