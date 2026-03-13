import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

/* ── helpers ─────────────────────────────────────────────── */
const lerp = (a, b, t) => a + (b - a) * t;
const deg = (d) => (d * Math.PI) / 180;

/* ── Google Fonts loader ─────────────────────────────────── */
if (typeof document !== "undefined") {
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap";
  document.head.appendChild(fontLink);
}

/* ═══════════════════════════════════════════════════════════
   FRAME DATA
   ═══════════════════════════════════════════════════════════ */
const FRAMES = [
  {
    id: "aviator",
    name: "Aviator Classic",
    category: "Sunglasses",
    price: 189,
    dimensions: { lens: "58mm", bridge: "14mm", temple: "140mm", height: "50mm" },
    description: "Timeless teardrop silhouette with double bridge. Lightweight titanium frame with anti-scratch coating.",
    colors: [
      { name: "Gunmetal",  frame: 0x4a4a4a, lens: 0x556b2f, accent: 0x888888, bg: ["#0f1114","#1a1d23","#12141a"] },
      { name: "Gold",      frame: 0xc8a84e, lens: 0x5a4a2a, accent: 0xd4af37, bg: ["#1a1508","#2a2010","#1e1a0c"] },
      { name: "Rose Gold", frame: 0xb76e79, lens: 0x6b4a52, accent: 0xd4a0a0, bg: ["#1a1015","#2a1520","#1e1018"] },
    ],
    build: buildAviator,
  },
  {
    id: "wayfarer",
    name: "Wayfarer Bold",
    category: "Everyday",
    price: 159,
    dimensions: { lens: "54mm", bridge: "18mm", temple: "145mm", height: "42mm" },
    description: "Bold acetate frame with a slightly oversized fit. UV400 protection with polarised lenses available.",
    colors: [
      { name: "Matte Black", frame: 0x1a1a1a, lens: 0x333344, accent: 0x444444, bg: ["#08080a","#141418","#0c0c10"] },
      { name: "Tortoise",    frame: 0x8b5e3c, lens: 0x5a4530, accent: 0xa0724a, bg: ["#1a1008","#2a1d10","#1e140c"] },
      { name: "Navy",        frame: 0x1a2744, lens: 0x334466, accent: 0x3a5580, bg: ["#080c14","#101828","#0c1420"] },
    ],
    build: buildWayfarer,
  },
  {
    id: "round",
    name: "Round Wire",
    category: "Optical",
    price: 219,
    dimensions: { lens: "49mm", bridge: "20mm", temple: "135mm", height: "49mm" },
    description: "Minimalist round frame in surgical-grade stainless steel. Adjustable nose pads for all-day comfort.",
    colors: [
      { name: "Silver", frame: 0xc0c0c0, lens: 0x99bbdd, accent: 0xe0e0e0, bg: ["#0e1018","#181c28","#121620"] },
      { name: "Black",  frame: 0x222222, lens: 0x445566, accent: 0x555555, bg: ["#0a0a0c","#141416","#0e0e12"] },
      { name: "Copper", frame: 0xb87333, lens: 0x88775a, accent: 0xcc8844, bg: ["#1a1208","#2a1e10","#1e160c"] },
    ],
    build: buildRound,
  },
  {
    id: "cat-eye",
    name: "Cat-Eye Luxe",
    category: "Statement",
    price: 249,
    dimensions: { lens: "55mm", bridge: "16mm", temple: "138mm", height: "46mm" },
    description: "Dramatic upswept corners with hand-polished acetate. A bold silhouette for those who lead, not follow.",
    colors: [
      { name: "Burgundy", frame: 0x6b2040, lens: 0x553344, accent: 0x8a3050, bg: ["#14080e","#221018","#1a0c14"] },
      { name: "Ivory",    frame: 0xd4c8b0, lens: 0x998877, accent: 0xe8dcc0, bg: ["#18160e","#28241a","#201c14"] },
      { name: "Emerald",  frame: 0x1a5c3a, lens: 0x2a4a3a, accent: 0x2a7a50, bg: ["#081410","#102a1c","#0c2018"] },
    ],
    build: buildCatEye,
  },
];

