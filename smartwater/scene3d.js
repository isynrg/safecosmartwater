/* ==========================================================
   SafeCo SmartWater — 3D scroll story (three.js)
   - Hero: floating liquid droplet over the hero photo
   - Chapter II: chrome faucet pours into a glass → bullet-time freeze →
     camera dives into the stream → fly-through of 3D contaminant molecules
   Falls back to the 2D canvas version in main.js if WebGL is unavailable.
   ========================================================== */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const isMobile = () => innerWidth < 700;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch (_) { return false; }
}

function makeRenderer(canvas, alpha) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: "high-performance" });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 1.75));
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.9;
  return r;
}

function envFor(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();
  return tex;
}

function softSprite(inner = "rgba(255,255,255,1)", outer = "rgba(255,255,255,0)") {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, inner); gr.addColorStop(0.35, inner.replace(/[\d.]+\)$/, "0.45)")); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function whenVisible(el, margin, cb) {
  const io = new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin });
  io.observe(el);
}

/* ---------- film/lens pass: chromatic aberration + vignette + grain ---------- */
const LensShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uCA: { value: 0.015 }, uVig: { value: 1.15 }, uGrain: { value: 0.02 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uCA, uVig, uGrain; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5; float k = uCA * dot(d,d) * 4.0;
      vec3 col = vec3(texture2D(tDiffuse, vUv + d*k).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d*k).b);
      col *= smoothstep(1.05, 0.25, length(d) * uVig);
      col += (h(vUv * 800.0 + uTime) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

/* ==========================================================
   HERO DROPLET
   ========================================================== */
function initHero() {
  const hero = document.querySelector(".hero");
  const img = hero.querySelector(".hero__media img");
  const canvas = document.createElement("canvas");
  canvas.className = "hero__gl";
  hero.querySelector(".hero__media").after(canvas);

  const renderer = makeRenderer(canvas, true);
  renderer.setClearColor(0x000000, 0);
  const env = envFor(renderer);
  const scene = new THREE.Scene();
  scene.environment = env;
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const time = { value: 0 };
  const wobble = (mat, amt) => {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = time;
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace("#include <begin_vertex>", `
          vec3 transformed = position;
          float n = sin(position.x*2.1 + uTime*1.2) * sin(position.y*2.4 + uTime*0.9) * sin(position.z*1.9 + uTime*1.1);
          n += 0.5 * sin(position.y*4.0 - uTime*1.7);
          transformed += normal * n * ${amt.toFixed(3)};`);
    };
  };

  // Liquid look until the photo is available inside WebGL; then true refraction.
  const liquid = new THREE.MeshPhysicalMaterial({
    color: 0x7fe3ee, metalness: 0.65, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.05,
    iridescence: 0.8, iridescenceIOR: 1.35, envMapIntensity: 2.2,
  });
  wobble(liquid, 0.12);
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xe6fdff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 2.2, ior: 1.33,
    attenuationColor: new THREE.Color(0x3ad6e0), attenuationDistance: 3.5, iridescence: 0.35, clearcoat: 1, envMapIntensity: 1.6,
  });
  wobble(glass, 0.12);

  const drop = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 64), liquid);
  scene.add(drop);
  const satellites = [];
  const satGeo = new THREE.IcosahedronGeometry(0.2, 16);
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(satGeo, liquid);
    m.userData = { r: rand(1.9, 2.8), sp: rand(0.25, 0.6) * (i % 2 ? 1 : -1), ph: rand(0, 6.28), tilt: rand(-0.6, 0.6), s: rand(0.35, 1) };
    m.scale.setScalar(m.userData.s);
    scene.add(m); satellites.push(m);
  }
  const key = new THREE.PointLight(0x7beaf0, 40, 30); key.position.set(-3, 3, 5); scene.add(key);
  const rim = new THREE.PointLight(0xffffff, 30, 30); rim.position.set(4, -2, 3); scene.add(rim);

  // Photo plane (only if the image host allows CORS) → enables real refraction.
  let bg = null;
  const loader = new THREE.TextureLoader(); loader.setCrossOrigin("anonymous");
  loader.load(img.currentSrc || img.src, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    bg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    bg.position.z = -4; bg.userData.aspect = tex.image.width / tex.image.height;
    scene.add(bg);
    drop.material = glass; satellites.forEach((s) => (s.material = glass));
    hero.classList.add("hero--gl");
    resize();
  }, undefined, () => {});

  let w = 0, h = 0;
  const resize = () => {
    w = hero.clientWidth; h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (bg) {
      const vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - bg.position.z);
      const vw = vh * camera.aspect, a = bg.userData.aspect;
      const sc = vw / vh > a ? [vw, vw / a] : [vh * a, vh];
      bg.scale.set(sc[0] * 1.12, sc[1] * 1.12, 1);
    }
  };
  addEventListener("resize", resize); resize();

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", (e) => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; });

  let on = true;
  whenVisible(hero, "100px", (v) => (on = v));
  const clock = new THREE.Clock();
  const tick = () => {
    requestAnimationFrame(tick);
    if (!on) return;
    const t = clock.getElapsedTime();
    time.value = reduceMotion ? 0 : t;
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    const sp = clamp(scrollY / h);
    const mob = isMobile();
    const baseX = mob ? 1.15 : 2.35, baseY = mob ? 2.35 : 0.15, s = mob ? 0.55 : 1;
    drop.position.set(baseX + mouse.x * 0.4, baseY + Math.sin(t * 0.8) * 0.12 - sp * 4.5, 0);
    drop.scale.setScalar(s * (1 - sp * 0.35));
    drop.rotation.set(t * 0.15 + mouse.y * 0.6, t * 0.2 + mouse.x * 0.8, 0);
    satellites.forEach((m) => {
      const u = m.userData, a = t * u.sp + u.ph;
      m.position.set(drop.position.x + Math.cos(a) * u.r * s, drop.position.y + Math.sin(a) * u.r * u.tilt * s - sp * 2 * u.s, Math.sin(a) * u.r * s);
    });
    if (bg) { bg.position.x = -mouse.x * 0.35; bg.position.y = mouse.y * 0.25 + sp * 1.2; bg.scale.multiplyScalar(1); }
    camera.position.x = mouse.x * 0.6; camera.position.y = -mouse.y * 0.4; camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  };
  tick();
}

