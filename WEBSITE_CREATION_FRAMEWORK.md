# 🌊 The Web Creation Framework & Master Playbook
### High-Performance, Anti-Slop, 3D Scroll-Driven Web Production System

> **How to use this document**: This is your single source of truth for creating world-class websites and landing pages. You can modify, add, or remove phases here as your stack evolves. Any AI agent directed to this file will follow this exact workflow.

---

## 📦 1. The Installed Arsenal & Locations

All 4 core tools and design repositories are installed both **globally** (available for every project on this machine) and in this project's workspace:

| Tool / Repository | Global Location | Workspace Location | Purpose |
| :--- | :--- | :--- | :--- |
| **`taste-skill`** | `~/.gemini/config/skills/taste-skill/` | `.agents/skills/taste-skill/` | **Aesthetic Intelligence**: Sets design variance, motion intensity, and visual density dials. Enforces "anti-slop" discipline (bans generic AI purple gradients, 3 equal cards, etc.). |
| **`impeccable`** | `~/.gemini/config/skills/impeccable/` | `.agents/skills/impeccable/` | **Craft Floor Director**: Typography scales, APCA contrast, micro-interactions, layout tension, and surgical UI review. |
| **`playwright-cli`** | `/opt/homebrew/bin/playwright-cli`<br>`~/.gemini/config/skills/playwright-cli/` | `.agents/skills/playwright-cli/` | **Automated Visual QA**: Headless browser automation CLI + skill. Captures multi-viewport screenshots (375px mobile, 768px tablet, 1440px desktop) and inspects DOM snapshots. |
| **`awesome-design-md`** | `~/.gemini/config/awesome-design-md/` | Ready for global reference | **74 Brand Design Systems**: Token dictionaries (colors, font families, letter-spacing, shadows) for Apple, Linear, Stripe, Ferrari, Vercel, etc. |
| **`website-forge`** *(Master Skill)* | `~/.gemini/config/skills/website-forge/` | `.agents/skills/website-forge/` | **Pipeline Orchestrator**: The master skill that executes this entire 6-phase process from brief to Vercel edge deployment. |

---

## 🔄 2. The 6-Phase Web Creation Pipeline

```
[Phase 1: Brief & Direction]  ──► taste-skill + awesome-design-md
             │
[Phase 2: Visual 3D Engine]    ──► image-generator + 3d-animation-creator
             │
[Phase 3: Static Architecture] ──► Vanilla HTML/CSS/JS + config.js + Concierge Estimator
             │
[Phase 4: Craft Polish]        ──► impeccable + Anti-Default Audit
             │
[Phase 5: Automated Visual QA] ──► playwright-cli (Multi-viewport screenshots)
             │
[Phase 6: Edge Deployment]     ──► vercel.json (1-year immutable cache) + .vercelignore
```

---

### Phase 1: Brief Inference & Design Direction

1. **Declare the Design Read (`taste-skill`)**:
   - Before writing any code, state the **One-Line Design Read**:
     > *"Reading this as: [page kind] for [target audience], with a [vibe] language, leaning toward [design system]."*
   - Set **The Three Dials**:
     - `DESIGN_VARIANCE` (1–10): Symmetry (1) vs. art-directed asymmetry (7–9).
     - `MOTION_INTENSITY` (1–10): Static (1) vs. cinematic scroll video (6–8).
     - `VISUAL_DENSITY` (1–10): Airy museum gallery (2–4) vs. data cockpit (8–10).

2. **Select Design Tokens (`awesome-design-md`)**:
   - Query `~/.gemini/config/awesome-design-md/design-md/` for a matching brand:
     - **Luxury / Premium**: `apple`, `ferrari`, `bugatti`, `theverge`, `wired`
     - **Modern SaaS / Tech**: `linear.app`, `stripe`, `vercel`, `raycast`, `resend`
     - **Warm / Approachable**: `airbnb`, `notion`, `figma`, `spotify`, `slack`
   - Extract exact typography pairings, letter-spacings, radius scales, and surface hex codes into CSS variables.

---

### Phase 2: Visual Engine & 3D Storytelling

1. **Asset Prompts (`image-generator`)**:
   - Generate the 3 coordinated prompts for AI image/video models:
     - **Prompt 1**: The starting state (e.g. dirty/turbid pool or raw product).
     - **Prompt 2**: The transformed state (e.g. resort-level crystal blue pool).
     - **Prompt 3**: The cinematic transition video between them.

2. **Scroll Canvas Animation (`3d-animation-creator`)**:
   - Extract 120–144 frames via FFmpeg:
     ```bash
     ffmpeg -i input.mp4 -vf "fps=30,scale=1920:-2" -q:v 2 frames/frame_%04d.webp
     ```
   - Render inside `<canvas>` with device pixel ratio scaling (`dpr`), interpolation smoothing (`lerp` between `targetProgress` and `currentProgress`), and a branded preloader.

---

### Phase 3: Static Architecture & Concierge Logic

