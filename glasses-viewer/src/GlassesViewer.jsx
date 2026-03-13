import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

/* ── helpers ─────────────────────────────────────────────── */
const lerp = (a, b, t) => a + (b - a) * t;
const deg = (d) => (d * Math.PI) / 180;
const hex = (n) => `#${n.toString(16).padStart(6, "0")}`;

/* ── fonts ───────────────────────────────────────────────── */
if (typeof document !== "undefined") {
  const fl = document.createElement("link"); fl.rel = "stylesheet";
  fl.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap";
  document.head.appendChild(fl);
}

/* ═══════════════════════════════════════════════════════════
   PART LABELS — shown in exploded view (Apple keynote style)
   ═══════════════════════════════════════════════════════════ */
const PART_INFO = {
  "left-rim":     { label: "Frame Rim",           detail: "Titanium alloy, 0.8mm" },
  "right-rim":    { label: "Frame Rim",           detail: "Titanium alloy, 0.8mm" },
  "left-lens":    { label: "Polarised Lens",      detail: "CR-39 with UV400 filter" },
  "right-lens":   { label: "Polarised Lens",      detail: "CR-39 with UV400 filter" },
  "bridge":       { label: "Bridge",              detail: "Ergonomic double-arch" },
  "bridge-upper": { label: "Upper Bridge",        detail: "Reinforced titanium wire" },
  "bridge-lower": { label: "Lower Bridge",        detail: "Flexible support bar" },
  "left-temple":  { label: "Temple Arm",          detail: "Memory flex, 140mm" },
  "right-temple": { label: "Temple Arm",          detail: "Memory flex, 140mm" },
  "left-hinge":   { label: "Spring Hinge",        detail: "5-barrel nickel silver" },
  "right-hinge":  { label: "Spring Hinge",        detail: "5-barrel nickel silver" },
  "left-pad":     { label: "Nose Pad",            detail: "Silicone, hypoallergenic" },
  "right-pad":    { label: "Nose Pad",            detail: "Silicone, hypoallergenic" },
  "top-bar":      { label: "Top Bar",             detail: "Injection-moulded acetate" },
};

/* explode directions per part */
const EXPLODE_DIR = {
  "left-rim":     new THREE.Vector3(-0.6,  0.1,  0.3),
  "right-rim":    new THREE.Vector3( 0.6,  0.1,  0.3),
  "left-lens":    new THREE.Vector3(-0.5,  0.0,  0.8),
  "right-lens":   new THREE.Vector3( 0.5,  0.0,  0.8),
  "bridge":       new THREE.Vector3( 0.0,  0.5,  0.2),
  "bridge-upper": new THREE.Vector3( 0.0,  0.55, 0.2),
  "bridge-lower": new THREE.Vector3( 0.0,  0.35, 0.2),
  "left-temple":  new THREE.Vector3(-0.5, -0.1, -0.7),
  "right-temple": new THREE.Vector3( 0.5, -0.1, -0.7),
  "left-hinge":   new THREE.Vector3(-0.8,  0.3, -0.1),
  "right-hinge":  new THREE.Vector3( 0.8,  0.3, -0.1),
  "left-pad":     new THREE.Vector3(-0.2, -0.7,  0.4),
  "right-pad":    new THREE.Vector3( 0.2, -0.7,  0.4),
  "top-bar":      new THREE.Vector3( 0.0,  0.6,  0.15),
};

/* which labels to show (skip duplicates — only label one side) */
const LABEL_PARTS = ["right-lens", "bridge", "right-temple", "right-hinge", "right-pad"];
const LABEL_PARTS_WAYFARER = ["right-lens", "bridge", "right-temple", "right-hinge", "right-pad", "top-bar"];

/* ═══════════════════════════════════════════════════════════
   FRAME DATA
   ═══════════════════════════════════════════════════════════ */