/* ==========================================================
   CHAPTER II — FREEZE / DIVE / MOLECULE FLY-THROUGH
   ========================================================== */
function initFreeze() {
  const C = (window.SAFECO && window.SAFECO.CONTAMINANTS) || [];
  const section = document.getElementById("freeze");
  const sticky = section.querySelector(".freeze__sticky");
  const canvas = document.createElement("canvas");
  canvas.className = "freeze__gl";
  sticky.insertBefore(canvas, sticky.querySelector(".freeze__captions"));
  const flash = document.createElement("div"); flash.className = "freeze__flash";
  sticky.insertBefore(flash, sticky.querySelector(".freeze__captions"));
  const tagLayer = document.createElement("div"); tagLayer.className = "tags3d";
  sticky.insertBefore(tagLayer, sticky.querySelector(".freeze__captions"));

  const renderer = makeRenderer(canvas, false);
  const env = envFor(renderer);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 200);
  const mob = isMobile();

  /* ---------------- Scene A: faucet + glass ---------------- */
  const A = new THREE.Scene();
  A.background = new THREE.Color(0x020a12);
  A.fog = new THREE.FogExp2(0x020a12, 0.05);
  A.environment = env;

  A.add(new THREE.AmbientLight(0x6fa8c8, 0.25));
  const spot = new THREE.SpotLight(0xffffff, 45, 30, 0.42, 0.7, 1.4); spot.position.set(-1.5, 8, -1); spot.target.position.set(0, -1.5, 0); A.add(spot, spot.target);
  const aqua = new THREE.PointLight(0x3ad6e0, 14, 20, 1.6); aqua.position.set(3, 1, -2.5); A.add(aqua);
  const blue = new THREE.PointLight(0x4a7dff, 10, 20, 1.6); blue.position.set(-4, 2, 2); A.add(blue);

  // backdrop glow
  const glowTex = softSprite("rgba(40,170,200,0.5)", "rgba(40,170,200,0)");
  const back = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, fog: false, opacity: 0.32 }));
  back.position.set(0, 0.8, -9); A.add(back);

  // counter
  const counter = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, 10),
    new THREE.MeshPhysicalMaterial({ color: 0x050d14, roughness: 0.12, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.35 }));
  counter.position.y = -2.85; A.add(counter);

  // faucet
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xeaf1f5, metalness: 1, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.75 });
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.4, -2.6, 0), new THREE.Vector3(-1.4, -0.4, 0), new THREE.Vector3(-1.4, 1.3, 0),
    new THREE.Vector3(-1.3, 2.05, 0), new THREE.Vector3(-0.98, 2.55, 0), new THREE.Vector3(-0.55, 2.72, 0),
    new THREE.Vector3(-0.16, 2.55, 0), new THREE.Vector3(0, 2.12, 0), new THREE.Vector3(0, 1.82, 0),
  ], false, "centripetal");
  A.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 240, 0.17, 48, false), chrome));
  const add = (geo, mat, x, y, z, rx = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); A.add(m); return m; };
  add(new THREE.CylinderGeometry(0.36, 0.42, 0.12, 64), chrome, -1.4, -2.55, 0);
  add(new THREE.CylinderGeometry(0.21, 0.19, 0.34, 64), chrome, 0, 1.72, 0);
  add(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 48), new THREE.MeshStandardMaterial({ color: 0x141c22, roughness: 0.6 }), 0, 1.545, 0);
  add(new THREE.SphereGeometry(0.2, 48, 32), chrome, -1.4, -0.2, 0);
  add(new THREE.CylinderGeometry(0.055, 0.07, 0.95, 32), chrome, -0.95, -0.05, 0.12, 0, -1.35);

  // glass
  const prof = [[0, 0], [0.5, 0], [0.55, 0.035], [0.62, 1.48], [0.6, 1.52], [0.575, 1.5], [0.505, 0.14], [0, 0.14]].map(([x, y]) => new THREE.Vector2(x, y));
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 0.45, depthWrite: false, side: THREE.DoubleSide });
  const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), glassMat);
  glass.position.y = -2.6; A.add(glass);

  const LEVEL = -1.5, TOP = 1.55;
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x1f8fa3, transparent: true, opacity: 0.6, roughness: 0.05, clearcoat: 1,
    envMapIntensity: 0.5, emissive: 0x0e6f82, emissiveIntensity: 0.35, depthWrite: false,
  });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.535, 0.5, 0.96, 72), waterMat);
  water.position.y = LEVEL - 0.48; water.renderOrder = 1; glass.renderOrder = 2; A.add(water);

  // stream (custom shader)
  const SU = { uFlow: { value: 0 }, uFreeze: { value: 0 }, uTime: { value: 0 }, uTop: { value: TOP }, uBottom: { value: LEVEL } };
  const hash = `float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }`;
  const streamMat = new THREE.ShaderMaterial({
    uniforms: SU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `
      uniform float uFlow, uFreeze, uTop, uBottom;
      varying vec2 vUv; varying vec3 vWorld; varying vec3 vN; varying float vAng;
      ${hash}
      void main(){
        vUv = uv; float v = uv.y;
        float ang = atan(position.z, position.x); vAng = ang;
        float fz = 1.0 - uFreeze;
        float r = mix(0.05, 0.085, pow(v, 1.6));
        r += sin(ang*3.0 + v*40.0 - uFlow*30.0) * 0.006 * fz;
        float cell = h(vec2(floor(v*70.0), floor((ang + 3.1416) * 3.0)));
        r += uFreeze * (0.012 + 0.03 * cell);
        vec2 wob = vec2(sin(v*28.0 - uFlow*22.0), cos(v*17.0 - uFlow*14.0)) * 0.007 * fz * (1.0 - v);
        vec3 p = vec3(cos(ang)*r + wob.x, mix(uBottom, uTop, v), sin(ang)*r + wob.y);
        vN = normalize(vec3(cos(ang), 0.0, sin(ang)));
        vec4 w = modelMatrix * vec4(p, 1.0); vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform float uFlow, uFreeze, uTime;
      varying vec2 vUv; varying vec3 vWorld; varying vec3 vN; varying float vAng;
      ${hash}
      void main(){
        vec3 V = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - abs(dot(normalize(vN), V)), 2.0);
        float streak = smoothstep(0.7, 1.0, sin(vUv.y*120.0 + uFlow*90.0 + vAng*2.0)) * (1.0 - uFreeze);
        vec3 wat = mix(vec3(0.12,0.5,0.7), vec3(0.85,1.0,1.0), clamp(fres*0.9 + streak*0.7, 0.0, 1.0));
        float aW = 0.3 + fres*0.6 + streak*0.35;
        float cell = h(floor(vec2(vUv.x*24.0, vUv.y*160.0)));
        float spark = step(0.962, cell) * (0.5 + 0.5*sin(uTime*4.0 + cell*60.0));
        vec3 ice = mix(vec3(0.42,0.72,0.9), vec3(0.95,1.0,1.0), fres*0.8) + spark*1.6;
        vec3 col = mix(wat, ice, uFreeze) * (1.0 + fres*0.5);
        gl_FragColor = vec4(col, clamp(mix(aW, 0.75 + fres*0.25, uFreeze), 0.0, 1.0));
      }`,
  });
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 48, 180, true), streamMat);
  stream.frustumCulled = false; A.add(stream);

  // ripples on the water surface
  const ripples = [];
  for (let i = 0; i < 4; i++) {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.072, 64), new THREE.MeshBasicMaterial({ color: 0xbff4ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    r.rotation.x = -Math.PI / 2; r.position.y = LEVEL + 0.004; A.add(r); ripples.push(r);
  }

  // ice shards (instanced) — grow from the faucet downward as it freezes
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xd2f1ff, transparent: true, opacity: 0.9, roughness: 0.08, clearcoat: 1,
    emissive: 0x58d4ff, emissiveIntensity: 0.12, envMapIntensity: 0.9, flatShading: true,
  });
  const shardGeo = new THREE.OctahedronGeometry(1, 0);
  const N = mob ? 150 : 280;
  const shards = new THREE.InstancedMesh(shardGeo, iceMat, N);
  const sd = [], dummy = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) {
    const kind = i < N * 0.62 ? 0 : i < N * 0.74 ? 1 : i < N * 0.88 ? 2 : 3;
    const a = rand(0, Math.PI * 2);
    let pos, dir, len, t0;
    if (kind === 0) { const y = rand(LEVEL, TOP); pos = new THREE.Vector3(Math.cos(a) * 0.07, y, Math.sin(a) * 0.07); dir = new THREE.Vector3(Math.cos(a), rand(-0.5, 0.9), Math.sin(a)); len = rand(0.05, 0.2); t0 = ((TOP - y) / (TOP - LEVEL)) * 0.55; }
    else if (kind === 1) { pos = new THREE.Vector3(Math.cos(a) * 0.2, 1.56 + rand(-0.04, 0.1), Math.sin(a) * 0.2); dir = new THREE.Vector3(Math.cos(a), rand(-0.8, 0.2), Math.sin(a)); len = rand(0.06, 0.16); t0 = 0; }
    else if (kind === 2) { pos = new THREE.Vector3(Math.cos(a) * 0.6, -1.08, Math.sin(a) * 0.6); dir = new THREE.Vector3(Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4); len = rand(0.05, 0.14); t0 = 0.55; }
    else { const rr = Math.sqrt(Math.random()) * 0.48; pos = new THREE.Vector3(Math.cos(a) * rr, LEVEL + 0.01, Math.sin(a) * rr); dir = new THREE.Vector3(rand(-0.4, 0.4), 1, rand(-0.4, 0.4)); len = rand(0.04, 0.12); t0 = 0.5; }
    sd.push({ pos, q: new THREE.Quaternion().setFromUnitVectors(up, dir.normalize()), len, th: rand(0.012, 0.03), t0: t0 + rand(0, 0.15) });
  }
  A.add(shards);
  let lastF = -1;
  const updateShards = (f) => {
    if (Math.abs(f - lastF) < 0.002) return; lastF = f;
    sd.forEach((s, i) => {
      const g = smooth(s.t0, s.t0 + 0.3, f);
      dummy.position.copy(s.pos); dummy.quaternion.copy(s.q);
      dummy.scale.set(s.th * g + 1e-4, s.len * g + 1e-4, s.th * g + 1e-4);
      dummy.updateMatrix(); shards.setMatrixAt(i, dummy.matrix);
    });
    shards.instanceMatrix.needsUpdate = true;
  };
  updateShards(0);

  // splash droplets — they hang in mid-air when time stops
  const dropMat = new THREE.MeshPhysicalMaterial({ color: 0xc9f6ff, transparent: true, opacity: 0.85, roughness: 0.02, clearcoat: 1, emissive: 0x2fc6d6, emissiveIntensity: 0.15 });
  const DN = mob ? 50 : 90;
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), dropMat, DN);
  const dd = Array.from({ length: DN }, () => ({ alive: false, p: new THREE.Vector3(), v: new THREE.Vector3(), r: 0 }));
  const spawn = (d) => { d.alive = true; d.p.set(rand(-0.05, 0.05), LEVEL, rand(-0.05, 0.05)); const a = rand(0, 6.28), s = rand(0.3, 1.0); d.v.set(Math.cos(a) * s, rand(1.4, 2.8), Math.sin(a) * s); d.r = rand(0.012, 0.035); };
  A.add(drops);

  // frost motes
  const MN = mob ? 350 : 700;
  const mPos = new Float32Array(MN * 3);
  for (let i = 0; i < MN; i++) { mPos[i * 3] = rand(-5, 5); mPos[i * 3 + 1] = rand(-2.6, 4); mPos[i * 3 + 2] = rand(-4, 4); }
  const motesGeo = new THREE.BufferGeometry(); motesGeo.setAttribute("position", new THREE.BufferAttribute(mPos, 3));
  const motes = new THREE.Points(motesGeo, new THREE.PointsMaterial({ size: 0.05, map: softSprite(), transparent: true, depthWrite: false, opacity: 0, color: 0xdff8ff, blending: THREE.AdditiveBlending }));
  A.add(motes);

  /* ---------------- Scene B: microscopic fly-through ---------------- */
  const B = new THREE.Scene();
  B.background = new THREE.Color(0x021a26);
  B.fog = new THREE.FogExp2(0x032a38, 0.055);
  B.environment = env;
  B.add(new THREE.AmbientLight(0x88ccee, 0.4));
  const bl1 = new THREE.PointLight(0x7beaf0, 14, 30, 1.5); B.add(bl1);
  const bl2 = new THREE.PointLight(0xffffff, 8, 20, 1.5); B.add(bl2);

  // underwater gradient dome that travels with the camera
  const domeC = document.createElement("canvas"); domeC.width = 4; domeC.height = 256;
  const dg = domeC.getContext("2d"), grd = dg.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, "#0d5a70"); grd.addColorStop(0.45, "#063246"); grd.addColorStop(1, "#010a10");
  dg.fillStyle = grd; dg.fillRect(0, 0, 4, 256);
  const domeTex = new THREE.CanvasTexture(domeC); domeTex.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ map: domeTex, side: THREE.BackSide, fog: false, depthWrite: false }));
  B.add(dome);
  const SPACING = 6.5, ZEND = -(C.length - 1) * SPACING;
  // plankton / bokeh
  const PN = mob ? 1200 : 2600;
  const pPos = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) { pPos[i * 3] = rand(-9, 9); pPos[i * 3 + 1] = rand(-6, 6); pPos[i * 3 + 2] = rand(ZEND - 20, 14); }
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  B.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.07, map: softSprite("rgba(160,240,255,1)", "rgba(160,240,255,0)"), transparent: true, depthWrite: false, opacity: 0.6, blending: THREE.AdditiveBlending })));
  // big soft water molecules (bokeh)
  const bPos = Float32Array.from({ length: 180 * 3 }, (_, i) => (i % 3 === 2 ? rand(ZEND - 20, 14) : rand(-8, 8)));
  const bGeo = new THREE.BufferGeometry(); bGeo.setAttribute("position", new THREE.BufferAttribute(bPos, 3));
  const bokeh = new THREE.Points(bGeo,
    new THREE.PointsMaterial({ size: 0.9, map: softSprite("rgba(58,214,224,0.35)", "rgba(58,214,224,0)"), transparent: true, depthWrite: false, opacity: 0.18, blending: THREE.AdditiveBlending }));
  B.add(bokeh);

  // molecule kit
  const sphere = new THREE.SphereGeometry(1, 32, 24);
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 12);
  const mats = {};
  const matFor = (hex, opts = {}) => {
    const k = hex + JSON.stringify(opts);
    return mats[k] || (mats[k] = new THREE.MeshPhysicalMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.32, roughness: 0.25, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.15, ...opts }));
  };
  const atom = (g, x, y, z, r, hex, opts) => { const m = new THREE.Mesh(sphere, matFor(hex, opts)); m.position.set(x, y, z); m.scale.setScalar(r); g.add(m); return m; };
  const bond = (g, a, b, hex = 0xcfe9f2) => {
    const A1 = a.position, B1 = b.position, m = new THREE.Mesh(cyl, matFor(hex, { emissiveIntensity: 0.2 }));
    const mid = A1.clone().add(B1).multiplyScalar(0.5), dir = B1.clone().sub(A1), len = dir.length();
    m.position.copy(mid); m.scale.set(0.035, len, 0.035); m.quaternion.setFromUnitVectors(up, dir.normalize()); g.add(m);
  };
  const tetra = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((v) => new THREE.Vector3(...v).normalize());
  const centered = (g, cHex, cr, ligands, d) => {
    const c = atom(g, 0, 0, 0, cr, cHex);
    ligands.forEach(([hex, r], i) => { const v = tetra[i].clone().multiplyScalar(d); bond(g, c, atom(g, v.x, v.y, v.z, r, hex)); });
  };
  const builders = {
    chlorine: (g, c) => { const a = atom(g, -0.2, 0, 0, 0.2, c), b = atom(g, 0.2, 0, 0, 0.2, c); bond(g, a, b); },
    tthm: (g, c) => centered(g, 0x3b4650, 0.17, [[c, 0.19], [c, 0.19], [c, 0.19], [0xffffff, 0.1]], 0.42),
    haa: (g, c) => { const c1 = atom(g, -0.2, 0, 0, 0.16, 0x3b4650), c2 = atom(g, 0.2, 0, 0, 0.16, 0x3b4650); bond(g, c1, c2);
      [[c, -0.45, 0.3], [c, -0.45, -0.3], [0xff4d4d, 0.45, 0.3], [0xff4d4d, 0.45, -0.3]].forEach(([hex, x, y]) => bond(g, x < 0 ? c1 : c2, atom(g, x, y, 0, 0.14, hex))); },
    cr6: (g, c) => centered(g, c, 0.24, [[0xff6b4a, 0.15], [0xff6b4a, 0.15], [0xff6b4a, 0.15], [0xff6b4a, 0.15]], 0.42),
    nitrate: (g, c) => { const n = atom(g, 0, 0, 0, 0.18, c); for (let i = 0; i < 3; i++) { const a = i * 2.094; bond(g, n, atom(g, Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0, 0.15, 0xff6b6b)); } },
    lead: (g, c) => { for (let i = 0; i < 5; i++) atom(g, rand(-0.25, 0.25), rand(-0.25, 0.25), rand(-0.25, 0.25), rand(0.17, 0.26), c, { metalness: 1, roughness: 0.22, emissiveIntensity: 0.12 }); },
    pfas: (g, c) => { let prev = null; for (let i = 0; i < 8; i++) { const ca = atom(g, -0.9 + i * 0.26, i % 2 ? 0.1 : -0.1, 0, 0.1, 0x3b4650);
        if (prev) bond(g, prev, ca); prev = ca; [-1, 1].forEach((s) => bond(g, ca, atom(g, ca.position.x, ca.position.y + (i % 2 ? 0.2 : -0.2), s * 0.2, 0.08, c))); } },
    arsenic: (g, c) => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), matFor(c, { flatShading: true, emissiveIntensity: 0.7 })); g.add(m); },
    micro: (g) => { const cols = [0x7cf5c4, 0xff9de2, 0x9fd0ff, 0xfff1a8]; for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), matFor(cols[(Math.random() * 4) | 0], { flatShading: true, transparent: true, opacity: 0.85 })); m.scale.set(rand(0.6, 1.6), rand(0.2, 0.5), rand(0.6, 1.4)); m.position.set(rand(-0.25, 0.25), rand(-0.25, 0.25), rand(-0.25, 0.25)); m.rotation.set(rand(0, 6), rand(0, 6), 0); g.add(m); } },
    hard: (g) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), matFor(0xeaf8ff, { transmission: 0.6, thickness: 0.4, roughness: 0.08, emissive: 0x9fdfff, emissiveIntensity: 0.08, flatShading: true })); m.rotation.set(0.6, 0.7, 0); g.add(m);
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0xffffff })); e.rotation.copy(m.rotation); g.add(e); },
  };

  const halo = softSprite();
  const groups = C.map((c, i) => {
    const grp = new THREE.Group();
    const side = i % 2 ? 1 : -1;
    grp.position.set(side * (mob ? 1.15 : 2.4), Math.sin(i * 1.7) * (mob ? 1.1 : 0.8), -i * SPACING);
    const n = c.key === "pfas" ? 3 : mob ? 4 : 6;
    for (let k = 0; k < n; k++) {
      const m = new THREE.Group();
      (builders[c.key] || builders.chlorine)(m, new THREE.Color(c.color).getHex());
      const r = k === 0 ? 0 : rand(0.6, 1.5), a = rand(0, 6.28), b = rand(-1, 1);
      m.position.set(Math.cos(a) * r, b * r * 0.7, Math.sin(a) * r);
      m.scale.setScalar(k === 0 ? 1.35 : rand(0.75, 1.1));
      m.userData = { spin: new THREE.Vector3(rand(-0.6, 0.6), rand(-0.8, 0.8), rand(-0.4, 0.4)), ph: rand(0, 6.28), base: m.position.clone() };
      grp.add(m);
    }
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: new THREE.Color(c.color), transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.scale.setScalar(3.2); grp.add(sp);
    B.add(grp);
    return grp;
  });

  // 3D-anchored labels
  tagLayer.innerHTML = C.map((c) => `
    <div class="tag tag3d" style="--c:${c.color}">
      <div class="tag__dot"></div><div class="tag__line"></div>
      <div class="tag__card"><b>${c.name}</b><small>${c.short}</small></div>
    </div>`).join("");
  const tagEls = [...tagLayer.querySelectorAll(".tag")];

  /* ---------------- post-processing ---------------- */
  const composer = new EffectComposer(renderer);
  const rp = new RenderPass(A, camera); composer.addPass(rp);
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.5, 0.75); composer.addPass(bloom);
  const lens = new ShaderPass(LensShader); composer.addPass(lens);
  composer.addPass(new OutputPass());

  let W = 0, H = 0;
  const resize = () => {
    W = sticky.clientWidth; H = sticky.clientHeight;
    renderer.setSize(W, H, false); composer.setSize(W, H);
    camera.aspect = W / H; camera.updateProjectionMatrix();
  };
  addEventListener("resize", resize); resize();

  /* ---------------- camera choreography ---------------- */
  // spherical keys around the stream (r = distance, th = orbit angle, h = height)
  const keys = [
    { p: 0.0, r: 12.5, th: 0.42, h: 0.9 },
    { p: 0.16, r: 9.0, th: 0.25, h: 0.4 },
    { p: 0.36, r: 6.8, th: -0.7, h: 1.0 },
    { p: 0.52, r: 0.22, th: -0.05, h: -0.2 },
  ];
  const target = new THREE.Vector3();
  const camAt = (p) => {
    let i = 0; while (i < keys.length - 2 && p > keys[i + 1].p) i++;
    const a = keys[i], b = keys[i + 1], t = smooth(a.p, b.p, p);
    const r = Math.exp(lerp(Math.log(a.r), Math.log(b.r), t)), th = lerp(a.th, b.th, t), h = lerp(a.h, b.h, t);
    const portrait = camera.aspect < 1 ? lerp(1.35, 1, smooth(0.36, 0.52, p)) : 1;
    target.set(0, lerp(lerp(0.05, -0.3, smooth(0, 0.36, p)), -0.2, smooth(0.36, 0.52, p)), 0);
    camera.position.set(target.x + Math.sin(th) * r * portrait, target.y + h, target.z + Math.cos(th) * r * portrait);
  };

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", (e) => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; });

  let on = false, flowT = 0;
  whenVisible(section, "300px", (v) => { on = v; if (v) resize(); });
  document.body.classList.add("has-3d");

  const clock = new THREE.Clock();
  const v3 = new THREE.Vector3();
  const tick = () => {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, clock.getDelta());
    if (!on) return;
    const t = clock.elapsedTime;
    const rect = section.getBoundingClientRect();
    const p = clamp(-rect.top / (rect.height - innerHeight));
    const f = smooth(0.14, 0.36, p);
    const dive = smooth(0.36, 0.52, p);
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    const ts = 1 - f;
    flowT += dt * ts * (reduceMotion ? 0.25 : 1);

    flash.style.opacity = smooth(0.47, 0.52, p) * (1 - smooth(0.52, 0.6, p));
    lens.uniforms.uTime.value = t;
    lens.uniforms.uCA.value = 0.012 + dive * dive * 0.07 * (1 - smooth(0.52, 0.56, p));

    if (p < 0.52) {
      rp.scene = A;
      bloom.threshold = 0.85; bloom.strength = 0.45 + f * 0.25; bloom.radius = 0.45;
      SU.uFlow.value = flowT; SU.uFreeze.value = f; SU.uTime.value = t;
      updateShards(f);
      // glass + water frost over
      glassMat.roughness = lerp(0.04, 0.3, f); glassMat.opacity = lerp(0.12, 0.3, f); glassMat.color.setRGB(lerp(1, 0.86, f), lerp(1, 0.95, f), 1);
      waterMat.roughness = lerp(0.04, 0.4, f); waterMat.opacity = lerp(0.6, 0.85, f); waterMat.color.setRGB(lerp(0.12, 0.45, f), lerp(0.56, 0.68, f), lerp(0.64, 0.78, f)); waterMat.emissiveIntensity = lerp(0.35, 0.12, f);
      // ripples freeze
      ripples.forEach((r, i) => { const ph = (i / ripples.length + flowT * 0.6) % 1; r.scale.setScalar(1 + ph * 6.5); r.material.opacity = (1 - ph) * 0.55 * ts; });
      // droplets
      dd.forEach((d, i) => {
        if (!d.alive) { if (ts > 0.3 && Math.random() < 0.08 * ts) spawn(d); }
        else {
          d.v.y -= 6.5 * dt * ts; d.p.addScaledVector(d.v, dt * ts * 0.9);
          if (d.p.y < LEVEL && d.v.y < 0) d.alive = false;
        }
        dummy.position.copy(d.p); dummy.quaternion.identity();
        dummy.scale.setScalar(d.alive ? d.r * (1 + f * 0.3) : 1e-4); dummy.updateMatrix(); drops.setMatrixAt(i, dummy.matrix);
      });
      drops.instanceMatrix.needsUpdate = true;
      dropMat.emissiveIntensity = 0.1 + f * 0.25;
      // frost motes drift
      motes.material.opacity = f * 0.6;
      motes.rotation.y = t * 0.03;
      motes.position.y = -((t * 0.08) % 1);
      camAt(p);
      camera.position.x += mouse.x * 0.35 * (1 - dive); camera.position.y += -mouse.y * 0.25 * (1 - dive);
      camera.fov = lerp(camera.aspect < 1 ? 48 : 35, 22, dive);
      camera.updateProjectionMatrix();
      camera.lookAt(target);
      tagEls.forEach((el) => el.classList.remove("is-on"));
    } else {
      rp.scene = B;
      bloom.threshold = 0.4; bloom.strength = 0.6; bloom.radius = 0.55;
      const u = smooth(0.52, 0.99, p) * 0.15 + clamp((p - 0.52) / 0.47) * 0.85;
      const z = lerp(9, ZEND - 6, u);
      camera.fov = lerp(70, camera.aspect < 1 ? 60 : 50, smooth(0.52, 0.6, p)); camera.updateProjectionMatrix();
      camera.position.set(Math.sin(u * 7) * 0.25 + mouse.x * 0.5, Math.cos(u * 5) * 0.2 - mouse.y * 0.35, z);
      camera.lookAt(camera.position.x * 0.4, camera.position.y * 0.4, z - 8);
      camera.rotation.z += Math.sin(u * 6) * 0.06;
      bl1.position.set(2, 2, z - 4); bl2.position.set(-2, -1, z - 10); dome.position.copy(camera.position);
      groups.forEach((g) => g.children.forEach((m) => {
        if (!m.userData.spin) return;
        m.rotation.x = t * m.userData.spin.x + m.userData.ph; m.rotation.y = t * m.userData.spin.y; m.rotation.z = t * m.userData.spin.z;
        m.position.y = m.userData.base.y + Math.sin(t * 0.7 + m.userData.ph) * 0.12;
      }));
      // labels follow their molecule clusters
      camera.updateMatrixWorld();
      groups.forEach((g, i) => {
        const d = z - g.position.z;
        const show = d > 2.2 && d < 15;
        const el = tagEls[i];
        el.classList.toggle("is-on", show);
        if (!show) return;
        v3.copy(g.position).project(camera);
        const x = (v3.x * 0.5 + 0.5) * W, y = (-v3.y * 0.5 + 0.5) * H;
        el.style.left = x + "px"; el.style.top = y + "px";
        el.classList.toggle("tag--left", x > W / 2);
      });
    }
    composer.render();
  };
  tick();
}

/* ---------- boot ---------- */
if (webglOK()) {
  try { initFreeze(); } catch (e) { console.warn("3D scene unavailable, using 2D fallback", e); document.body.classList.remove("has-3d"); }
  try { initHero(); } catch (e) { console.warn("Hero 3D unavailable", e); }
}
