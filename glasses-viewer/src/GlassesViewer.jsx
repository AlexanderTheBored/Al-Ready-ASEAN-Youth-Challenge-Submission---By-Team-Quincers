import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/* ── helpers ─────────────────────────────────────────────── */
const lerp = (a, b, t) => a + (b - a) * t;
const deg  = (d) => (d * Math.PI) / 180;

/* ── build procedural glasses geometry ───────────────────── */
function createGlassesGroup() {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a2e,
    metalness: 0.7,
    roughness: 0.25,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.85,
    thickness: 0.3,
    ior: 1.5,
    transparent: true,
    opacity: 0.4,
  });

  const hingeMat = new THREE.MeshPhysicalMaterial({
    color: 0xc0c0c0,
    metalness: 0.9,
    roughness: 0.15,
    clearcoat: 0.5,
  });

  /* lenses */
  const lensGeo = new THREE.TorusGeometry(0.42, 0.035, 16, 64);
  const lensDiscGeo = new THREE.CircleGeometry(0.42, 64);

  [-0.52, 0.52].forEach((x) => {
    const rim = new THREE.Mesh(lensGeo, frameMat);
    rim.position.set(x, 0, 0);
    rim.castShadow = true;
    group.add(rim);

    const disc = new THREE.Mesh(lensDiscGeo, lensMat);
    disc.position.set(x, 0, 0.01);
    group.add(disc);
  });

  /* bridge */
  const bridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.10, 0.05, 0),
    new THREE.Vector3(-0.04, 0.12, 0.03),
    new THREE.Vector3( 0.04, 0.12, 0.03),
    new THREE.Vector3( 0.10, 0.05, 0),
  ]);
  const bridgeGeo = new THREE.TubeGeometry(bridgeCurve, 20, 0.025, 8, false);
  group.add(new THREE.Mesh(bridgeGeo, frameMat));

  /* temples (arms) */
  [{ x: -0.94, sign: -1 }, { x: 0.94, sign: 1 }].forEach(({ x, sign }) => {
    const templeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0, 0),
      new THREE.Vector3(x + sign * 0.05, 0, -0.3),
      new THREE.Vector3(x + sign * 0.05, -0.05, -0.9),
      new THREE.Vector3(x + sign * 0.03, -0.15, -1.05),
    ]);
    const templeGeo = new THREE.TubeGeometry(templeCurve, 30, 0.022, 8, false);
    const temple = new THREE.Mesh(templeGeo, frameMat);
    temple.castShadow = true;
    group.add(temple);

    /* hinge */
    const hingeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.06, 12);
    const hinge = new THREE.Mesh(hingeGeo, hingeMat);
    hinge.position.set(x, 0, -0.01);
    hinge.rotation.z = Math.PI / 2;
    hinge.castShadow = true;
    group.add(hinge);
  });

  /* nose pads */
  const padGeo = new THREE.SphereGeometry(0.03, 12, 12);
  [-0.18, 0.18].forEach((x) => {
    const pad = new THREE.Mesh(padGeo, hingeMat);
    pad.position.set(x, -0.22, 0.08);
    pad.scale.set(1, 1.4, 0.6);
    group.add(pad);
  });

  return group;
}

/* ── colour presets ──────────────────────────────────────── */
const PRESETS = [
  { name: "Midnight",   frame: 0x1a1a2e, lens: 0x88ccff, bg1: "#0f0c29", bg2: "#302b63", bg3: "#24243e" },
  { name: "Tortoise",   frame: 0x8b4513, lens: 0xd4a574, bg1: "#2c1810", bg2: "#5a3825", bg3: "#3d2414" },
  { name: "Rose Gold",  frame: 0xb76e79, lens: 0xffc0cb, bg1: "#2d1f2f", bg2: "#4a2040", bg3: "#352030" },
  { name: "Matte Black",frame: 0x222222, lens: 0x444444, bg1: "#0a0a0a", bg2: "#1a1a1a", bg3: "#111111" },
  { name: "Crystal",    frame: 0xcccccc, lens: 0xeeffff, bg1: "#101820", bg2: "#203040", bg3: "#182838" },
];

