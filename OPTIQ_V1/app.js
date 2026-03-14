/* =============================================
   app.js — FrameForge Glasses Customizer
   ============================================= */

// ── Tab Navigation ──────────────────────────────────────────────────────────

function switchTab(tabName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const page = document.getElementById('page-' + tabName);
  const tab  = document.getElementById('tab-' + tabName);
  if (page) page.classList.add('active');
  if (tab)  tab.classList.add('active');

  // Three.js canvas renders with 0×0 while hidden — trigger a resize so it fills correctly
  if (tabName === 'customizer') {
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  }
}

document.querySelectorAll('.nav-tab').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterFrames(btn.dataset.filter);
  });
});

// ── Frames Data ─────────────────────────────────────────────────────────────

const FRAMES = [
  {
    id: 'classic-rect', name: 'Classic Rectangle', category: 'rectangular',
    tags: ['Modern', 'Lightweight', 'Daily Wear'],
    desc: 'Clean lines, timeless rectangular profile. Great for everyday use.',
    svgPath: 'rect',
    dims: { lw: 52, lh: 36, bw: 18 },
  },
  {
    id: 'bold-square', name: 'Bold Square', category: 'rectangular',
    tags: ['Bold', 'Statement', 'Thick Frame'],
    desc: 'A chunky, high-impact square frame that makes a statement.',
    svgPath: 'bold_square',
    dims: { lw: 50, lh: 50, bw: 20 },
  },
  {
    id: 'round-classic', name: 'Round Classic', category: 'round',
    tags: ['Retro', 'Slim', 'Unisex'],
    desc: 'Perfectly circular lenses — a retro icon reborn in 3D-printed form.',
    svgPath: 'round',
    dims: { lw: 48, lh: 48, bw: 16 },
  },
  {
    id: 'round-oversized', name: 'Oversized Round', category: 'round',
    tags: ['Oversized', 'Fashion', 'Vintage'],
    desc: 'Big, bold circles for maximum vintage fashion energy.',
    svgPath: 'round',
    dims: { lw: 60, lh: 60, bw: 20 },
  },
  {
    id: 'cat-eye', name: 'Cat-Eye', category: 'round',
    tags: ["Feminine", 'Retro', '50s Revival'],
    desc: 'Upswept outer corners inspired by classic 1950s glamour.',
    svgPath: 'cat_eye',
    dims: { lw: 54, lh: 40, bw: 18 },
  },
  {
    id: 'aviator', name: 'Aviator', category: 'sporty',
    tags: ['Teardrop', 'Sporty', 'Iconic'],
    desc: 'Iconic teardrop silhouette. Slim wire-style frame printable in flexible filament.',
    svgPath: 'aviator',
    dims: { lw: 55, lh: 50, bw: 22 },
  },
  {
    id: 'wireframe', name: 'Wireframe Minimalist', category: 'rectangular',
    tags: ['Ultra-Thin', 'Minimal', 'Futuristic'],
    desc: 'A hairline-thin wire rectangular frame — modern and ultra-minimal.',
    svgPath: 'rect',
    dims: { lw: 52, lh: 34, bw: 16 },
  },
  {
    id: 'browline', name: 'Browline', category: 'rectangular',
    tags: ['Browline', 'Intellectual', 'Classic'],
    desc: 'Bold top half, rimless bottom — the scholarly look of the 1960s.',
    svgPath: 'browline',
    dims: { lw: 52, lh: 40, bw: 18 },
  },
  {
    id: 'hexagonal', name: 'Hexagonal', category: 'round',
    tags: ['Geometric', 'Artistic', 'Unique'],
    desc: 'Six-sided lenses for an artsy, geometric look that stands out.',
    svgPath: 'hex',
    dims: { lw: 50, lh: 46, bw: 18 },
  },
  {
    id: 'sport-wrap', name: 'Sport Wrap', category: 'sporty',
    tags: ['Sport', 'Wide', 'Active'],
    desc: 'Wide-coverage sporty wrap frame, ideal for outdoor activities.',
    svgPath: 'rect',
    dims: { lw: 60, lh: 38, bw: 14 },
  },
  {
    id: 'half-rim', name: 'Half-Rim', category: 'rectangular',
    tags: ['Half-Rim', 'Professional', 'Lightweight'],
    desc: 'Top-framed only for a lightweight, professional appearance.',
    svgPath: 'half_rim',
    dims: { lw: 50, lh: 36, bw: 18 },
  },
  {
    id: 'panto', name: 'Panto / P3', category: 'round',
    tags: ['Panto', 'Rounded Square', 'Casual'],
    desc: 'The classic P3 panto — a rounded square silhouette beloved for decades.',
    svgPath: 'round',
    dims: { lw: 48, lh: 44, bw: 18 },
  },
];