/* ═══════════════════════════════════════════════════════════
   GEOMETRY BUILDERS
   ═══════════════════════════════════════════════════════════ */
function makeMaterials(color) {
  return {
    frame: new THREE.MeshPhysicalMaterial({
      color: color.frame, metalness: 0.6, roughness: 0.28,
      clearcoat: 1, clearcoatRoughness: 0.1,
    }),
    lens: new THREE.MeshPhysicalMaterial({
      color: color.lens, metalness: 0, roughness: 0.05,
      transmission: 0.8, thickness: 0.3, ior: 1.5, transparent: true, opacity: 0.45,
    }),
    hinge: new THREE.MeshPhysicalMaterial({
      color: color.accent, metalness: 0.9, roughness: 0.12, clearcoat: 0.5,
    }),
  };
}

function addTemples(group, mat, xPositions, yStart = 0) {
  xPositions.forEach(({ x, sign }) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, yStart, 0),
      new THREE.Vector3(x + sign * 0.04, yStart, -0.3),
      new THREE.Vector3(x + sign * 0.04, yStart - 0.04, -0.9),
      new THREE.Vector3(x + sign * 0.02, yStart - 0.14, -1.05),
    ]);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.02, 8, false), mat);
    mesh.castShadow = true;
    group.add(mesh);
  });
}

function addHinges(group, mat, positions) {
  const geo = new THREE.CylinderGeometry(0.028, 0.028, 0.055, 12);
  positions.forEach(([x, y]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, -0.01);
    m.rotation.z = Math.PI / 2;
    m.castShadow = true;
    group.add(m);
  });
}

function addNosePads(group, mat, positions) {
  const geo = new THREE.SphereGeometry(0.025, 12, 12);
  positions.forEach(([x, y, z]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.scale.set(1, 1.3, 0.6);
    group.add(m);
  });
}

function buildAviator(color) {
  const g = new THREE.Group();
  const m = makeMaterials(color);
  const lensShape = new THREE.Shape();
  lensShape.moveTo(0, 0.38);
  lensShape.quadraticCurveTo(0.42, 0.38, 0.44, 0);
  lensShape.quadraticCurveTo(0.42, -0.42, 0, -0.44);
  lensShape.quadraticCurveTo(-0.42, -0.42, -0.44, 0);
  lensShape.quadraticCurveTo(-0.42, 0.38, 0, 0.38);
  const pts = lensShape.getPoints(64);
  const rimGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, p.y, 0)), true), 64, 0.03, 8, true);
  const discGeo = new THREE.ShapeGeometry(lensShape, 64);
  [-0.54, 0.54].forEach(x => {
    const rim = new THREE.Mesh(rimGeo, m.frame); rim.position.x = x; rim.castShadow = true; g.add(rim);
    const disc = new THREE.Mesh(discGeo, m.lens); disc.position.set(x, 0, 0.005); g.add(disc);
  });
  [0.08, -0.02].forEach(y => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.12, y, 0), new THREE.Vector3(0, y + 0.04, 0.02), new THREE.Vector3(0.12, y, 0)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 16, 0.018, 8, false), m.frame));
  });
  addTemples(g, m.frame, [{ x: -0.96, sign: -1 }, { x: 0.96, sign: 1 }]);
  addHinges(g, m.hinge, [[-0.96, 0], [0.96, 0]]);
  addNosePads(g, m.hinge, [[-0.16, -0.28, 0.08], [0.16, -0.28, 0.08]]);
  return g;
}

