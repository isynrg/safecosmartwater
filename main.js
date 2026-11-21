/* Safeco Pro — interactions, scroll effects and 3D hero */
(() => {
  // ---- Config -------------------------------------------------------------
  // Set FORM_ENDPOINT to a form backend (Formspree, Basin, your CRM webhook…)
  // to receive submissions as JSON. Until then, the form opens an email draft.
  const FORM_ENDPOINT = "";
  const CONTACT_EMAIL = "info@safecopro.com";

  const doc = document.documentElement;
  doc.classList.add("js");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  $("#year").textContent = new Date().getFullYear();

  // Progress of a tall "sticky" section: 0 when its top hits the viewport top,
  // 1 when its bottom reaches the viewport bottom.
  const stickyProgress = (el) => {
    const r = el.getBoundingClientRect();
    const dist = r.height - window.innerHeight;
    return dist > 0 ? clamp(-r.top / dist) : 0;
  };

  // ---- Nav -----------------------------------------------------------------
  const nav = $("#nav");
  const toggle = $(".nav__toggle");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
  });
  $$(".nav__links a").forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }));
  const darkSections = $$(".hero, .statement, .zoom, .section--dark, .area");
  let lastY = window.scrollY;
  const progressBar = $(".progress span");

  function onScrollUI() {
    const y = window.scrollY;
    const probe = 26; // middle of the nav bar
    const overDark = darkSections.some((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    nav.classList.toggle("is-light", !overDark);
    if (!nav.classList.contains("is-open")) {
      nav.classList.toggle("is-hidden", y > lastY && y > 400);
    }
    lastY = y;
    const max = doc.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  }

  // ---- Statement: words light up as you scroll -------------------------------
  const statement = $("[data-words]");
  statement.innerHTML = statement.textContent.trim().split(/\s+/)
    .map((w) => `<span class="w">${w}</span>`).join(" ");
  const words = $$(".w", statement);
  function onScrollStatement() {
    const r = statement.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
    const lit = p * words.length;
    words.forEach((w, i) => { w.style.opacity = clamp(0.16 + (lit - i) * 0.84, 0.16, 1); });
  }

  // ---- Zoom section ---------------------------------------------------------
  const zoom = $(".zoom");
  const zoomFrame = $(".zoom__frame");
  const zoomImg = $(".zoom__frame img");
  const zoomCap = $(".zoom__caption");
  function onScrollZoom() {
    const p = stickyProgress(zoom);
    const e = 1 - Math.pow(1 - clamp(p / 0.6), 3); // ease-out over first 60%
    const small = window.innerWidth < 900 ? [82, 50] : [56, 56];
    zoomFrame.style.width = `${small[0] + (100 - small[0]) * e}vw`;
    zoomFrame.style.height = `${small[1] + (100 - small[1]) * e}vh`;
    zoomFrame.style.borderRadius = `${36 * (1 - e)}px`;
    zoomImg.style.transform = `scale(${1.25 - 0.25 * e})`;
    const c = clamp((p - 0.5) / 0.25);
    zoomCap.style.opacity = c;
    zoomCap.style.transform = `translateY(${(1 - c) * 40}px)`;
  }

  // ---- Process: vertical scroll drives horizontal track -----------------------
  const process = $(".process");
  const track = $(".process__track");
  let trackDist = 0;
  function sizeProcess() {
    trackDist = Math.max(0, track.scrollWidth - window.innerWidth);
    process.style.height = `${window.innerHeight + trackDist}px`;
  }
  function onScrollProcess() {
    track.style.transform = `translate3d(${-trackDist * stickyProgress(process)}px,0,0)`;
  }

  // ---- Area parallax --------------------------------------------------------
  const areaBg = $(".area__bg");
  const area = $(".area");
  function onScrollArea() {
    const r = area.getBoundingClientRect();
    const p = clamp((window.innerHeight - r.top) / (window.innerHeight + r.height));
    areaBg.style.transform = `translate3d(0,${(p - 0.5) * -14}%,0) scale(1.05)`;
  }

  // ---- Software device: flatten as it scrolls in ------------------------------
  const device = $(".device");
  const counter = $("[data-count]");
  let counted = false;
  function onScrollDevice() {
    const r = device.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh - r.top) / (vh * 0.9));
    if (window.innerWidth >= 900) {
      device.style.transform = `perspective(1200px) rotateY(${-14 * (1 - p)}deg) rotateX(${8 * (1 - p)}deg) translateY(${(1 - p) * 40}px)`;
    }
    if (p > 0.5 && !counted) {
      counted = true;
      device.classList.add("is-in");
      const target = +counter.dataset.count;
      const t0 = performance.now();
      const tick = (t) => {
        const k = clamp((t - t0) / 1400);
        counter.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  // ---- Hero copy ------------------------------------------------------------
  const hero = $("#hero");
  const heroCopy = $(".hero__copy");
  const cue = $(".scroll-cue");
  let heroP = 0;
  function onScrollHero() {
    heroP = stickyProgress(hero);
    const c = clamp(heroP / 0.45);
    heroCopy.style.opacity = 1 - c;
    heroCopy.style.transform = `translateY(${-c * 80}px) scale(${1 - c * 0.08})`;
    cue.style.opacity = 1 - clamp(heroP / 0.1);
  }

  // ---- Scroll loop ----------------------------------------------------------
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScrollUI();
      if (!reduced) {
        onScrollHero(); onScrollStatement(); onScrollZoom();
        onScrollProcess(); onScrollArea(); onScrollDevice();
      } else {
        onScrollDevice();
      }
      ticking = false;
    });
  }
  function onResize() { if (!reduced) sizeProcess(); onScroll(); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("load", onResize);
  onResize();

  // ---- Reveal-on-scroll + intro ------------------------------------------------
  if (hasGsap && !reduced) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from(".hero__title .line > span", { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.12, delay: 0.15 });
    gsap.to(".hero .reveal", { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, delay: 0.45 });
    ScrollTrigger.batch(".reveal:not(.hero .reveal)", {
      start: "top 88%",
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, overwrite: true }),
    });
  } else {
    $$(".reveal").forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
  }

  // ---- 3D tilt on cards (fine pointers only) ------------------------------------
  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    $$(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = "transform .15s ease-out";
        card.style.transform = `perspective(1400px) rotateX(${-y * 4}deg) rotateY(${x * 5}deg) translateZ(0)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transition = "transform .8s cubic-bezier(.22,1,.36,1)";
        card.style.transform = "";
      });
    });
  }

  // ---- Partner buttons preselect form interest ------------------------------------
  $$("[data-interest]").forEach((b) => b.addEventListener("click", () => {
    const r = $(`.seg input[value="${b.dataset.interest}"]`);
    if (r) r.checked = true;
  }));

  // ---- Contact form ------------------------------------------------------------
  const form = $("#contact-form");
  const status = $(".form__status", form);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let ok = true;
    $$("[required]", form).forEach((f) => {
      const bad = !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value));
      f.closest(".field").classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) { status.textContent = "Please add your name and a valid email."; return; }
    const data = Object.fromEntries(new FormData(form));
    if (FORM_ENDPOINT) {
      status.textContent = "Sending…";
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.textContent = "Thanks — we'll be in touch within one business day.";
      } catch {
        status.textContent = `Something went wrong. Email us at ${CONTACT_EMAIL}.`;
      }
    } else {
      const body = `Interest: ${data.interest}\nName: ${data.name}\nPhone: ${data.phone || "-"}\nEmail: ${data.email}\n\n${data.message || ""}`;
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Website inquiry — ${data.interest}`)}&body=${encodeURIComponent(body)}`;
      status.textContent = "Opening your email app…";
    }
  });

  // =====================================================================
  //  3D HERO — a glass house with HVAC, attic fan, insulation & water
  // =====================================================================
  const canvas = $("#scene");
  if (typeof THREE === "undefined") { doc.classList.add("no-webgl"); return; }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    doc.classList.add("no-webgl");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 14, 34);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

  // Lights
  scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x080810, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(6, 10, 8);
  scene.add(key);
  const blue = new THREE.PointLight(0x2ec5ff, 2.2, 18);
  blue.position.set(-4, 2, 3);
  scene.add(blue);
  const violet = new THREE.PointLight(0x6a5cff, 1.6, 18);
  violet.position.set(5, 3, -3);
  scene.add(violet);

  const world = new THREE.Group();
  scene.add(world);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x9fc9ff, metalness: 0.1, roughness: 0.08, transparent: true, opacity: 0.12,
    clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.DoubleSide, depthWrite: false,
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x7fd6ff, transparent: true, opacity: 0.85 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf2f3f5, roughness: 0.35, metalness: 0.15 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.5, metalness: 0.6 });

  const withEdges = (geo, mat = glassMat) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, mat));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
    return g;
  };

  // House body
  const house = new THREE.Group();
  world.add(house);
  const body = withEdges(new THREE.BoxGeometry(4, 2.4, 3));
  body.position.y = 1.2;
  house.add(body);

  // Roof (triangular prism)
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-2.3, 0); roofShape.lineTo(2.3, 0); roofShape.lineTo(0, 1.6); roofShape.lineTo(-2.3, 0);
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 3.4, bevelEnabled: false });
  roofGeo.translate(0, 0, -1.7);
  const roof = withEdges(roofGeo);
  roof.position.y = 2.4;
  house.add(roof);

  // Insulation layer: soft glowing particles filling the attic floor
  const insCount = 900;
  const insGeo = new THREE.BufferGeometry();
  const insPos = new Float32Array(insCount * 3);
  for (let i = 0; i < insCount; i++) {
    insPos[i * 3] = (Math.random() - 0.5) * 3.8;
    insPos[i * 3 + 1] = 2.42 + Math.random() * 0.28;
    insPos[i * 3 + 2] = (Math.random() - 0.5) * 2.9;
  }
  insGeo.setAttribute("position", new THREE.BufferAttribute(insPos, 3));
  const insMat = new THREE.PointsMaterial({ color: 0xfff1d6, size: 0.06, transparent: true, opacity: 0.85, depthWrite: false });
  house.add(new THREE.Points(insGeo, insMat));

  // Solar attic fan on roof slope
  const fanRoof = new THREE.Group();
  const fanBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.16, 48), darkMat);
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x0a1a3a, roughness: 0.15, metalness: 0.9, emissive: 0x0a2a6a, emissiveIntensity: 0.4 });
  const panel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 48), panelMat);
  panel.position.y = 0.1;
  const roofFanBlades = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.01, 0.07), whiteMat);
    blade.position.x = 0.17;
    const holder = new THREE.Group();
    holder.rotation.y = (i / 5) * Math.PI * 2;
    holder.add(blade);
    roofFanBlades.add(holder);
  }
  roofFanBlades.position.y = 0.14;
  fanRoof.add(fanBase, panel, roofFanBlades);
  const slope = Math.atan2(1.6, 2.3);
  fanRoof.position.set(1.05, 2.4 + 0.85, 0.5);
  fanRoof.rotation.z = -slope;
  house.add(fanRoof);

  // HVAC condenser next to the house
  const condenser = new THREE.Group();
  const cBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.0), whiteMat);
  cBox.position.y = 0.55;
  const grille = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 12, 48), darkMat);
  grille.position.set(0, 0.6, 0.51);
  const hvacBlades = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.02), darkMat);
    b.position.x = 0.16;
    const h = new THREE.Group();
    h.rotation.z = (i / 4) * Math.PI * 2;
    h.add(b);
    hvacBlades.add(h);
  }
  hvacBlades.position.set(0, 0.6, 0.5);
  condenser.add(cBox, grille, hvacBlades);
  condenser.position.set(3.2, 0, 0.6);
  condenser.rotation.y = -0.35;
  world.add(condenser);

  // Water droplet (lathe) floating on the other side
  const dropPts = [];
  // Teardrop: pointed at the top, round at the bottom
  for (let i = 0; i <= 32; i++) {
    const a = (i / 32) * Math.PI;
    dropPts.push(new THREE.Vector2(Math.max(0.0001, Math.sin(a) * Math.sin(a / 2) * 0.55), Math.cos(a) * 0.7));
  }
  dropPts.reverse();
  const dropGeo = new THREE.LatheGeometry(dropPts, 48);
  const dropMat = new THREE.MeshPhysicalMaterial({
    color: 0x2ec5ff, metalness: 0, roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.8,
    emissive: 0x0a4a8a, emissiveIntensity: 0.35,
  });
  const drop = new THREE.Mesh(dropGeo, dropMat);
  drop.position.set(-3.3, 1.6, 0.8);
  world.add(drop);

  // Cool-air flow: particles streaming from the condenser into the house and circulating
  const airCount = 420;
  const airGeo = new THREE.BufferGeometry();
  const airPos = new Float32Array(airCount * 3);
  const airSeed = new Float32Array(airCount);
  for (let i = 0; i < airCount; i++) airSeed[i] = Math.random();
  airGeo.setAttribute("position", new THREE.BufferAttribute(airPos, 3));
  const airMat = new THREE.PointsMaterial({ color: 0x7fe3ff, size: 0.055, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const air = new THREE.Points(airGeo, airMat);
  world.add(air);
  const airCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(3.2, 0.6, 0.6),
    new THREE.Vector3(2.2, 0.4, 0.9),
    new THREE.Vector3(1.2, 0.9, 0.6),
    new THREE.Vector3(-0.5, 1.6, 0.9),
    new THREE.Vector3(-1.4, 1.2, -0.6),
    new THREE.Vector3(0.2, 0.6, -0.9),
    new THREE.Vector3(1.3, 1.8, 0.0),
    new THREE.Vector3(-0.8, 2.0, 0.3),
  ], true, "catmullrom", 0.5);

  // Ground: glowing ring + grid floor
  const ring = new THREE.Mesh(new THREE.RingGeometry(4.6, 4.64, 128), new THREE.MeshBasicMaterial({ color: 0x2ec5ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  world.add(ring);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4.6, 96), new THREE.MeshStandardMaterial({ color: 0x0a0c12, roughness: 0.3, metalness: 0.8, transparent: true, opacity: 0.85 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  world.add(floor);
  const grid = new THREE.GridHelper(9.2, 23, 0x1d3550, 0x101a28);
  grid.material.transparent = true;
  grid.material.opacity = 0.5;
  world.add(grid);

  // Ambient star dust
  const dustGeo = new THREE.BufferGeometry();
  const dust = new Float32Array(600 * 3);
  for (let i = 0; i < 600; i++) {
    dust[i * 3] = (Math.random() - 0.5) * 40;
    dust[i * 3 + 1] = Math.random() * 18 - 3;
    dust[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dust, 3));
  scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x5a7aa0, size: 0.04, transparent: true, opacity: 0.6 })));

  // Sizing
  function resize3D() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize3D);
  resize3D();

  // Pointer parallax
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // Pause rendering when the hero is off screen
  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0 }).observe(hero);

  const tmp = new THREE.Vector3();
  const clock = new THREE.Clock();
  let smoothP = 0;

  function frame() {
    const t = clock.getElapsedTime();
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    smoothP += (heroP - smoothP) * 0.08;

    const narrow = camera.aspect < 0.9;
    // Camera: starts low & far (house under the headline), swings around and in as you scroll
    const ang = 0.55 + smoothP * 1.6 + pointer.x * 0.12;
    const radius = (narrow ? 19 : 14) - smoothP * (narrow ? 5 : 3);
    const height = 3.2 + smoothP * 3.5 - pointer.y * 0.4;
    camera.position.set(Math.sin(ang) * radius, height, Math.cos(ang) * radius);
    // Early on, aim the camera above the house so it sits in the lower part of the frame, under the headline
    camera.lookAt(0, 1.1 + (1 - smoothP) * (narrow ? 5.2 : 3.4), 0);

    world.position.y = 0;
    world.rotation.y = t * 0.05;

    roofFanBlades.rotation.y = t * 6;
    hvacBlades.rotation.z = -t * 9;
    drop.position.y = 1.6 + Math.sin(t * 1.4) * 0.18;
    drop.rotation.y = t * 0.6;
    ring.material.opacity = 0.25 + Math.sin(t * 2) * 0.1;
    insMat.opacity = 0.35 + smoothP * 0.6;

    const pos = airGeo.attributes.position.array;
    for (let i = 0; i < airCount; i++) {
      const u = (airSeed[i] + t * 0.06) % 1;
      airCurve.getPointAt(u, tmp);
      const s = airSeed[i] * 6.283;
      pos[i * 3] = tmp.x + Math.sin(s + t) * 0.12;
      pos[i * 3 + 1] = tmp.y + Math.cos(s * 1.3 + t) * 0.12;
      pos[i * 3 + 2] = tmp.z + Math.sin(s * 0.7 + t) * 0.12;
    }
    airGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  if (reduced) {
    frame();
  } else {
    renderer.setAnimationLoop(() => { if (visible) frame(); });
  }
})();