// ── Build SVG for each frame card ─────────────────────────────────────────

function buildFrameSVG(frame, color = '#a78bfa') {
  const c = color;
  const sw = 5;
  const gradId = 'g-' + frame.id;

  const defs = `<defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c}"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
  </defs>`;

  const stroke = `url(#${gradId})`;
  const fill = `${c}18`;

  let leftLens, rightLens;
  const rx = frame.svgPath === 'round' ? 50 : frame.svgPath === 'cat_eye' ? 18 : 10;

  if (frame.svgPath === 'round') {
    leftLens  = `<ellipse cx="68"  cy="60" rx="48" ry="44" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    rightLens = `<ellipse cx="192" cy="60" rx="48" ry="44" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  } else if (frame.svgPath === 'aviator') {
    leftLens  = `<path d="M 20 30 Q 20 90 68 90 Q 116 90 116 50 Q 116 20 80 20 Q 42 20 20 30 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    rightLens = `<path d="M 240 30 Q 240 90 192 90 Q 144 90 144 50 Q 144 20 160 20 Q 210 20 240 30 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  } else if (frame.svgPath === 'cat_eye') {
    leftLens  = `<path d="M 20 60 Q 20 25 68 20 L 115 30 Q 116 60 90 80 Q 50 88 20 60 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    rightLens = `<path d="M 240 60 Q 240 25 192 20 L 145 30 Q 144 60 170 80 Q 210 88 240 60 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  } else if (frame.svgPath === 'browline') {
    leftLens  = `<rect x="20" y="20" width="96" height="70" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
                 <rect x="20" y="20" width="96" height="26" rx="10" fill="${c}" stroke="${stroke}" stroke-width="${sw}"/>`;
    rightLens = `<rect x="144" y="20" width="96" height="70" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
                 <rect x="144" y="20" width="96" height="26" rx="10" fill="${c}" stroke="${stroke}" stroke-width="${sw}"/>`;
  } else if (frame.svgPath === 'half_rim') {
    leftLens  = `<rect x="20" y="20" width="96" height="70" rx="10" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="96 70 0 96"/>
                 <path d="M 20 20 Q 20 20 30 20 L 106 20 Q 116 20 116 30 L 116 50" fill="none" stroke="${stroke}" stroke-width="${sw}"/>
                 <path d="M 116 50 L 20 50" fill="none" stroke="${stroke}" stroke-width="2"/>`;
    rightLens = `<path d="M 144 20 Q 144 20 154 20 L 230 20 Q 240 20 240 30 L 240 50" fill="none" stroke="${stroke}" stroke-width="${sw}"/>
                 <path d="M 240 50 L 144 50" fill="none" stroke="${stroke}" stroke-width="2"/>`;
  } else if (frame.svgPath === 'hex') {
    leftLens  = `<polygon points="68,16 114,38 114,82 68,104 22,82 22,38" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    rightLens = `<polygon points="192,16 238,38 238,82 192,104 146,82 146,38" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  } else {
    leftLens  = `<rect x="20" y="22" width="96" height="66" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    rightLens = `<rect x="144" y="22" width="96" height="66" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  }

  const bridge = `<line x1="116" y1="52" x2="144" y2="52" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`;
  const temples = `<line x1="20" y1="52" x2="-10" y2="54" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>
                   <line x1="240" y1="52" x2="270" y2="54" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`;

  return `<svg viewBox="-20 5 300 110" xmlns="http://www.w3.org/2000/svg">
    ${defs}${temples}${leftLens}${rightLens}${bridge}
  </svg>`;
}

// ── Render Frames Grid ───────────────────────────────────────────────────────