function buildWayfarer(color) {
  const g = new THREE.Group();
  const m = makeMaterials(color);
  m.frame.metalness = 0.1; m.frame.roughness = 0.45; m.frame.clearcoat = 0.6;
  const lensShape = new THREE.Shape();
  lensShape.moveTo(-0.38, 0.24); lensShape.lineTo(0.4, 0.28);
  lensShape.quadraticCurveTo(0.44, 0, 0.38, -0.24); lensShape.lineTo(-0.36, -0.22);
  lensShape.quadraticCurveTo(-0.42, 0, -0.38, 0.24);
  const pts = lensShape.getPoints(64);
  const rimGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, p.y, 0)), true), 64, 0.04, 8, true);
  const discGeo = new THREE.ShapeGeometry(lensShape, 64);
  const topBar = new THREE.Shape();
  topBar.moveTo(-1.02, 0.22); topBar.lineTo(1.02, 0.22); topBar.lineTo(1.02, 0.36);
  topBar.quadraticCurveTo(0, 0.40, -1.02, 0.36); topBar.lineTo(-1.02, 0.22);
  const topGeo = new THREE.ExtrudeGeometry(topBar, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3 });
  const top = new THREE.Mesh(topGeo, m.frame); top.position.z = -0.03; top.castShadow = true; g.add(top);
  [-0.52, 0.52].forEach(x => {
    const rim = new THREE.Mesh(rimGeo, m.frame); rim.position.x = x; rim.castShadow = true; g.add(rim);
    const disc = new THREE.Mesh(discGeo, m.lens); disc.position.set(x, 0, 0.005); g.add(disc);
  });
  const bc = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.14, 0.04, 0), new THREE.Vector3(0, 0.10, 0.02), new THREE.Vector3(0.14, 0.04, 0)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(bc, 16, 0.028, 8, false), m.frame));
  addTemples(g, m.frame, [{ x: -0.94, sign: -1 }, { x: 0.94, sign: 1 }]);
  addHinges(g, m.hinge, [[-0.94, 0.05], [0.94, 0.05]]);
  addNosePads(g, m.hinge, [[-0.16, -0.18, 0.08], [0.16, -0.18, 0.08]]);
  return g;
}

function buildRound(color) {
  const g = new THREE.Group();
  const m = makeMaterials(color);
  const rimGeo = new THREE.TorusGeometry(0.38, 0.022, 16, 64);
  const discGeo = new THREE.CircleGeometry(0.38, 64);
  [-0.48, 0.48].forEach(x => {
    const rim = new THREE.Mesh(rimGeo, m.frame); rim.position.x = x; rim.castShadow = true; g.add(rim);
    const disc = new THREE.Mesh(discGeo, m.lens); disc.position.set(x, 0, 0.005); g.add(disc);
  });
  const bc = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.10, 0.06, 0), new THREE.Vector3(-0.04, 0.14, 0.03),
    new THREE.Vector3(0.04, 0.14, 0.03), new THREE.Vector3(0.10, 0.06, 0)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(bc, 20, 0.018, 8, false), m.frame));
  addTemples(g, m.frame, [{ x: -0.86, sign: -1 }, { x: 0.86, sign: 1 }]);
  addHinges(g, m.hinge, [[-0.86, 0], [0.86, 0]]);
  addNosePads(g, m.hinge, [[-0.14, -0.22, 0.08], [0.14, -0.22, 0.08]]);
  return g;
}