const FRAMES = [
  {
    id: "aviator", name: "Aviator Classic", category: "Sunglasses", price: 189,
    tagline: "Born to fly", labelParts: LABEL_PARTS,
    dimensions: { lens: "58mm", bridge: "14mm", temple: "140mm", height: "50mm" },
    description: "Timeless teardrop silhouette with double bridge. Lightweight titanium frame with anti-scratch coating.",
    colors: [
      { name: "Gunmetal",  frame: 0x4a4a4a, lens: 0x556b2f, accent: 0x888888, bg: ["#0f1114","#1a1d23","#12141a"], particle: "#666" },
      { name: "Gold",      frame: 0xc8a84e, lens: 0x5a4a2a, accent: 0xd4af37, bg: ["#1a1508","#2a2010","#1e1a0c"], particle: "#c8a84e" },
      { name: "Rose Gold", frame: 0xb76e79, lens: 0x6b4a52, accent: 0xd4a0a0, bg: ["#1a1015","#2a1520","#1e1018"], particle: "#d4a0a0" },
    ],
    build: buildAviator,
  },
  {
    id: "wayfarer", name: "Wayfarer Bold", category: "Everyday", price: 159,
    tagline: "Unapologetically bold", labelParts: LABEL_PARTS_WAYFARER,
    dimensions: { lens: "54mm", bridge: "18mm", temple: "145mm", height: "42mm" },
    description: "Bold acetate frame with a slightly oversized fit. UV400 protection with polarised lenses available.",
    colors: [
      { name: "Matte Black", frame: 0x1a1a1a, lens: 0x333344, accent: 0x444444, bg: ["#08080a","#141418","#0c0c10"], particle: "#444" },
      { name: "Tortoise",    frame: 0x8b5e3c, lens: 0x5a4530, accent: 0xa0724a, bg: ["#1a1008","#2a1d10","#1e140c"], particle: "#a0724a" },
      { name: "Navy",        frame: 0x1a2744, lens: 0x334466, accent: 0x3a5580, bg: ["#080c14","#101828","#0c1420"], particle: "#3a5580" },
    ],
    build: buildWayfarer,
  },
  {
    id: "round", name: "Round Wire", category: "Optical", price: 219,
    tagline: "Less is everything", labelParts: LABEL_PARTS,
    dimensions: { lens: "49mm", bridge: "20mm", temple: "135mm", height: "49mm" },
    description: "Minimalist round frame in surgical-grade stainless steel. Adjustable nose pads for all-day comfort.",
    colors: [
      { name: "Silver", frame: 0xc0c0c0, lens: 0x99bbdd, accent: 0xe0e0e0, bg: ["#0e1018","#181c28","#121620"], particle: "#c0c0c0" },
      { name: "Black",  frame: 0x222222, lens: 0x445566, accent: 0x555555, bg: ["#0a0a0c","#141416","#0e0e12"], particle: "#555" },
      { name: "Copper", frame: 0xb87333, lens: 0x88775a, accent: 0xcc8844, bg: ["#1a1208","#2a1e10","#1e160c"], particle: "#cc8844" },
    ],
    build: buildRound,
  },
  {
    id: "cat-eye", name: "Cat-Eye Luxe", category: "Statement", price: 249,
    tagline: "Lead, never follow", labelParts: LABEL_PARTS,
    dimensions: { lens: "55mm", bridge: "16mm", temple: "138mm", height: "46mm" },
    description: "Dramatic upswept corners with hand-polished acetate. A bold silhouette for those who lead, not follow.",
    colors: [
      { name: "Burgundy", frame: 0x6b2040, lens: 0x553344, accent: 0x8a3050, bg: ["#14080e","#221018","#1a0c14"], particle: "#8a3050" },
      { name: "Ivory",    frame: 0xd4c8b0, lens: 0x998877, accent: 0xe8dcc0, bg: ["#18160e","#28241a","#201c14"], particle: "#e8dcc0" },
      { name: "Emerald",  frame: 0x1a5c3a, lens: 0x2a4a3a, accent: 0x2a7a50, bg: ["#081410","#102a1c","#0c2018"], particle: "#2a7a50" },
    ],
    build: buildCatEye,
  },
];

/* ═══════════════════════════════════════════════════════════
   GEOMETRY BUILDERS — each mesh gets userData.partName
   ═══════════════════════════════════════════════════════════ */
function makeMaterials(color) {
  return {
    frame: new THREE.MeshPhysicalMaterial({ color: color.frame, metalness: 0.6, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.DoubleSide }),
    lens: new THREE.MeshPhysicalMaterial({ color: color.lens, metalness: 0, roughness: 0.05, transmission: 0.8, thickness: 0.3, ior: 1.5, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
    hinge: new THREE.MeshPhysicalMaterial({ color: color.accent, metalness: 0.9, roughness: 0.12, clearcoat: 0.5, side: THREE.DoubleSide }),
  };
}
function tag(mesh, name) { mesh.userData.partName = name; return mesh; }

function addTemples(g, mat, xs, yS = 0) {
  xs.forEach(({ x, sign }) => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(x, yS, 0), new THREE.Vector3(x + sign * 0.04, yS, -0.3), new THREE.Vector3(x + sign * 0.04, yS - 0.04, -0.9), new THREE.Vector3(x + sign * 0.02, yS - 0.14, -1.05)]);
    const m = new THREE.Mesh(new THREE.TubeGeometry(c, 32, 0.02, 8, false), mat); m.castShadow = true;
    tag(m, x < 0 ? "left-temple" : "right-temple");
    g.add(m);
  });
}
function addHinges(g, mat, ps) {
  const geo = new THREE.CylinderGeometry(0.028, 0.028, 0.055, 12);
  ps.forEach(([x, y], i) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, -0.01); m.rotation.z = Math.PI / 2; m.castShadow = true; tag(m, i === 0 ? "left-hinge" : "right-hinge"); g.add(m); });
}
function addNosePads(g, mat, ps) {
  const geo = new THREE.SphereGeometry(0.025, 12, 12);
  ps.forEach(([x, y, z], i) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(1, 1.3, 0.6); tag(m, i === 0 ? "left-pad" : "right-pad"); g.add(m); });
}