1. **Centralized Configuration (`config.js`)**:
   - Never hardcode client numbers, emails, or pricing directly in HTML.
   - Keep a clean `config.js` at the root:
     ```javascript
     const SITE_CONFIG = {
       whatsapp: {
         phone: "595981000000",
         defaultMessage: "Hola, quisiera solicitar información sobre..."
       },
       business: {
         name: "AQUA RESIDENCE",
         currency: "Gs."
       }
     };
     ```
   - Bind all direct CTAs via `[data-whatsapp-link]` so updating `config.js` updates every button across the entire site.

2. **Interactive Concierge Estimator**:
   - Include interactive location chips, tier cards, and upsell checkboxes.
   - Dynamically compute quotes and format personalized WhatsApp messages with emojis, line breaks, and quotation breakdowns.

3. **Clean Folder Layout**:
   ```
   ├── config.js              # Client-editable parameters
   ├── index.html             # Semantic HTML5
   ├── css/styles.css         # Editorial styling
   ├── js/app.js              # Canvas animation & UI logic
   ├── frames/                # 144 WebP/JPG frame sequence
   ├── docs/screenshots/      # Development captures & research
   ├── scripts/               # Utility / scraper scripts
   ├── vercel.json            # Edge cache rules
   ├── .vercelignore          # Lean upload filter
   └── package.json           # Local dev preview scripts
   ```

---

### Phase 4: Craft Floor Polish (`impeccable`)

1. **Anti-Slop Discipline**:
   - Ban generic AI defaults: no ungrounded purple gradients, no 3 equal cards, no floating blob meshes.
   - Contrast check: ensure body text meets APCA / WCAG AA standards.
   - Typography rigor: pair an expressive display font (serif or geometric display) with a highly legible sans body font, plus a mono font for technical metadata.

2. **Responsive Hierarchy & Decluttering**:
   - On single-narrative landing pages, skip the hamburger menu drawer in favor of a clean floating pill navbar with the logo and a prominent direct action CTA (`Diagnóstico` / `Get Quote`).
   - Ensure touch targets are >= 44x44px.

---

### Phase 5: Automated Visual QA (`playwright-cli`)

Instead of manually clicking around or guessing responsive layouts:
```bash
playwright-cli open http://localhost:3000
playwright-cli resize 1440 900
playwright-cli screenshot --path=docs/screenshots/qa_desktop.png
playwright-cli resize 375 812
playwright-cli screenshot --path=docs/screenshots/qa_mobile.png
playwright-cli close
```
Inspect the snapshots for overlapping text, horizontal scroll bugs, and touch target sizes.

---

### Phase 6: Edge Deployment (Vercel)

1. **Immutable Caching (`vercel.json`)**:
   - Cache the 144 animation frames (`/frames/*`) for 1 year:
     ```json
     {
       "source": "/frames/(.*)",
       "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
     }
     ```
   - Set security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
   - Enable clean URLs (`cleanUrls: true`).

2. **Payload Optimization (`.vercelignore`)**:
   - Exclude `.git`, `docs/`, `scripts/`, debug screenshots, `.mp4`, `.zip`.
   - Shrinks deploy payload from >130 MB to <25 MB for instant edge distribution.

---

## 💡 Key Lessons Learned from `pool-cleaner-web`

1. **Static is Superior for Landing Pages**: No Node servers, no bundlers breaking over time. Pure HTML/CSS/JS is faster, cheaper, and lasts forever without dependency rot.
2. **Canvas DPR Scaling is Mandatory**: Drawing directly to a canvas on Retina screens without `canvas.width = w * dpr` makes frames blurry. Always scale canvas buffer to DPR and set CSS size to viewport width.
3. **One Config File Saves Hours**: Clients will always change their WhatsApp number, email, or price. Putting it in `config.js` at root allows them to edit it in 10 seconds directly on GitHub without breaking HTML.
4. **Fewer Menu Items = Higher Conversion**: On mobile, a hamburger menu hides the CTA. Removing the drawer in favor of a clean, persistent `Diagnóstico` button increased clarity and eliminated layout bugs.
5. **Vercel Edge Caching is Crucial for 3D Video**: 144 images can choke bandwidth without `immutable` cache headers. One header solves smooth scrolling forever.

---

## 🛠️ How to Evolve & Update This Framework

**Yes, editing this file is all you need to do!**

- **To add a phase** (e.g. *Phase 7: Analytics & Pixel Tracking* or *Phase 2.5: Copywriting with StoryBrand*):
  Simply insert the new phase into Section 2. The agent will read this file and execute it in that order.
- **To change defaults** (e.g. if you prefer Tailwind over Vanilla CSS, or want to add a Supabase backend):
  Update Phase 3 with your new stack instructions.
- **To start a new project with this framework**:
  Copy this `WEBSITE_CREATION_FRAMEWORK.md` into your new project root and tell the agent:
  > *"Read `WEBSITE_CREATION_FRAMEWORK.md` and create a landing page for [Product Name]. Use the [Apple / Linear] aesthetic."*