const ENVS = ["dawn", "forest", "studio"];

/* ═══════════════════════════════════════════════════════════ */
export default function GlassesViewer() {
  const mountRef   = useRef(null);
  const sceneRef   = useRef({});
  const [preset, setPreset]   = useState(0);
  const [env, setEnv]         = useState(0);
  const [auto, setAuto]       = useState(true);
  const [loaded, setLoaded]   = useState(false);

  /* ── initialise Three.js scene ── */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth, H = mount.clientHeight;

    /* renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    /* scene */
    const scene = new THREE.Scene();

    /* camera */
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0.15, 2.8);

    /* lights */
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3, 4, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x8888ff, 0.5);
    fill.position.set(-4, 2, 3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.9);
    rim.position.set(0, 3, -4);
    scene.add(rim);

    /* ground plane for shadow */
    const groundGeo = new THREE.PlaneGeometry(8, 8);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.55;
    ground.receiveShadow = true;
    scene.add(ground);

    /* glasses */
    const glasses = createGlassesGroup();
    glasses.rotation.set(deg(8), deg(-25), 0);
    scene.add(glasses);

    /* interaction state */
    const state = {
      isDragging: false,
      prevX: 0, prevY: 0,
      velX: 0, velY: 0,
      targetRotX: deg(8), targetRotY: deg(-25),
      mouseNX: 0, mouseNY: 0,
    };

    /* pointer handlers */
    const onDown = (e) => {
      state.isDragging = true;
      state.prevX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      state.prevY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    };
    const onMove = (e) => {
      const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

      /* parallax */
      const rect = mount.getBoundingClientRect();
      state.mouseNX = ((cx - rect.left) / rect.width) * 2 - 1;
      state.mouseNY = ((cy - rect.top)  / rect.height) * 2 - 1;

      if (!state.isDragging) return;
      const dx = cx - state.prevX;
      const dy = cy - state.prevY;
      state.prevX = cx;
      state.prevY = cy;
      state.velX = dx * 0.006;
      state.velY = dy * 0.006;
      state.targetRotY += dx * 0.006;
      state.targetRotX += dy * 0.006;
    };
    const onUp = () => { state.isDragging = false; };

    const canvas = renderer.domElement;
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    /* zoom */
    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(1.5, Math.min(5, camera.position.z + e.deltaY * 0.003));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });

    /* animation loop */
    let raf;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      /* inertia */
      if (!state.isDragging) {
        state.velX *= 0.92;
        state.velY *= 0.92;
        state.targetRotY += state.velX;
        state.targetRotX += state.velY;
      }

      /* smooth follow */
      glasses.rotation.y = lerp(glasses.rotation.y, state.targetRotY, 0.12);
      glasses.rotation.x = lerp(glasses.rotation.x, state.targetRotX, 0.12);

      /* subtle parallax on camera */
      camera.position.x = lerp(camera.position.x, state.mouseNX * 0.12, 0.06);
      camera.position.y = lerp(camera.position.y, 0.15 - state.mouseNY * 0.08, 0.06);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();
    setLoaded(true);

    /* store refs */
    sceneRef.current = { renderer, scene, camera, glasses, state, mount };

    /* resize */
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  /* ── auto-rotate toggle ── */
  useEffect(() => {
    if (!sceneRef.current.glasses) return;
    let raf;
    const spin = () => {
      if (auto && !sceneRef.current.state.isDragging) {
        sceneRef.current.state.targetRotY += 0.004;
      }
      raf = requestAnimationFrame(spin);
    };
    spin();
    return () => cancelAnimationFrame(raf);
  }, [auto]);

  /* ── apply colour preset ── */
  useEffect(() => {
    const g = sceneRef.current.glasses;
    if (!g) return;
    const p = PRESETS[preset];
    g.traverse((child) => {
      if (!child.isMesh) return;
      if (child.material.transmission > 0.5 || child.material.transparent) {
        child.material.color.setHex(p.lens);
      } else if (child.material.metalness > 0.8) {
        /* hinges stay silver */
      } else {
        child.material.color.setHex(p.frame);
      }
    });
  }, [preset]);

  const p = PRESETS[preset];

  return (
    <div style={{
      width: "100%", minHeight: "100vh",
      background: `linear-gradient(135deg, ${p.bg1} 0%, ${p.bg2} 50%, ${p.bg3} 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#fff",
      transition: "background 0.6s ease",
    }}>

      {/* header */}
      <div style={{ padding: "32px 24px 0", textAlign: "center", width: "100%" }}>
        <p style={{
          fontSize: 11, letterSpacing: 4, textTransform: "uppercase",
          opacity: 0.5, margin: 0,
        }}>Interactive 3D Preview</p>
        <h1 style={{
          fontSize: 32, fontWeight: 300, margin: "8px 0 4px",
          letterSpacing: 1,
        }}>
          {PRESETS[preset].name} <span style={{ fontWeight: 600 }}>Collection</span>
        </h1>
        <p style={{ fontSize: 13, opacity: 0.4, margin: 0 }}>
          Drag to rotate · Scroll to zoom
        </p>
      </div>

      {/* 3D viewport */}
      <div
        ref={mountRef}
        style={{
          width: "100%", maxWidth: 700, height: 420,
          margin: "16px auto", cursor: "grab",
          borderRadius: 16, overflow: "hidden",
          position: "relative",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      />

      {/* colour swatches */}
      <div style={{ display: "flex", gap: 10, margin: "0 0 20px", flexWrap: "wrap", justifyContent: "center" }}>
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => setPreset(i)} style={{
            width: 36, height: 36, borderRadius: "50%",
            border: preset === i ? "2px solid #fff" : "2px solid rgba(255,255,255,0.15)",
            background: `#${p.frame.toString(16).padStart(6, "0")}`,
            cursor: "pointer", transition: "all 0.3s",
            transform: preset === i ? "scale(1.15)" : "scale(1)",
            boxShadow: preset === i ? "0 0 12px rgba(255,255,255,0.3)" : "none",
          }}/>
        ))}
      </div>

      {/* controls row */}
      <div style={{
        display: "flex", gap: 12, margin: "0 0 32px", flexWrap: "wrap", justifyContent: "center",
      }}>
        <button onClick={() => setAuto(!auto)} style={btnStyle}>
          {auto ? "⏸ Pause Rotation" : "▶ Auto Rotate"}
        </button>
        <button onClick={() => {
          if (!sceneRef.current.state) return;
          sceneRef.current.state.targetRotX = deg(8);
          sceneRef.current.state.targetRotY = deg(-25);
          sceneRef.current.camera.position.z = 2.8;
        }} style={btnStyle}>
          ↺ Reset View
        </button>
      </div>

      {/* info card */}
      <div style={{
        background: "rgba(255,255,255,0.06)", borderRadius: 12,
        padding: "20px 28px", maxWidth: 520, width: "90%",
        marginBottom: 40, backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600, opacity: 0.9 }}>
          Tech Stack
        </h3>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, opacity: 0.55 }}>
          Three.js · @react-three/fiber · @react-three/drei · React ·
          PBR Materials · ACES Tonemapping · PCF Soft Shadows ·
          GLB asset format recommended
        </p>
      </div>
    </div>
  );
}

const btnStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#fff", padding: "8px 18px",
  borderRadius: 8, cursor: "pointer",
  fontSize: 13, backdropFilter: "blur(8px)",
  transition: "all 0.2s",
};