function buildAviator(color) {
  const g = new THREE.Group(), m = makeMaterials(color);
  const s = new THREE.Shape(); s.moveTo(0, 0.38); s.quadraticCurveTo(0.42, 0.38, 0.44, 0); s.quadraticCurveTo(0.42, -0.42, 0, -0.44); s.quadraticCurveTo(-0.42, -0.42, -0.44, 0); s.quadraticCurveTo(-0.42, 0.38, 0, 0.38);
  const pts = s.getPoints(64);
  const rG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, p.y, 0)), true), 64, 0.03, 8, true);
  const dG = new THREE.ShapeGeometry(s, 64);
  [-0.54, 0.54].forEach((x, i) => {
    const r = tag(new THREE.Mesh(rG, m.frame), i === 0 ? "left-rim" : "right-rim"); r.position.x = x; r.castShadow = true; g.add(r);
    const d = tag(new THREE.Mesh(dG, m.lens), i === 0 ? "left-lens" : "right-lens"); d.position.set(x, 0, 0.005); g.add(d);
  });
  [0.08, -0.02].forEach((y, i) => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.12, y, 0), new THREE.Vector3(0, y + 0.04, 0.02), new THREE.Vector3(0.12, y, 0)]);
    g.add(tag(new THREE.Mesh(new THREE.TubeGeometry(c, 16, 0.018, 8, false), m.frame), i === 0 ? "bridge-upper" : "bridge-lower"));
  });
  addTemples(g, m.frame, [{ x: -0.96, sign: -1 }, { x: 0.96, sign: 1 }]);
  addHinges(g, m.hinge, [[-0.96, 0], [0.96, 0]]); addNosePads(g, m.hinge, [[-0.16, -0.28, 0.08], [0.16, -0.28, 0.08]]); return g;
}
function buildWayfarer(color) {
  const g = new THREE.Group(), m = makeMaterials(color); m.frame.metalness = 0.1; m.frame.roughness = 0.45; m.frame.clearcoat = 0.6;
  const s = new THREE.Shape(); s.moveTo(-0.38, 0.24); s.lineTo(0.4, 0.28); s.quadraticCurveTo(0.44, 0, 0.38, -0.24); s.lineTo(-0.36, -0.22); s.quadraticCurveTo(-0.42, 0, -0.38, 0.24);
  const pts = s.getPoints(64);
  const rG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, p.y, 0)), true), 64, 0.04, 8, true);
  const dG = new THREE.ShapeGeometry(s, 64);
  const tb = new THREE.Shape(); tb.moveTo(-1.02, 0.22); tb.lineTo(1.02, 0.22); tb.lineTo(1.02, 0.36); tb.quadraticCurveTo(0, 0.40, -1.02, 0.36); tb.lineTo(-1.02, 0.22);
  const t = tag(new THREE.Mesh(new THREE.ExtrudeGeometry(tb, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3 }), m.frame), "top-bar"); t.position.z = -0.03; t.castShadow = true; g.add(t);
  [-0.52, 0.52].forEach((x, i) => {
    const r = tag(new THREE.Mesh(rG, m.frame), i === 0 ? "left-rim" : "right-rim"); r.position.x = x; r.castShadow = true; g.add(r);
    const d = tag(new THREE.Mesh(dG, m.lens), i === 0 ? "left-lens" : "right-lens"); d.position.set(x, 0, 0.005); g.add(d);
  });
  const bc = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.14, 0.04, 0), new THREE.Vector3(0, 0.10, 0.02), new THREE.Vector3(0.14, 0.04, 0)]);
  g.add(tag(new THREE.Mesh(new THREE.TubeGeometry(bc, 16, 0.028, 8, false), m.frame), "bridge"));
  addTemples(g, m.frame, [{ x: -0.94, sign: -1 }, { x: 0.94, sign: 1 }]);
  addHinges(g, m.hinge, [[-0.94, 0.05], [0.94, 0.05]]); addNosePads(g, m.hinge, [[-0.16, -0.18, 0.08], [0.16, -0.18, 0.08]]); return g;
}
function buildRound(color) {
  const g = new THREE.Group(), m = makeMaterials(color);
  const rG = new THREE.TorusGeometry(0.38, 0.022, 16, 64), dG = new THREE.CircleGeometry(0.38, 64);
  [-0.48, 0.48].forEach((x, i) => {
    const r = tag(new THREE.Mesh(rG, m.frame), i === 0 ? "left-rim" : "right-rim"); r.position.x = x; r.castShadow = true; g.add(r);
    const d = tag(new THREE.Mesh(dG, m.lens), i === 0 ? "left-lens" : "right-lens"); d.position.set(x, 0, 0.005); g.add(d);
  });
  const bc = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.10, 0.06, 0), new THREE.Vector3(-0.04, 0.14, 0.03), new THREE.Vector3(0.04, 0.14, 0.03), new THREE.Vector3(0.10, 0.06, 0)]);
  g.add(tag(new THREE.Mesh(new THREE.TubeGeometry(bc, 20, 0.018, 8, false), m.frame), "bridge"));
  addTemples(g, m.frame, [{ x: -0.86, sign: -1 }, { x: 0.86, sign: 1 }]);
  addHinges(g, m.hinge, [[-0.86, 0], [0.86, 0]]); addNosePads(g, m.hinge, [[-0.14, -0.22, 0.08], [0.14, -0.22, 0.08]]); return g;
}
function buildCatEye(color) {
  const g = new THREE.Group(), m = makeMaterials(color); m.frame.metalness = 0.15; m.frame.roughness = 0.4; m.frame.clearcoat = 0.8;
  const s = new THREE.Shape(); s.moveTo(-0.36, 0.18); s.quadraticCurveTo(-0.10, 0.30, 0.20, 0.34); s.quadraticCurveTo(0.46, 0.30, 0.44, 0.08); s.quadraticCurveTo(0.42, -0.22, 0.10, -0.26); s.quadraticCurveTo(-0.24, -0.26, -0.38, -0.10); s.quadraticCurveTo(-0.42, 0.04, -0.36, 0.18);
  const pts = s.getPoints(64);
  const rG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, p.y, 0)), true), 64, 0.035, 8, true);
  const dG = new THREE.ShapeGeometry(s, 64);
  [-0.52, 0.52].forEach((x, i) => {
    const r = tag(new THREE.Mesh(rG, m.frame), i === 0 ? "left-rim" : "right-rim"); r.position.x = x; if (i === 0) r.scale.x = -1; r.castShadow = true; g.add(r);
    const d = tag(new THREE.Mesh(dG, m.lens), i === 0 ? "left-lens" : "right-lens"); d.position.set(x, 0, 0.005); if (i === 0) d.scale.x = -1; g.add(d);
  });
  const bc = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.14, 0.10, 0), new THREE.Vector3(0, 0.16, 0.02), new THREE.Vector3(0.14, 0.10, 0)]);
  g.add(tag(new THREE.Mesh(new THREE.TubeGeometry(bc, 16, 0.025, 8, false), m.frame), "bridge"));
  addTemples(g, m.frame, [{ x: -0.92, sign: -1 }, { x: 0.92, sign: 1 }], 0.12);
  addHinges(g, m.hinge, [[-0.92, 0.12], [0.92, 0.12]]); addNosePads(g, m.hinge, [[-0.16, -0.16, 0.08], [0.16, -0.16, 0.08]]); return g;
}

