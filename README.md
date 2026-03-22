# OPTIQ — AI-Powered 3D Eyewear Configurator

Custom eyewear made from recycled plastic, 3D printed to order. This is the full frontend application for the OPTIQ platform, built for the AI Ready ASEAN Youth Challenge 2026 by Team Quincers.

Live dev server: `npm run dev` then open `http://localhost:5173`

---

## What's Built

### Configurator (8-step flow)
- **Fit Scan** — AI face measurement as the entry point; recommends frame style and size before the user starts customizing, with a skip option for manual selection
- **Frame** — 5 styles (Cat-Eye Luxe, Aviator Classic, Wayfarer Bold, Round Wire, Eza's Custom) selectable via an animated FlowingMenu with marquee hover previews and offscreen-rendered thumbnails; pre-selected if the user completed a face scan
- **Material** — 3 recycled material options (HDPE bottle caps, PET bottles, Bio-PLA) with PBR properties per material
- **Lens** — 5 lens types (Clear, Blue Light Filter, Polarised, Gradient Tint, Photochromic) with a 3D lens picker that shows each lens as a physical disc you can click through
- **Prescription (Rx)** — vision type selector (Nearsighted / Farsighted / Non-prescription), grade picker (Mild / Moderate / Severe with dioptre ranges), astigmatism toggle (None / Mild / Moderate / Severe), and a "different per eye" mode that lets users specify OD (right) and OS (left) independently; selections carry through to the summary and checkout
- **Colour** — per-frame colour variants with an editorial expand-on-select ColorPicker, material sheen sweep animation, and an accent swatch strip
- **Size** — Small / Medium / Large with live 3D model scaling (94% / 100% / 106%) and an offscreen-rendered silhouette diagram that shows the exact frame shape with accurate dimensions; auto-filled if the user completed a face scan
- **Summary** — compact build review with 3-column receipt layout including Rx row, environmental impact callout, AR try-on CTA with shimmer animation, and Stripe checkout

### 3D Viewer
- Procedurally generated frames via `buildAviator`, `buildWayfarer`, `buildRound`, `buildCatEye` using Three.js geometry primitives
- GLB model support for custom frames (`/public/models/glasses.glb`) with auto-tagging, front-face anchor detection, and GLB color tinting
- GLB cache (`glbCacheRef`) so models only load once per session
- `skipAnimRef` suppresses the frame swap animation when returning from the AI scanner (instant model switch instead of spin-out/scale-in)
- Cinematic intro zoom on first load
- Animated frame transitions (old model spins + scales out, new scales in)
- Drag to rotate, scroll/pinch to zoom, mouse parallax on camera
- Smooth auto-spin mode with sinusoidal pitch nod
- Exploded view with `EXPLODE_DIR` per part, SVG leader lines, part name + spec labels that track 3D world positions in real time
- Cinematic camera angles per step (`STEP_ANGLES`) — each of the 8 steps has a curated x/y rotation and z distance
- Particle canvas overlay that colour-matches the active frame variant

### AR Try-On
- Integrated into the configurator flow at the Summary step (pre-checkout), also accessible via the nav tab
- Ready overlay with checklist (camera permissions, lighting, glasses removed) and confirmation checkbox before glasses render — camera feed is live behind the overlay so users can adjust positioning
- Glasses model only builds after the user dismisses the ready overlay, keeping the initial feed clean
- MediaPipe Face Landmarker (468-point mesh, VIDEO mode)
- One Euro Filters for position, scale, roll, yaw, pitch — aggressive smoothing when still, responsive during fast movement
- 3D coordinate frame constructed from landmark z-coordinates drives rotation (replaces unreliable `outputFacialTransformationMatrixes`)
- Anchor point: midpoint of inner eye corners (landmarks 133 + 362) with Y offset
- Quaternion slerp for rotation interpolation
- Frame and colour switching via `visible` toggling — no opacity/material system
- Colour selection from the configurator is preserved when entering AR from the Summary step
- `pivot` wrapper animated during frame swaps to prevent GLB drift
- Photo capture compositing (video canvas + WebGL canvas) with OPTIQ watermark
- Responsive: GPU delegate on desktop, CPU on mobile
- Back button returns to Summary step for seamless checkout continuation

### AI Fit Scanner
- First step in the configurator flow (Step 0), also accessible via the nav tab
- MediaPipe Face Landmarker in VIDEO mode
- Iris auto-calibration using average iris diameter (11.7mm reference) for mm-per-unit conversion
- Manual IPD override for higher accuracy
- Pre-scan flow: idle → loading → ready (lighting checklist + confirmation checkbox) → countdown (3-2-1) → scanning → complete
- Averages 20 landmark samples for stability
- Outputs face width, bridge width, face height, cheek width, face shape (round/square/oval/oblong), W/H ratio
- Recommends frame style and size, passes result back to configurator (`onApplyFit`)
- Smart return navigation: returns to Frame step (Step 1) with recommended frame pre-selected when triggered from the configurator, or to a custom return step when triggered from elsewhere

### Lens Recycling
- Dedicated "Recycle" tab accessible from the main navigation
- Form collects: full name, email, number of lens pairs, lens type (single vision / bifocal / progressive / other), and optional notes
- Animated form with scroll-triggered blur text heading and gradient accents
- Success confirmation shows the user's name, pair count, and email with a "Submit Another" reset option
- Integrated into the Our Impact page as the "Closing the Loop" section explaining the submit → assess → recover pipeline

### Checkout
- Stripe integration via Cloudflare Worker proxy (`/create-checkout-session` endpoint)
- Sends frame name, material, lens type, prescription details, and total price
- Collects Philippine shipping address
- Success/cancel URL redirects back to the configurator
- Stripe publishable key is safe to expose client-side; secret key lives in Cloudflare Workers secrets

### Other Pages
- **Our Impact** — framer-motion scroll animations, CountUp stats (82% less CO2, 12 caps per pair, ₱500 average cost, 24g plastic per frame), cost comparison table (traditional vs OPTIQ), process timeline, lens recycling program section, community impact cards
- **AI Chatbot (OPTI-BOT)** — floating chat widget backed by a Cloudflare Worker proxy to Groq (Llama 3.3 70B), 3D procedural glasses icon in the toggle button

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 + Vite 8 |
| 3D rendering | Three.js 0.183 (vanilla, no R3F) |
| Face tracking | MediaPipe Tasks Vision 0.10 |
| Animations | Framer Motion 12, GSAP 3 |
| AI chatbot | Groq API (Llama 3.3 70B) via Cloudflare Worker |
| Payments | Stripe Checkout via Cloudflare Worker |
| Fonts | Playfair Display, DM Sans, JetBrains Mono |
| Deployment | Vercel (frontend), Cloudflare Workers (API proxy) |

---

## Project Structure

```
glasses-viewer/
  public/
    models/
      glasses.glb          ← Eza's custom frame model
    favicon.svg
    icons.svg
  src/
    App.jsx                ← root, renders GlassesViewer + AIChatbot
    main.jsx               ← Vite entry point
    GlassesViewer.jsx      ← 8-step configurator, 3D scene, page routing
    ARTryOn.jsx            ← AR virtual try-on with ready overlay
    FitScanner.jsx         ← AI face measurement tool
    LensRecycle.jsx        ← lens recycling request form
    ImpactPage.jsx         ← sustainability/mission page with recycling section
    AIChatbot.jsx          ← floating OPTI-BOT chat widget
    ColorPicker.jsx        ← editorial expand-on-select colour picker
    LensPicker.jsx         ← 3D lens carousel picker
    FlowingMenu.jsx        ← GSAP marquee hover menu for frame selection
    InfiniteMenu.jsx       ← WebGL2 sphere grid menu (used for lens previews)
    useFrameThumbnails.js  ← hook: offscreen renders frame thumbnails for FlowingMenu
    lensImages.js          ← generates 3D-looking lens canvas images per frame shape
    index.css
    AIChatbot.css
    FlowingMenu.css
    InfiniteMenu.css
  cloudflare-worker/
    worker.js              ← Groq API + Stripe Checkout proxy
```

---

## Key Architectural Decisions

**AI face scan as the entry point.** The configurator opens with a face scan step that recommends frame style and size before the user touches anything. This makes the AI the core of the experience rather than an optional sidebar feature. Users can skip to manual selection if they prefer.

**Procedural geometry over file assets for built-in frames.** No .glb files needed for the four built-in styles. Geometry is built from Three.js primitives in `buildAviator` / `buildWayfarer` / `buildRound` / `buildCatEye`. Keeps the bundle light, iteration fast, and colour/material swapping trivial since we own every mesh.

**GLB support layered on top.** The custom "Eza's" frame loads a real .glb from `/public/models/`. `autoTagGLBMeshes` classifies each mesh by name and material properties, stores original colors for tinting, and makes it compatible with the same colour-swap and explode systems as procedural frames.

**`skipAnimRef` for scanner returns.** When the AI scanner recommends a frame and passes it back to the configurator, `skipAnimRef` suppresses the spin-out/scale-in animation so the recommended frame appears instantly. Without this, the default frame visibly swaps to the recommended one.

**Never `display: none` on a Three.js container.** Use `height: 0` + `overflow: hidden` + `visibility: hidden` to keep the mount div in the DOM with real dimensions. WebGL loses its sizing context if the container has zero dimensions.

**`ResizeObserver` not `window.resize` for the viewport.** The 3D canvas lives inside a flex layout that can reflow without triggering `window.resize`. `ResizeObserver` on the mount div catches all cases including flex column collapse on mobile.

**One Euro Filters over EMA for AR tracking.** They adapt: heavy smoothing when the face is still, fast response during movement. Position, scale, and all three rotation axes each have a dedicated filter with tuned `minCutoff` and `beta` parameters.

**Animate the `pivot` wrapper, not the inner model, during frame swaps.** Animating the model's own position/scale causes it to drift toward its local origin. The pivot wrapper has its origin at the scene center where the glasses actually sit.

**Colour changes are instant, frame switches are animated.** Colour swaps call `applyMaterials()` which directly mutates material properties in-place. Frame switches go through the full swap animation (scale-out old, scale-in new) to hide any GLB load time and give a premium feel.

**Silhouette diagram via offscreen WebGL render.** The size step diagram is generated by rendering the actual frame geometry through an orthographic camera with `MeshBasicMaterial({ color: white })`, captured as a PNG data URL. This means the diagram is always pixel-accurate with the 3D model — no manual SVG path maintenance required.

**AR ready overlay before glasses render.** The AR camera feed starts immediately so users can position themselves, but the 3D glasses model doesn't build until the user confirms they're ready via the overlay checklist. This prevents disorienting model placement on an unprepared feed and gives the user time to check lighting and remove existing glasses.

**AR try-on placed before checkout, not in a separate tab.** The Summary step includes a prominent AR try-on card so users see how the glasses look on their face right before paying. The AR page and scanner are still independently accessible via the nav for users who want to skip the full flow.

**Prescription as a dedicated configurator step.** Rather than burying Rx details in a modal or checkout form, prescription selection is a full step (Step 4) with guided dropdowns for vision type, grade, and astigmatism. A "different per eye" toggle reveals separate OD/OS panels. This keeps the flow linear and ensures prescription data is visible in the summary before checkout.

---

## Running Locally

```bash
cd glasses-viewer
npm install
npm run dev
```

Opens at `http://localhost:5173`.

### Chatbot + Stripe Worker (optional)
The chatbot and Stripe checkout both proxy through a single Cloudflare Worker to keep API keys server-side. To run it locally:
1. Install Wrangler: `npm install -g wrangler`
2. `cd cloudflare-worker && wrangler dev`
3. Update `WORKER_URL` in `AIChatbot.jsx` to `http://localhost:8787`

---

## Deploying

The app deploys automatically to Vercel on push. The Cloudflare Worker is deployed separately via `wrangler deploy` from the `cloudflare-worker/` directory with `GROQ_API_KEY` and `STRIPE_SECRET_KEY` secrets set in the Cloudflare dashboard.

---

## Adding Real .glb Models

1. Export from Blender as **glTF 2.0 Binary (.glb)**, target under 2MB
2. Name meshes clearly: `left-rim`, `right-rim`, `left-lens`, `right-lens`, `bridge`, `left-temple`, `right-temple`, `left-hinge`, `right-hinge`, `left-pad`, `right-pad` — these map directly to `PART_INFO` for explode labels and `autoTagGLBMeshes` for colour swapping
3. Drop into `public/models/`
4. Add a new entry to the `FRAMES` array in `GlassesViewer.jsx` with `url: "/models/your-frame.glb"` and `build: null`
5. The GLB pipeline (load → normalize scale → front-face anchor → auto-tag → cache) handles the rest

For production, host .glb files on a CDN (Cloudflare R2 or Vercel Blob) and point the `url` fields there.

---

## Environment Variables

None required for the core app. API keys live in Cloudflare Workers secrets:
- `GROQ_API_KEY` — for the OPTI-BOT chatbot
- `STRIPE_SECRET_KEY` — for checkout session creation

---

## What's Next

- Lens scanning (AI computer vision + reference-object scale calibration to extract prescription dimensions from a photo)
- Side-by-side frame compare mode
- Saved builds / wishlist
- Production .glb models from the 3D team
- Backend for lens recycling submissions (currently frontend-only)
- Split `GlassesViewer.jsx` into smaller components for maintainability