function buildCatEye(color) {
  const g = new THREE.Group();
  const m = makeMaterials(color);
  m.frame.metalness = 0.15; m.frame.roughness = 0.4; m.frame.clearcoat = 0.8;
  const lensShape = new THREE.Shape();
  lensShape.moveTo(-0.36, 0.18);
  lensShape.quadraticCurveTo(-0.10, 0.30, 0.20, 0.34);
  lensShape.quadraticCurveTo(0.46, 0.30, 0.44, 0.08);
  lensShape.quadraticCurveTo(0.42, -0.22, 0.10, -0.26);
  lensShape.quadraticCurveTo(-0.24, -0.26, -0.38, -0.10);
  lensShape.quadraticCurveTo(-0.42, 0.04, -0.36, 0.18);
  const pts = lensShape.getPoints(64);
  const rimGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, p.y, 0)), true), 64, 0.035, 8, true);
  const discGeo = new THREE.ShapeGeometry(lensShape, 64);
  [-0.52, 0.52].forEach((x, i) => {
    const rim = new THREE.Mesh(rimGeo, m.frame); rim.position.x = x; if (i === 0) rim.scale.x = -1; rim.castShadow = true; g.add(rim);
    const disc = new THREE.Mesh(discGeo, m.lens); disc.position.set(x, 0, 0.005); if (i === 0) disc.scale.x = -1; g.add(disc);
  });
  const bc = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.14, 0.10, 0), new THREE.Vector3(0, 0.16, 0.02), new THREE.Vector3(0.14, 0.10, 0)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(bc, 16, 0.025, 8, false), m.frame));
  addTemples(g, m.frame, [{ x: -0.92, sign: -1 }, { x: 0.92, sign: 1 }], 0.12);
  addHinges(g, m.hinge, [[-0.92, 0.12], [0.92, 0.12]]);
  addNosePads(g, m.hinge, [[-0.16, -0.16, 0.08], [0.16, -0.16, 0.08]]);
  return g;
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function GlassesViewer() {
  const mountRef = useRef(null);
  const sceneRef = useRef({});
  const [frameIdx, setFrameIdx] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("frames");
  const [hoveredFrame, setHoveredFrame] = useState(null);

  const frame = FRAMES[frameIdx];
  const color = frame.colors[colorIdx];

  const buildGlasses = useCallback((fIdx, cIdx) => {
    const { scene, state } = sceneRef.current;
    if (!scene) return;
    if (sceneRef.current.glasses) {
      scene.remove(sceneRef.current.glasses);
      sceneRef.current.glasses.traverse(c => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
    }
    const f = FRAMES[fIdx];
    const c = f.colors[cIdx];
    const glasses = f.build(c);
    glasses.rotation.set(deg(8), deg(-25), 0);
    scene.add(glasses);
    sceneRef.current.glasses = glasses;
    if (state) { state.targetRotX = deg(8); state.targetRotY = deg(-25); }
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth, H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0.15, 2.8);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(3, 4, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8888ff, 0.5); fill.position.set(-4, 2, 3); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.9); rim.position.set(0, 3, -4); scene.add(rim);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.12 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.55; ground.receiveShadow = true;
    scene.add(ground);

    const state = {
      isDragging: false, prevX: 0, prevY: 0, velX: 0, velY: 0,
      targetRotX: deg(8), targetRotY: deg(-25), mouseNX: 0, mouseNY: 0,
    };

    sceneRef.current = { renderer, scene, camera, state, mount };
    buildGlasses(0, 0);
    setLoaded(true);

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
    const onWheel = e => { e.preventDefault(); camera.position.z = Math.max(1.5, Math.min(5, camera.position.z + e.deltaY * 0.003)); };

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const glasses = sceneRef.current.glasses;
      if (!glasses) return;
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

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [buildGlasses]);

  useEffect(() => {
    if (sceneRef.current.scene) buildGlasses(frameIdx, colorIdx);
  }, [frameIdx, colorIdx, buildGlasses]);

  const bg = color.bg;

  /* ═══ inline CSS for responsive media queries ═══ */
  useEffect(() => {
    const id = "glasses-viewer-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .gv-nav-links { display: flex; gap: 32px; }
      .gv-hamburger { display: none !important; }
      .gv-main { flex-direction: row !important; }
      .gv-cta:hover { background: #fff !important; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(255,255,255,0.15); }
      .gv-frame-card:hover { border-color: rgba(255,255,255,0.25) !important; }
      @media (max-width: 840px) {
        .gv-nav-links { display: none !important; }
        .gv-hamburger { display: flex !important; }
        .gv-main { flex-direction: column !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div style={{
      width: "100%", minHeight: "100vh",
      background: `linear-gradient(135deg, ${bg[0]} 0%, ${bg[1]} 50%, ${bg[2]} 100%)`,
      display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif", color: "#fff",
      transition: "background 0.8s ease", overflowX: "hidden",
    }}>

      {/* ═══ NAV ═══ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22, opacity: 0.9 }}>◈</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, letterSpacing: 3 }}>OPTIQ</span>
          </div>

          <div className="gv-nav-links">
            {["Sunglasses", "Optical", "Everyday", "Statement"].map(cat => (
              <button key={cat} onClick={() => {
                const idx = FRAMES.findIndex(f => f.category === cat);
                if (idx >= 0) { setFrameIdx(idx); setColorIdx(0); }
              }} style={{
                background: "none", border: "none", color: "#fff",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 400,
                letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", padding: "4px 0",
                transition: "all 0.3s",
                opacity: frame.category === cat ? 1 : 0.5,
                borderBottom: frame.category === cat ? "1px solid rgba(255,255,255,0.6)" : "1px solid transparent",
              }}>{cat}</button>
            ))}
          </div>

          <button className="gv-hamburger" onClick={() => setMenuOpen(!menuOpen)} style={{
            flexDirection: "column", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 8,
          }}>
            <span style={{ width: 22, height: 1.5, background: "#fff", borderRadius: 2, transition: "all 0.3s", display: "block", transform: menuOpen ? "rotate(45deg) translate(4px,4px)" : "none" }} />
            <span style={{ width: 22, height: 1.5, background: "#fff", borderRadius: 2, transition: "all 0.3s", display: "block", opacity: menuOpen ? 0 : 1 }} />
            <span style={{ width: 22, height: 1.5, background: "#fff", borderRadius: 2, transition: "all 0.3s", display: "block", transform: menuOpen ? "rotate(-45deg) translate(4px,-4px)" : "none" }} />
          </button>
        </div>

        {menuOpen && (
          <div style={{ display: "flex", flexDirection: "column", padding: "8px 24px 16px", gap: 4, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {["Sunglasses", "Optical", "Everyday", "Statement"].map(cat => (
              <button key={cat} onClick={() => {
                const idx = FRAMES.findIndex(f => f.category === cat);
                if (idx >= 0) { setFrameIdx(idx); setColorIdx(0); }
                setMenuOpen(false);
              }} style={{
                background: "none", border: "none", color: "#fff",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "10px 0",
                textAlign: "left", cursor: "pointer", letterSpacing: 1,
                textTransform: "uppercase", opacity: 0.7,
              }}>{cat}</button>
            ))}
          </div>
        )}
      </nav>

      {/* ═══ MAIN ═══ */}
      <div className="gv-main" style={{
        flex: 1, maxWidth: 1200, width: "100%", margin: "0 auto",
        padding: "32px 24px", display: "flex", gap: 48, alignItems: "flex-start", flexWrap: "wrap", boxSizing: "border-box", overflow: "hidden",
      }}>

        {/* 3D viewport */}
        <div style={{ flex: "1 1 480px", minWidth: 320, position: "relative" }}>
          <div ref={mountRef} style={{
            width: "100%", aspectRatio: "4 / 3", borderRadius: 16, overflow: "hidden",
            cursor: "grab", transition: "opacity 0.8s ease", opacity: loaded ? 1 : 0,
          }} />
          <p style={{ textAlign: "center", fontSize: 12, opacity: 0.3, marginTop: 12, letterSpacing: 0.5 }}>
            Drag to rotate · Scroll to zoom
          </p>
        </div>

        {/* Product panel */}
        <div style={{ flex: "1 1 320px", minWidth: 0, maxWidth: "100%", display: "flex", flexDirection: "column", paddingTop: 8 }}>

          <span style={{
            display: "inline-block", width: "fit-content", padding: "4px 14px", borderRadius: 20,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, opacity: 0.7,
          }}>{frame.category}</span>

          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 500,
            margin: 0, lineHeight: 1.15, letterSpacing: 0.5,
          }}>{frame.name}</h1>

          <p style={{ fontSize: 22, fontWeight: 300, margin: "12px 0 16px", opacity: 0.7, letterSpacing: 1 }}>
            ${frame.price}.00
          </p>

          <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.5, margin: "0 0 24px", maxWidth: 400 }}>
            {frame.description}
          </p>

          {/* tabs */}
          <div style={{ display: "flex", gap: 24, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {["frames", "dimensions"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                background: "none", border: "none", borderBottom: activeTab === t ? "2px solid #fff" : "2px solid transparent",
                color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                letterSpacing: 0.5, cursor: "pointer", padding: "8px 0", transition: "all 0.3s",
                textTransform: "uppercase", opacity: activeTab === t ? 1 : 0.45,
              }}>{t === "frames" ? "Frame Styles" : "Dimensions"}</button>
            ))}
          </div>

          {activeTab === "frames" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {FRAMES.map((f, i) => (
                <button key={f.id} className="gv-frame-card" onClick={() => { setFrameIdx(i); setColorIdx(0); }}
                  onMouseEnter={() => setHoveredFrame(i)} onMouseLeave={() => setHoveredFrame(null)}
                  style={{
                    padding: "14px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                    transition: "all 0.3s", display: "flex", flexDirection: "column", gap: 4,
                    border: `1px solid ${frameIdx === i ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.06)"}`,
                    background: frameIdx === i ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                  }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>{f.name}</span>
                  <span style={{ fontSize: 11, opacity: 0.4, letterSpacing: 0.5 }}>{f.category} · ${f.price}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {Object.entries(frame.dimensions).map(([key, val]) => (
                <div key={key} style={{
                  padding: "14px 16px", borderRadius: 10,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", flexDirection: "column", gap: 4,
                }}>
                  <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.4, fontWeight: 500 }}>{key}</span>
                  <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: 0.5, fontFamily: "'Playfair Display', serif" }}>{val}</span>
                </div>
              ))}
              {/* diagram */}
              <div style={{
                gridColumn: "1 / -1", padding: 16, borderRadius: 10,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
              }}>
                <svg viewBox="0 0 260 90" style={{ width: "100%", height: "auto", opacity: 0.45 }}>
                  <ellipse cx="70" cy="42" rx="42" ry="28" fill="none" stroke="#fff" strokeWidth="1.5" />
                  <ellipse cx="190" cy="42" rx="42" ry="28" fill="none" stroke="#fff" strokeWidth="1.5" />
                  <path d="M112 36 Q130 26 148 36" fill="none" stroke="#fff" strokeWidth="1.5" />
                  <line x1="10" y1="42" x2="28" y2="42" stroke="#fff" strokeWidth="0.8" markerEnd="url(#arr)" />
                  <line x1="232" y1="42" x2="250" y2="42" stroke="#fff" strokeWidth="0.8" />
                  <line x1="28" y1="78" x2="112" y2="78" stroke="#fff" strokeWidth="0.8" />
                  <text x="70" y="86" fill="#fff" fontSize="7" textAnchor="middle" fontFamily="DM Sans">{frame.dimensions.lens}</text>
                  <line x1="112" y1="24" x2="148" y2="24" stroke="#fff" strokeWidth="0.8" />
                  <text x="130" y="20" fill="#fff" fontSize="7" textAnchor="middle" fontFamily="DM Sans">{frame.dimensions.bridge}</text>
                  <line x1="232" y1="42" x2="250" y2="42" stroke="#fff" strokeWidth="0.8" opacity="0.5" />
                  <text x="130" y="88" fill="#fff" fontSize="6" textAnchor="middle" fontFamily="DM Sans" opacity="0.5">temple: {frame.dimensions.temple}</text>
                </svg>
              </div>
            </div>
          )}

          {/* colour swatches */}
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 12, letterSpacing: 1, opacity: 0.5, textTransform: "uppercase", display: "block", marginBottom: 12 }}>
              Colour — {color.name}
            </span>
            <div style={{ display: "flex", gap: 12 }}>
              {frame.colors.map((c, i) => (
                <button key={i} onClick={() => setColorIdx(i)} title={c.name} style={{
                  width: 32, height: 32, borderRadius: "50%", cursor: "pointer", transition: "all 0.3s",
                  background: `#${c.frame.toString(16).padStart(6, "0")}`,
                  border: colorIdx === i ? "2px solid #fff" : "2px solid rgba(255,255,255,0.12)",
                  transform: colorIdx === i ? "scale(1.2)" : "scale(1)",
                  boxShadow: colorIdx === i ? "0 0 14px rgba(255,255,255,0.25)" : "none",
                }} />
              ))}
            </div>
          </div>

          {/* CTA */}
          <button className="gv-cta" style={{
            width: "100%", padding: "16px 0",
            background: "rgba(255,255,255,0.92)", color: "#000", border: "none", borderRadius: 10,
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
            letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", transition: "all 0.3s",
          }}>
            Add to Cart — ${frame.price}.00
          </button>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        padding: 24, textAlign: "center", fontSize: 11, letterSpacing: 2, opacity: 0.3,
        textTransform: "uppercase", display: "flex", gap: 12, justifyContent: "center",
        borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: "auto",
      }}>
        <span>OPTIQ © 2026</span>
        <span>·</span>
        <span>Three.js + React</span>
      </footer>
    </div>
  );
}