/* ═══════════════════════════════════════════════════════════
   PARTICLES
   ═══════════════════════════════════════════════════════════ */
function useParticles(canvasRef, colorStr) {
  const colorRef = useRef(colorStr); colorRef.current = colorStr;
  useEffect(() => {
    const cvs = canvasRef.current; if (!cvs) return;
    const ctx = cvs.getContext("2d"); let w, h;
    const resize = () => { w = cvs.width = window.innerWidth; h = cvs.height = window.innerHeight; }; resize();
    window.addEventListener("resize", resize);
    const P = []; for (let i = 0; i < 50; i++) P.push({ x: Math.random() * 2000, y: Math.random() * 2000, vx: (Math.random() - 0.5) * 0.3, vy: -Math.random() * 0.35 - 0.1, r: Math.random() * 2.5 + 0.5, a: Math.random() * 0.4 + 0.08, pulse: Math.random() * Math.PI * 2 });
    let raf;
    const draw = () => { raf = requestAnimationFrame(draw); ctx.clearRect(0, 0, w, h); P.forEach(p => { p.x += p.vx; p.y += p.vy; p.pulse += 0.015; if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; } if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = colorRef.current; ctx.globalAlpha = p.a * (0.5 + 0.5 * Math.sin(p.pulse)); ctx.fill(); }); ctx.globalAlpha = 1; };
    draw(); return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [canvasRef]);
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function GlassesViewer() {
  const mountRef = useRef(null);
  const labelsRef = useRef(null);
  const sceneRef = useRef({});
  const particleCanvasRef = useRef(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("frames");
  const [transitioning, setTransitioning] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [labelPositions, setLabelPositions] = useState([]);

  const frame = FRAMES[frameIdx];
  const color = frame.colors[colorIdx];
  useParticles(particleCanvasRef, color.particle);

  /* ── build glasses ── */
  const buildGlasses = useCallback((fIdx, cIdx, animate = true) => {
    const { scene, state } = sceneRef.current; if (!scene) return;
    const oldG = sceneRef.current.glasses;
    const f = FRAMES[fIdx], c = f.colors[cIdx];
    const glasses = f.build(c);
    glasses.rotation.set(deg(8), deg(-25), 0);
    if (animate) glasses.scale.setScalar(0.01);
    scene.add(glasses);
    sceneRef.current.glasses = glasses;
    if (state) { state.targetRotX = deg(8); state.targetRotY = deg(-25); }
    if (animate) {
      let t = 0;
      const swap = setInterval(() => {
        t += 0.04;
        if (oldG) { const s = Math.max(0, 1 - t * 2.5); oldG.scale.setScalar(s); oldG.rotation.y += 0.04; if (s <= 0) { scene.remove(oldG); oldG.traverse(ch => { if (ch.geometry) ch.geometry.dispose(); if (ch.material) ch.material.dispose(); }); } }
        const sIn = Math.min(1, Math.max(0, (t - 0.2) * 2)); glasses.scale.setScalar(1 - Math.pow(1 - sIn, 3));
        if (t >= 1) { clearInterval(swap); setTransitioning(false); glasses.scale.setScalar(1); }
      }, 16);
    } else {
      if (oldG) { scene.remove(oldG); oldG.traverse(ch => { if (ch.geometry) ch.geometry.dispose(); if (ch.material) ch.material.dispose(); }); }
    }
  }, []);

  /* ── exploded view ── */
  useEffect(() => {
    const glasses = sceneRef.current.glasses;
    const camera = sceneRef.current.camera;
    const state = sceneRef.current.state;
    if (!glasses || !camera) return;
    const targetZoom = exploded ? 4.2 : 2.8;

    let t = 0;
    const id = setInterval(() => {
      t += 0.04;
      if (t > 1) { clearInterval(id); t = 1; }
      const ease = 1 - Math.pow(1 - t, 3);
      const progress = exploded ? ease : 1 - ease;

      /* zoom camera */
      if (state) {
        const currentTarget = exploded ? targetZoom : 2.8;
        const currentFrom = exploded ? 2.8 : 4.2;
        camera.position.z = lerp(currentFrom, currentTarget, ease);
      }

      /* move parts */
      glasses.children.forEach(child => {
        const name = child.userData.partName;
        if (!child._origPos) child._origPos = child.position.clone();
        const orig = child._origPos;
        const dir = EXPLODE_DIR[name] || new THREE.Vector3(0, 0, 0);
        child.position.lerpVectors(orig, orig.clone().add(dir.clone().multiplyScalar(0.6)), progress);
      });
    }, 16);
    return () => clearInterval(id);
  }, [exploded]);

  /* ── project 3D label positions to 2D ── */
  useEffect(() => {
    if (!exploded) { setLabelPositions([]); return; }
    const update = () => {
      const { glasses, camera } = sceneRef.current;
      const mount = mountRef.current;
      if (!glasses || !camera || !mount) return;
      const rect = mount.getBoundingClientRect();
      const labels = [];
      const activeParts = FRAMES[frameIdx].labelParts;

      glasses.children.forEach(child => {
        const name = child.userData.partName;
        if (!name || !activeParts.includes(name)) return;
        const info = PART_INFO[name];
        if (!info) return;

        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);
        const ndc = worldPos.clone().project(camera);
        const sx = (ndc.x * 0.5 + 0.5) * rect.width;
        const sy = (-ndc.y * 0.5 + 0.5) * rect.height;

        if (ndc.z > 0 && ndc.z < 1) {
          labels.push({ name, x: sx, y: sy, label: info.label, detail: info.detail });
        }
      });
      setLabelPositions(labels);
    };

    const id = setInterval(update, 50);
    return () => clearInterval(id);
  }, [exploded, frameIdx]);

  /* ── Three.js init ── */
  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const W = mount.clientWidth, H = mount.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(W, H);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0.15, 4.5);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(3, 4, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);
    scene.add(new THREE.DirectionalLight(0x8888ff, 0.5).translateX(-4).translateY(2).translateZ(3));
    scene.add(new THREE.DirectionalLight(0xffffff, 0.9).translateY(3).translateZ(-4));
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.12 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.55; ground.receiveShadow = true; scene.add(ground);

    const state = { isDragging: false, prevX: 0, prevY: 0, velX: 0, velY: 0, targetRotX: deg(8), targetRotY: deg(-25), mouseNX: 0, mouseNY: 0, introT: 0 };
    sceneRef.current = { renderer, scene, camera, state, mount };
    buildGlasses(0, 0, false);
    setTimeout(() => { setLoaded(true); setIntroPlayed(true); }, 100);

    const canvas = renderer.domElement;
    const onDown = e => { state.isDragging = true; state.prevX = e.clientX; state.prevY = e.clientY; };
    const onMove = e => {
      const rect = mount.getBoundingClientRect();
      state.mouseNX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      state.mouseNY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      if (!state.isDragging) return;
      const dx = e.clientX - state.prevX, dy = e.clientY - state.prevY;
      state.prevX = e.clientX; state.prevY = e.clientY;
      state.velX = dx * 0.006; state.velY = dy * 0.006;
      state.targetRotY += dx * 0.006; state.targetRotX += dy * 0.006;
    };
    const onUp = () => { state.isDragging = false; };
    const onWheel = e => { e.preventDefault(); camera.position.z = Math.max(1.5, Math.min(6, camera.position.z + e.deltaY * 0.003)); };
    canvas.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp); canvas.addEventListener("wheel", onWheel, { passive: false });

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const glasses = sceneRef.current.glasses; if (!glasses) return;
      if (state.introT < 1) { state.introT += 0.012; camera.position.z = lerp(4.5, 2.8, 1 - Math.pow(1 - Math.min(state.introT, 1), 4)); }
      if (!state.isDragging) { state.velX *= 0.92; state.velY *= 0.92; state.targetRotY += state.velX; state.targetRotX += state.velY; }
      state.targetRotY += 0.003;
      glasses.rotation.y = lerp(glasses.rotation.y, state.targetRotY, 0.12);
      glasses.rotation.x = lerp(glasses.rotation.x, state.targetRotX, 0.12);
      camera.position.x = lerp(camera.position.x, state.mouseNX * 0.1, 0.05);
      camera.position.y = lerp(camera.position.y, 0.15 - state.mouseNY * 0.06, 0.05);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => { const w = mount.clientWidth, h = mount.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf); canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel); window.removeEventListener("resize", onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement); renderer.dispose();
    };
  }, [buildGlasses]);

  /* ── colour / frame swap ── */
  const prevFrameRef = useRef(0);
  const prevColorRef = useRef(0);
  const updateColors = useCallback((cIdx) => {
    const glasses = sceneRef.current.glasses; if (!glasses) return;
    const c = FRAMES[frameIdx].colors[cIdx];
    glasses.traverse(child => {
      if (!child.isMesh) return;
      if (child.material.transmission > 0.3 || (child.material.transparent && child.material.opacity < 0.8)) child.material.color.setHex(c.lens);
      else if (child.material.metalness > 0.8) child.material.color.setHex(c.accent);
      else child.material.color.setHex(c.frame);
    });
  }, [frameIdx]);

  useEffect(() => {
    if (!sceneRef.current.scene || !introPlayed) return;
    if (frameIdx !== prevFrameRef.current) {
      if (!transitioning) { setTransitioning(true); setExploded(false); buildGlasses(frameIdx, colorIdx, true); }
    } else if (colorIdx !== prevColorRef.current) { updateColors(colorIdx); }
    prevFrameRef.current = frameIdx; prevColorRef.current = colorIdx;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameIdx, colorIdx]);

  /* ── inject CSS ── */
  useEffect(() => {
    const id = "gv-styles"; if (document.getElementById(id)) return;
    const s = document.createElement("style"); s.id = id;
    s.textContent = `
      @keyframes gvFadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
      @keyframes gvFadeIn { from { opacity:0 } to { opacity:1 } }
      @keyframes gvSlideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
      @keyframes gvShine { 0% { left:-100% } 100% { left:200% } }
      @keyframes gvLabelIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      .gv-nav-links { display: flex; gap: 32px; }
      .gv-hamburger { display: none !important; }
      .gv-main { flex-direction: row !important; }
      .gv-cta { position:relative; overflow:hidden; }
      .gv-cta::after { content:''; position:absolute; top:0; left:-100%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); animation: gvShine 3s ease-in-out infinite; }
      .gv-cta:hover { background: #fff !important; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(255,255,255,0.2); }
      .gv-frame-card { transition: all 0.35s cubic-bezier(0.23,1,0.32,1) !important; }
      .gv-frame-card:hover { border-color: rgba(255,255,255,0.3) !important; transform: translateY(-2px); background: rgba(255,255,255,0.06) !important; }
      .gv-swatch { transition: all 0.35s cubic-bezier(0.23,1,0.32,1) !important; }
      .gv-swatch:hover { transform: scale(1.3) !important; }
      .gv-explode { transition: all 0.3s !important; }
      .gv-explode:hover { background: rgba(255,255,255,0.12) !important; }
      .gv-nav-link { transition: all 0.3s !important; }
      .gv-nav-link:hover { opacity: 1 !important; }
      .gv-label-line { stroke-dasharray: 200; stroke-dashoffset: 200; animation: gvDrawLine 0.6s ease forwards; }
      @keyframes gvDrawLine { to { stroke-dashoffset: 0 } }
      @media (max-width: 840px) {
        .gv-nav-links { display: none !important; }
        .gv-hamburger { display: flex !important; }
        .gv-main { flex-direction: column !important; }
      }
    `;
    document.head.appendChild(s);
  }, []);

  const bg = color.bg;

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: `linear-gradient(135deg, ${bg[0]} 0%, ${bg[1]} 50%, ${bg[2]} 100%)`, display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif", color: "#fff", transition: "background 1s cubic-bezier(0.4,0,0.2,1)", overflowX: "hidden", position: "relative" }}>

      <canvas ref={particleCanvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }} />

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(24px) saturate(1.8)", borderBottom: "1px solid rgba(255,255,255,0.06)", animation: introPlayed ? "gvFadeIn 0.8s ease both" : "none" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24, opacity: 0.9 }}>◈</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, letterSpacing: 4 }}>OPTIQ</span>
          </div>
          <div className="gv-nav-links">
            {["Sunglasses", "Optical", "Everyday", "Statement"].map(cat => (
              <button key={cat} className="gv-nav-link" onClick={() => { const idx = FRAMES.findIndex(f => f.category === cat); if (idx >= 0) { setFrameIdx(idx); setColorIdx(0); } }}
                style={{ background: "none", border: "none", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", padding: "4px 0", opacity: frame.category === cat ? 1 : 0.4, borderBottom: frame.category === cat ? "1px solid rgba(255,255,255,0.6)" : "1px solid transparent" }}>
                {cat}
              </button>
            ))}
          </div>
          <button className="gv-hamburger" onClick={() => setMenuOpen(!menuOpen)} style={{ flexDirection: "column", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 8 }}>
            {[0,1,2].map(i => <span key={i} style={{ width: 22, height: 1.5, background: "#fff", borderRadius: 2, transition: "all 0.3s", display: "block", ...(i === 0 && menuOpen ? { transform: "rotate(45deg) translate(4px,4px)" } : i === 1 && menuOpen ? { opacity: 0 } : i === 2 && menuOpen ? { transform: "rotate(-45deg) translate(4px,-4px)" } : {}) }} />)}
          </button>
        </div>
        {menuOpen && (
          <div style={{ display: "flex", flexDirection: "column", padding: "8px 24px 16px", gap: 4, borderTop: "1px solid rgba(255,255,255,0.06)", animation: "gvFadeUp 0.3s ease both" }}>
            {["Sunglasses", "Optical", "Everyday", "Statement"].map(cat => (
              <button key={cat} onClick={() => { const idx = FRAMES.findIndex(f => f.category === cat); if (idx >= 0) { setFrameIdx(idx); setColorIdx(0); } setMenuOpen(false); }}
                style={{ background: "none", border: "none", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "10px 0", textAlign: "left", cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", opacity: 0.7 }}>
                {cat}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* MAIN */}
      <div className="gv-main" style={{ flex: 1, maxWidth: 1200, width: "100%", margin: "0 auto", padding: "32px 24px", display: "flex", gap: 48, alignItems: "flex-start", flexWrap: "wrap", position: "relative", zIndex: 2, boxSizing: "border-box" }}>

        {/* 3D viewport + labels */}
        <div style={{ flex: "1 1 480px", minWidth: 320, position: "relative" }}>
          <div style={{ position: "relative" }}>
            <div ref={mountRef} style={{ width: "100%", aspectRatio: "4 / 3", borderRadius: 20, overflow: "hidden", cursor: "grab", opacity: loaded ? 1 : 0, transition: "opacity 1.2s cubic-bezier(0.4,0,0.2,1)", boxShadow: "0 0 80px rgba(0,0,0,0.3)" }} />

            {/* LABEL OVERLAY — Apple keynote style */}
            {exploded && labelPositions.length > 0 && (
              <svg ref={labelsRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}>
                {labelPositions.map((lp, i) => {
                  /* offset label position outward from center */
                  const cx = mountRef.current?.clientWidth / 2 || 300;
                  const cy = mountRef.current?.clientHeight / 2 || 225;
                  const dx = lp.x - cx;
                  const dy = lp.y - cy;
                  const angle = Math.atan2(dy, dx);
                  const labelDist = 100;
                  const lx = lp.x + Math.cos(angle) * labelDist;
                  const ly = lp.y + Math.sin(angle) * labelDist;
                  const textAnchor = lx > cx ? "start" : "end";

                  return (
                    <g key={lp.name} style={{ animation: `gvLabelIn 0.5s ease ${0.1 * i}s both` }}>
                      {/* leader line */}
                      <line className="gv-label-line" x1={lp.x} y1={lp.y} x2={lx} y2={ly}
                        stroke="rgba(255,255,255,0.4)" strokeWidth="1" style={{ animationDelay: `${0.1 * i}s` }} />
                      {/* dot at part */}
                      <circle cx={lp.x} cy={lp.y} r="3" fill="rgba(255,255,255,0.9)" style={{ animation: `gvLabelIn 0.4s ease ${0.1 * i}s both` }} />
                      {/* label text */}
                      <text x={lx + (textAnchor === "start" ? 10 : -10)} y={ly - 6} fill="white" fontSize="12" fontWeight="600" fontFamily="DM Sans" textAnchor={textAnchor} letterSpacing="1" style={{ textTransform: "uppercase" }}>
                        {lp.label}
                      </text>
                      <text x={lx + (textAnchor === "start" ? 10 : -10)} y={ly + 10} fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="DM Sans" textAnchor={textAnchor} letterSpacing="0.5">
                        {lp.detail}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* viewport controls */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, animation: introPlayed ? "gvFadeUp 0.6s ease 0.8s both" : "none" }}>
            <button className="gv-explode" onClick={() => setExploded(!exploded)} style={{
              background: exploded ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
            }}>
              {exploded ? "◇ Assemble" : "◈ Explode View"}
            </button>
            <button className="gv-explode" onClick={() => {
              setExploded(false);
              if (sceneRef.current.state) { sceneRef.current.state.targetRotX = deg(8); sceneRef.current.state.targetRotY = deg(-25); sceneRef.current.camera.position.z = 2.8; }
            }} style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
            }}>
              ↺ Reset
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: 11, opacity: 0.25, marginTop: 10, letterSpacing: 1, animation: introPlayed ? "gvFadeIn 1s ease 1s both" : "none" }}>
            Drag to rotate · Scroll to zoom
          </p>
        </div>

        {/* Product panel */}
        <div style={{ flex: "1 1 320px", minWidth: 0, maxWidth: "100%", display: "flex", flexDirection: "column", paddingTop: 8 }}>
          <p key={frame.id + "-tag"} style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 13, opacity: 0.4, margin: "0 0 8px", letterSpacing: 1, animation: "gvFadeUp 0.5s ease both" }}>{frame.tagline}</p>
          <span key={frame.id + "-cat"} style={{ display: "inline-block", width: "fit-content", padding: "4px 14px", borderRadius: 20, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, opacity: 0.6, animation: "gvFadeUp 0.5s ease 0.1s both" }}>{frame.category}</span>
          <h1 key={frame.id + "-t"} style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 500, margin: 0, lineHeight: 1.1, letterSpacing: 0.5, animation: "gvFadeUp 0.5s ease 0.15s both" }}>{frame.name}</h1>
          <p key={frame.id + "-p"} style={{ fontSize: 24, fontWeight: 300, margin: "14px 0 16px", opacity: 0.65, letterSpacing: 1, animation: "gvFadeUp 0.5s ease 0.2s both" }}>${frame.price}.00</p>
          <p key={frame.id + "-d"} style={{ fontSize: 14, lineHeight: 1.75, opacity: 0.45, margin: "0 0 28px", maxWidth: 420, animation: "gvFadeUp 0.5s ease 0.25s both" }}>{frame.description}</p>

          <div style={{ display: "flex", gap: 24, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", animation: "gvFadeUp 0.5s ease 0.3s both" }}>
            {["frames", "dimensions"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{ background: "none", border: "none", borderBottom: activeTab === t ? "2px solid #fff" : "2px solid transparent", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: 1, cursor: "pointer", padding: "8px 0", transition: "all 0.3s", textTransform: "uppercase", opacity: activeTab === t ? 1 : 0.35 }}>{t === "frames" ? "Frame Styles" : "Dimensions"}</button>
            ))}
          </div>

          <div key={activeTab} style={{ animation: "gvFadeUp 0.4s ease both" }}>
            {activeTab === "frames" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                {FRAMES.map((f, i) => (
                  <button key={f.id} className="gv-frame-card" onClick={() => { if (i !== frameIdx) { setFrameIdx(i); setColorIdx(0); } }}
                    style={{ padding: "14px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 4, border: `1px solid ${frameIdx === i ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.06)"}`, background: frameIdx === i ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)", animation: `gvSlideIn 0.4s ease ${0.05 * i}s both` }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>{f.name}</span>
                    <span style={{ fontSize: 11, opacity: 0.35, letterSpacing: 0.5 }}>{f.category} · ${f.price}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                {Object.entries(frame.dimensions).map(([key, val], i) => (
                  <div key={key} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 6, animation: `gvSlideIn 0.4s ease ${0.05 * i}s both` }}>
                    <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, opacity: 0.35, fontWeight: 600 }}>{key}</span>
                    <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: 0.5, fontFamily: "'Playfair Display', serif" }}>{val}</span>
                  </div>
                ))}
                <div style={{ gridColumn: "1 / -1", padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", animation: "gvFadeUp 0.5s ease 0.2s both" }}>
                  <svg viewBox="0 0 260 90" style={{ width: "100%", height: "auto", opacity: 0.4 }}>
                    <ellipse cx="70" cy="42" rx="42" ry="28" fill="none" stroke="#fff" strokeWidth="1.5" />
                    <ellipse cx="190" cy="42" rx="42" ry="28" fill="none" stroke="#fff" strokeWidth="1.5" />
                    <path d="M112 36 Q130 26 148 36" fill="none" stroke="#fff" strokeWidth="1.5" />
                    <line x1="28" y1="78" x2="112" y2="78" stroke="#fff" strokeWidth="0.8" />
                    <text x="70" y="86" fill="#fff" fontSize="7" textAnchor="middle" fontFamily="DM Sans">{frame.dimensions.lens}</text>
                    <line x1="112" y1="24" x2="148" y2="24" stroke="#fff" strokeWidth="0.8" />
                    <text x="130" y="20" fill="#fff" fontSize="7" textAnchor="middle" fontFamily="DM Sans">{frame.dimensions.bridge}</text>
                    <text x="130" y="88" fill="#fff" fontSize="6" textAnchor="middle" fontFamily="DM Sans" opacity="0.5">temple: {frame.dimensions.temple}</text>
                  </svg>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 28, animation: "gvFadeUp 0.5s ease 0.4s both" }}>
            <span style={{ fontSize: 11, letterSpacing: 1.5, opacity: 0.4, textTransform: "uppercase", display: "block", marginBottom: 14, fontWeight: 500 }}>Colour — <span style={{ opacity: 0.8 }}>{color.name}</span></span>
            <div style={{ display: "flex", gap: 14 }}>
              {frame.colors.map((c, i) => (
                <button key={i} className="gv-swatch" onClick={() => setColorIdx(i)} title={c.name} style={{ width: 34, height: 34, borderRadius: "50%", cursor: "pointer", background: hex(c.frame), border: colorIdx === i ? "2px solid #fff" : "2px solid rgba(255,255,255,0.1)", transform: colorIdx === i ? "scale(1.2)" : "scale(1)", boxShadow: colorIdx === i ? `0 0 20px ${hex(c.frame)}44` : "none" }} />
              ))}
            </div>
          </div>

          <button className="gv-cta" style={{ width: "100%", padding: "18px 0", background: "rgba(255,255,255,0.92)", color: "#000", border: "none", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", transition: "all 0.4s cubic-bezier(0.23,1,0.32,1)", animation: "gvFadeUp 0.6s ease 0.5s both" }}>
            Add to Cart — ${frame.price}.00
          </button>
        </div>
      </div>

      <footer style={{ padding: 24, textAlign: "center", fontSize: 10, letterSpacing: 3, opacity: 0.2, textTransform: "uppercase", display: "flex", gap: 16, justifyContent: "center", borderTop: "1px solid rgba(255,255,255,0.03)", marginTop: "auto", position: "relative", zIndex: 2 }}>
        <span>OPTIQ © 2026</span><span>·</span><span>Three.js + React</span>
      </footer>
    </div>
  );
}