function renderFrames(filter = 'all') {
  const grid = document.getElementById('frames-grid');
  grid.innerHTML = '';
  const visible = filter === 'all' ? FRAMES : FRAMES.filter(f => f.category === filter);

  visible.forEach(frame => {
    const card = document.createElement('div');
    card.className = 'frame-card';
    card.dataset.id = frame.id;
    card.innerHTML = `
      <div class="frame-preview">${buildFrameSVG(frame)}</div>
      <div class="frame-info">
        <div class="frame-name">${frame.name}</div>
        <div class="frame-meta">${frame.dims.lw}mm · ${frame.dims.lh}mm · Bridge ${frame.dims.bw}mm</div>
        <div class="frame-tags">${frame.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="frame-action">
          <button class="btn-sm btn-sm-primary" onclick="loadFrameInCustomizer('${frame.id}')">Customize</button>
          <button class="btn-sm btn-sm-ghost" onclick="showToast('${frame.name} added to wishlist ✓')">♡ Save</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

function filterFrames(filter) { renderFrames(filter); }

function loadFrameInCustomizer(id) {
  const frame = FRAMES.find(f => f.id === id);
  if (!frame) return;

  document.getElementById('lens-width').value    = frame.dims.lw;
  document.getElementById('lens-height').value   = frame.dims.lh;
  document.getElementById('bridge-width').value  = frame.dims.bw;

  updateAllSliders();

  const styleMap = { 'round-classic': 'round', 'round-oversized': 'round', 'cat-eye': 'cat-eye', aviator: 'aviator' };
  const style = styleMap[id] || 'rectangular';
  document.querySelectorAll('.style-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.style === style);
  });
  currentStyle = style;
  updatePreview();

  switchTab('customizer');
  showToast(`"${frame.name}" loaded in Customizer ✨`);
}

// ── Customizer State ─────────────────────────────────────────────────────────

let currentColor = '#a78bfa';
let currentStyle = 'rectangular';

const SLIDER_MAP = {
  'lens-width':     { label: 'lw-val', spec: 'spec-lw', unit: 'mm' },
  'lens-height':    { label: 'lh-val', spec: 'spec-lh', unit: 'mm' },
  'bridge-width':   { label: 'bw-val', spec: 'spec-bw', unit: 'mm' },
  'temple-length':  { label: 'tl-val', spec: 'spec-tl', unit: 'mm' },
  'frame-thickness':{ label: 'ft-val', spec: 'spec-ft', unit: 'mm' },
};

function updateSlider(id) {
  const input = document.getElementById(id);
  const val   = parseFloat(input.value);
  const map   = SLIDER_MAP[id];
  if (!map) return;

  document.getElementById(map.label).textContent = val + map.unit;
  document.getElementById(map.spec).textContent  = val.toFixed(1) + map.unit;

  updatePreview();
  updateMeasurementBar();
  updatePrintTime();
}

function updateAllSliders() {
  Object.keys(SLIDER_MAP).forEach(id => updateSlider(id));
}

function setStyle(style, btn) {
  currentStyle = style;
  document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updatePreview();
}

function setColor(swatch) {
  currentColor = swatch.dataset.color;
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  swatch.classList.add('active');
  updatePreview();
}

// ── Live SVG Update ──────────────────────────────────────────────────────────

function updatePreview() {
  const lw  = parseFloat(document.getElementById('lens-width').value);
  const lh  = parseFloat(document.getElementById('lens-height').value);
  const bw  = parseFloat(document.getElementById('bridge-width').value);
  const tl  = parseFloat(document.getElementById('temple-length').value);
  const ft  = parseFloat(document.getElementById('frame-thickness').value);

  const color = currentColor;

  // Map mm values to SVG pixel space
  // Base: lw=52 → 130px; lh=38 → 80px; bw=18 → 40px; tl=140 → 30px temple line
  const lensW  = (lw  / 52)  * 130;
  const lensH  = (lh  / 38)  * 80;
  const bridgeW = (bw / 18)  * 40;
  const templeL = (tl / 140) * 30;
  const strokeW = Math.max(2, (ft / 3) * 5);

  // Centre of SVG canvas: total width ≈ 360
  const canvasW = 360;
  const leftCx  = (canvasW - bridgeW) / 2 - lensW / 2; // left lens x
  const rightCx = (canvasW + bridgeW) / 2;              // right lens x
  const lensY   = (120 - lensH) / 2;                    // vertical centre

  const rx = currentStyle === 'round'     ? Math.min(lensW, lensH) / 2 :
             currentStyle === 'rectangular' ? 10 :
             currentStyle === 'aviator'   ? Math.min(lensW, lensH) / 2 :
             currentStyle === 'cat-eye'   ? 20 : 10;

  const fill = color + '18';

  // Gradient for current colour
  const gradId = 'fgGrad';
  const svg = document.getElementById('glasses-svg');

  svg.style.setProperty('--stroke-width', strokeW);

  // Update gradient colours
  const stops = svg.querySelectorAll('#frameGrad stop');
  if (stops.length >= 2) {
    stops[0].style.stopColor = color;
    stops[1].style.stopColor = color;
  }

  // Left lens
  const ll = document.getElementById('svg-lens-left');
  const rl = document.getElementById('svg-lens-right');
  const br = document.getElementById('svg-bridge');
  const tl_el = document.getElementById('svg-temple-left');
  const tr_el = document.getElementById('svg-temple-right');

  // Apply to left lens
  ll.setAttribute('x', leftCx);
  ll.setAttribute('y', lensY);
  ll.setAttribute('width', lensW);
  ll.setAttribute('height', lensH);
  ll.setAttribute('rx', currentStyle === 'round' ? Math.min(lensW, lensH) / 2 : rx);
  ll.setAttribute('ry', currentStyle === 'round' ? Math.min(lensW, lensH) / 2 : rx);
  ll.setAttribute('stroke-width', strokeW);
  ll.setAttribute('fill', fill);

  // Apply to right lens
  rl.setAttribute('x', rightCx);
  rl.setAttribute('y', lensY);
  rl.setAttribute('width', lensW);
  rl.setAttribute('height', lensH);
  rl.setAttribute('rx', currentStyle === 'round' ? Math.min(lensW, lensH) / 2 : rx);
  rl.setAttribute('ry', currentStyle === 'round' ? Math.min(lensW, lensH) / 2 : rx);
  rl.setAttribute('stroke-width', strokeW);
  rl.setAttribute('fill', fill);

  // Bridge
  const midY = lensY + lensH / 2;
  const bx1  = leftCx + lensW;
  const bx2  = rightCx;
  br.setAttribute('d', `M ${bx1} ${midY} Q ${(bx1+bx2)/2} ${midY - 8} ${bx2} ${midY}`);
  br.setAttribute('stroke-width', strokeW);

  // Temples
  const templeY = lensY + lensH * 0.45;
  tl_el.setAttribute('x1', leftCx);
  tl_el.setAttribute('y1', templeY);
  tl_el.setAttribute('x2', leftCx - templeL);
  tl_el.setAttribute('y2', templeY + 2);
  tl_el.setAttribute('stroke-width', strokeW);

  tr_el.setAttribute('x1', rightCx + lensW);
  tr_el.setAttribute('y1', templeY);
  tr_el.setAttribute('x2', rightCx + lensW + templeL);
  tr_el.setAttribute('y2', templeY + 2);
  tr_el.setAttribute('stroke-width', strokeW);

  updateMeasurementBar();
}

function updateMeasurementBar() {
  const lw = document.getElementById('lens-width').value;
  const bw = document.getElementById('bridge-width').value;
  const tl = document.getElementById('temple-length').value;
  const bar = document.getElementById('preview-measurements');
  if (bar) {
    bar.innerHTML = `<span>LW: ${lw}mm</span><span>BW: ${bw}mm</span><span>TL: ${tl}mm</span>`;
  }
}

function updatePrintTime() {
  const lw = parseFloat(document.getElementById('lens-width').value);
  const lh = parseFloat(document.getElementById('lens-height').value);
  const ft = parseFloat(document.getElementById('frame-thickness').value);
  const tl = parseFloat(document.getElementById('temple-length').value);

  // Very rough heuristic
  const vol = (lw * lh * ft * 2 + tl * 5 * ft * 2) / 1000; // cm³
  const h   = (vol * 0.8 + 0.8).toFixed(1);
  const el  = document.getElementById('spec-pt');
  if (el) el.textContent = `~${h}h`;
}

// ── Export & Reset ───────────────────────────────────────────────────────────

function exportSTL() {
  showToast('🖨️ STL generation is a hackathon placeholder — coming soon!');
}

function resetCustomizer() {
  document.getElementById('lens-width').value     = 52;
  document.getElementById('lens-height').value    = 38;
  document.getElementById('bridge-width').value   = 18;
  document.getElementById('temple-length').value  = 140;
  document.getElementById('frame-thickness').value = 3;
  currentColor = '#a78bfa';
  currentStyle = 'rectangular';

  document.querySelectorAll('.color-swatch').forEach((s, i) => s.classList.toggle('active', i === 0));
  document.querySelectorAll('.style-btn').forEach(b => b.classList.toggle('active', b.dataset.style === 'rectangular'));

  updateAllSliders();
  showToast('↺ Reset to defaults');
}

// ── Toast ────────────────────────────────────────────────────────────────────

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ── Init ─────────────────────────────────────────────────────────────────────

if (document.getElementById('frames-grid')) {
  renderFrames('all');
}
if (document.getElementById('lens-width')) {
  updateAllSliders();
  updatePreview();
}
