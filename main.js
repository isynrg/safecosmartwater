/* ==========================================================
   SafeCo SmartWater — interactions
   ========================================================== */
(() => {
  "use strict";

  // ---- CONFIG -------------------------------------------------------------
  // Paste your CRM / form webhook URL here (e.g. Zapier, Make, HubSpot, GoHighLevel).
  // Leads are POSTed as JSON. Leave empty to show the confirmation + call prompt only.
  const LEAD_ENDPOINT = window.SAFECO_LEAD_ENDPOINT || "";
  const EWG_SEARCH = (zip) => `https://www.ewg.org/tapwater/search-results.php?zip5=${zip}&searchtype=zip`;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");

  // ---- DATA ---------------------------------------------------------------
  const CONTAMINANTS = [
    { key: "chlorine", mpos: [-0.55, -0.75], name: "Chlorine & Chloramine", short: "Disinfectant · pool taste & smell", color: "#b8f36b", src: "treatment", shape: "circle", pos: [-0.66, -0.34],
      what: "Disinfectants added at the treatment plant to kill bacteria on the way to your home.",
      why: "Responsible for the \"pool\" taste and smell, and can leave skin and hair feeling dry after a shower.",
      legal: "4 ppm", goal: "4 ppm (EPA goal)", fix: "Reduced by: Carbon stage" },
    { key: "tthm", mpos: [0.55, -0.55], name: "TTHMs", short: "Disinfection byproduct · cancer risk", color: "#ffb547", src: "treatment", shape: "tri", pos: [0.36, -0.52],
      what: "Total trihalomethanes form when chlorine reacts with natural organic matter in the water.",
      why: "Long-term exposure is linked to increased cancer risk and may harm pregnancy outcomes.",
      legal: "80 ppb", goal: "0.15 ppb", fix: "Reduced by: Carbon + RO" },
    { key: "haa", mpos: [-0.55, -0.35], name: "Haloacetic Acids", short: "Disinfection byproduct", color: "#ff8f3f", src: "treatment", shape: "hex", pos: [-0.3, -0.02],
      what: "Another family of disinfection byproducts (HAA5) created during chlorination.",
      why: "Associated with increased cancer risk over years of exposure.",
      legal: "60 ppb", goal: "0.1 ppb", fix: "Reduced by: Carbon + RO" },
    { key: "cr6", mpos: [0.55, -0.15], name: "Chromium-6", short: "Likely carcinogen", color: "#ffd84a", src: "environment", shape: "star", pos: [0.7, -0.3],
      what: "An industrial pollutant that also occurs naturally in some groundwater. The \"Erin Brockovich\" chemical.",
      why: "Considered a likely human carcinogen when ingested. There's no federal limit specific to chromium-6.",
      legal: "No specific limit", goal: "0.02 ppb", fix: "Reduced by: Reverse osmosis" },
    { key: "nitrate", mpos: [-0.55, 0.05], name: "Nitrate", short: "Fertilizer runoff", color: "#b388ff", src: "environment", shape: "tri", pos: [-0.76, 0.12],
      what: "Runs off farm fields and lawns, and leaks from septic systems into source water.",
      why: "Dangerous for infants under 6 months; long-term exposure is linked to some cancers.",
      legal: "10 ppm", goal: "0.14 ppm", fix: "Reduced by: Reverse osmosis" },
    { key: "lead", mpos: [0.55, 0.25], name: "Lead", short: "From aging pipes · no safe level", color: "#c3ccd6", src: "pipes", shape: "heavy", pos: [0.14, 0.14],
      what: "Leaches from older service lines, solder and brass fixtures after water leaves the plant.",
      why: "There is no known safe level, especially for children. It affects brain development.",
      legal: "15 ppb action level", goal: "0 (EPA goal)", fix: "Reduced by: Reverse osmosis" },
    { key: "pfas", mpos: [0.55, 0.65], name: "PFAS", short: "\"Forever chemicals\"", color: "#ff5fa2", src: "environment", shape: "chain", pos: [0.58, 0.3],
      what: "Thousands of man-made chemicals from nonstick, stain-resistant and firefighting products.",
      why: "Linked to cancers, thyroid disease and immune effects. They don't break down in the body or environment.",
      legal: "4 ppt (PFOA/PFOS)", goal: "1 ppt (total)", fix: "Reduced by: Reverse osmosis" },
    { key: "arsenic", mpos: [-0.55, 0.45], name: "Arsenic", short: "Naturally occurring toxin", color: "#ff4d4d", src: "environment", shape: "diamond", pos: [-0.44, 0.32],
      what: "Found naturally in rock and soil, and from past industrial and agricultural use.",
      why: "Long-term exposure is linked to skin, bladder and lung cancer.",
      legal: "10 ppb", goal: "0.004 ppb", fix: "Reduced by: Reverse osmosis" },
    { key: "micro", mpos: [-0.55, 0.85], name: "Microplastics", short: "Plastic fragments", color: "#7cf5c4", src: "pipes", shape: "shard", pos: [0.0, 0.4],
      what: "Tiny plastic fragments shed from packaging, synthetic fabrics and plastic plumbing.",
      why: "Now found in human blood and tissue. Health effects are still being actively studied.",
      legal: "Not regulated", goal: "Not established", fix: "Reduced by: Reverse osmosis" },
    { key: "hard", mpos: [0.55, -0.95], name: "Calcium & Magnesium", short: "Hardness · scale buildup", color: "#e8f7fb", src: "environment", shape: "square", pos: [-0.12, -0.62],
      what: "Dissolved minerals from limestone. North Texas water is naturally hard.",
      why: "Not a health hazard, but it builds scale that clogs fixtures, spots glass and shortens appliance life.",
      legal: "Not regulated", goal: "Under 1 gpg = soft", fix: "Removed by: Softener" },
  ];

  const STAGES = [
    { name: "Water Softener", where: "Stage 1 · Whole home, where water enters",
      body: "A 48,000-grain softener with the SafeCo ProValve digital control valve and 50 lbs of high-capacity resin. It removes the calcium and magnesium that leave scale on fixtures, spots on glass and crust inside your water heater.",
      tags: ["Hardness", "Scale buildup", "Spotting", "Soap scum", "Dry skin & hair"] },
    { name: "Coconut-Shell Carbon", where: "Stage 2 · Whole home, every faucet & shower",
      body: "15 lbs of coconut-shell activated carbon in a 10\" × 54\" media tank. It reduces chlorine, chloramine and the chemical taste and smell, so every shower and every faucet in the house benefits.",
      tags: ["Chlorine", "Chloramine", "Taste & odor", "Disinfection byproducts"] },
    { name: "Reverse Osmosis", where: "Stage 3 · Kitchen drinking-water tap",
      body: "A multi-stage reverse osmosis system under your kitchen sink forces water through a membrane fine enough to reduce dissolved contaminants in the water you drink and cook with.",
      tags: ["Lead", "Arsenic", "Nitrate", "PFAS", "Chromium-6", "Microplastics", "TDS"] },
    { name: "Alkaline Remineralization", where: "Stage 4 · Kitchen drinking-water tap",
      body: "After RO, a remineralization filter adds back healthy calcium and magnesium for balanced pH and a crisp, clean taste your family will actually want to drink.",
      tags: ["Healthy minerals", "Balanced pH", "Better taste"] },
  ];

  const NEWS = [
    { src: "EPA", date: "Apr 2024", title: "EPA sets first-ever national drinking water limits for PFAS",
      body: "The rule sets enforceable limits of 4 parts per trillion for PFOA and PFOS. Utilities have years to comply, so many homes are still exposed today.",
      url: "https://www.epa.gov/sdwa/and-polyfluoroalkyl-substances-pfas" },
    { src: "USGS", date: "Jul 2023", title: "Nearly half of U.S. tap water may contain \"forever chemicals\"",
      body: "A federal study sampling taps nationwide estimated at least 45% contain one or more PFAS, in both private wells and public supplies.",
      url: "https://www.usgs.gov/news/national-news-release/tap-water-study-detects-pfas-forever-chemicals-across-us" },
    { src: "EPA", date: "Oct 2024", title: "New rule: lead pipes must be replaced within 10 years",
      body: "The Lead and Copper Rule Improvements also lower the lead action level to 10 ppb. Until a line is replaced, the risk is in the pipes.",
      url: "https://www.epa.gov/ground-water-and-drinking-water/lead-and-copper-rule-improvements" },
    { src: "EWG", date: "Updated regularly", title: "Tap Water Database: see your utility's test results",
      body: "Independent analysis of utility test data, compared against health-based guidelines rather than just legal limits.",
      url: "https://www.ewg.org/tapwater/" },
    { src: "EPA", date: "Regulation", title: "Disinfection byproducts: the trade-off in treated water",
      body: "Chlorine keeps water safe from bacteria, but creates TTHMs and haloacetic acids that the EPA regulates because of long-term health risks.",
      url: "https://www.epa.gov/dwreginfo/stage-1-and-stage-2-disinfectants-and-disinfection-byproducts-rules" },
    { src: "USGS", date: "Water Science", title: "Hard water: why your fixtures keep getting crusty",
      body: "How calcium and magnesium get into your water, how hardness is measured, and why much of Texas falls into the \"hard\" range.",
      url: "https://www.usgs.gov/special-topics/water-science-school/science/hardness-water" },
  ];

  window.SAFECO = { CONTAMINANTS };

  // ---- INTRO --------------------------------------------------------------
  const intro = $("#intro");
  const endIntro = () => {
    intro.classList.add("is-done");
    document.body.classList.remove("is-loading");
    setTimeout(() => $$(".hero [data-reveal], .hero [data-split]").forEach((el) => el.classList.add("is-in")), 250);
  };
  setTimeout(endIntro, reduceMotion ? 300 : 2900);
  intro.addEventListener("click", endIntro);

  // ---- SPLIT HEADINGS -----------------------------------------------------
  $$("[data-split]").forEach((el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement("span"); w.className = "w";
            const i = document.createElement("span"); i.textContent = part;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(el);
    $$(".w > span", el).forEach((s, i) => (s.style.transitionDelay = `${i * 70}ms`));
  });

  // ---- RENDER: contaminant cards, stages, news ----------------------------
  const srcLabel = { treatment: "From treatment", pipes: "From pipes", environment: "From the environment" };
  $("#cgrid").innerHTML = CONTAMINANTS.map((c, i) => `
    <article class="ccard" data-src="${c.src}" data-reveal data-tilt style="--c:${c.color === "#e8f7fb" ? "#9fd3e6" : c.color};transition-delay:${(i % 3) * 80}ms">
      <div class="ccard__top"><span class="ccard__src">${srcLabel[c.src]}</span><span class="ccard__ico"><i></i></span></div>
      <h3>${c.name}</h3>
      <p>${c.what}</p>
      <p><strong>Why it matters:</strong> ${c.why}</p>
      <div class="ccard__limits">
        <div><small>Legal limit</small><b>${c.legal}</b></div>
        <div class="ewg"><small>Health guideline</small><b>${c.goal}</b></div>
      </div>
      <span class="ccard__fix">${c.fix}</span>
    </article>`).join("");

  $$(".chip").forEach((chip) => chip.addEventListener("click", () => {
    $$(".chip").forEach((c) => c.classList.toggle("is-on", c === chip));
    const f = chip.dataset.filter;
    $$(".ccard").forEach((card) => card.classList.toggle("is-hidden", f !== "all" && card.dataset.src !== f));
  }));

  const panel = $("#stagePanel");
  const showStage = (i) => {
    const s = STAGES[i];
    panel.innerHTML = `<span class="where">${s.where}</span><h3>${s.name}</h3><p>${s.body}</p><ul>${s.tags.map((t) => `<li>${t}</li>`).join("")}</ul>`;
    panel.classList.remove("anim"); void panel.offsetWidth; panel.classList.add("anim");
    $$(".stab").forEach((b, j) => { b.classList.toggle("is-on", j === i); b.setAttribute("aria-selected", j === i); });
  };
  $$(".stab").forEach((b) => b.addEventListener("click", () => { showStage(+b.dataset.stage); stageAuto = false; }));
  showStage(0);
  let stageAuto = true, stageIdx = 0;
  setInterval(() => {
    if (!stageAuto || !isVisible($("#system"))) return;
    stageIdx = (stageIdx + 1) % STAGES.length; showStage(stageIdx);
  }, 5200);

  $("#newsGrid").innerHTML = NEWS.map((n, i) => `
    <a class="ncard" href="${n.url}" target="_blank" rel="noopener" data-reveal data-tilt style="transition-delay:${(i % 3) * 90}ms">
      <div class="ncard__meta"><span>${n.src}</span><span>${n.date}</span></div>
      <div><h4>${n.title}</h4><p>${n.body}</p></div>
      <span class="ncard__go">Read the source</span>
    </a>`).join("");

  // ---- REVEAL -------------------------------------------------------------
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  $$("[data-reveal], [data-split]").forEach((el) => { if (!el.closest(".hero")) io.observe(el); });

  function isVisible(el) { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }

  // ---- JOURNEY miles counter ---------------------------------------------
  const stepIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      $("#journeyMiles").textContent = e.target.dataset.n;
      $("#journeyStage").textContent = e.target.dataset.stage;
    });
  }, { threshold: 0.6 });
  $$(".step").forEach((s) => stepIO.observe(s));

  // ---- CALCULATOR ---------------------------------------------------------
  const people = $("#people");
  const updateCalc = () => {
    const n = +people.value;
    $("#peopleOut").textContent = n;
    $("#galYear").textContent = fmt(n * 82 * 365);
    $("#glassYear").textContent = fmt(n * 4 * 365);
    $("#showerYear").textContent = fmt(n * 365);
  };
  people.addEventListener("input", updateCalc); updateCalc();

  // ---- ZIP → EWG ----------------------------------------------------------
  $("#zipForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const zip = $("#zip").value.trim();
    const msg = $("#zipMsg");
    if (!/^\d{5}$/.test(zip)) { msg.textContent = "Please enter a valid 5-digit ZIP code."; return; }
    msg.textContent = `Opening EWG results for ${zip} in a new tab…`;
    window.open(EWG_SEARCH(zip), "_blank", "noopener");
    const bookZip = $("#bookForm [name=zip]"); if (bookZip && !bookZip.value) bookZip.value = zip;
  });

  // ---- BOOKING FORM -------------------------------------------------------
  const form = $("#bookForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    let ok = true;
    const bad = (name, cond) => { const el = form.elements[name]; el.classList.toggle("is-bad", !cond); if (!cond) ok = false; };
    bad("name", data.name.trim().length > 1);
    bad("phone", data.phone.replace(/\D/g, "").length >= 10);
    bad("zip", /^\d{5}$/.test(data.zip.trim()));
    if (data.email) bad("email", /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email));
    if (!ok) { form.querySelector(".is-bad")?.focus(); return; }

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Sending…";
    data.source = "safeco-smartwater-website"; data.submittedAt = new Date().toISOString(); data.page = location.href;
    let sent = false;
    if (LEAD_ENDPOINT) {
      try {
        const res = await fetch(LEAD_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        sent = res.ok;
      } catch (_) { sent = false; }
    }
    const first = data.name.trim().split(/\s+/)[0];
    $("#doneMsg").textContent = sent
      ? `Thanks, ${first}! A SafeCo coordinator will call you (${data.time.toLowerCase()}) to schedule your free test. Want it sooner?`
      : `Thanks, ${first}! To lock in your free water test, give us a quick call. We're available Mon–Fri, 8 AM–5 PM.`;
    $("#formDone").hidden = false;
  });

  // ---- NAV / MOBILE CTA / RAIL -------------------------------------------
  const nav = $("#nav"), mcta = $("#mcta"), railFill = $("#railFill"), railLabel = $("#railLabel");
  const chapters = $$("[data-chapter]");
  let lastY = 0;

  // ---- PARALLAX -----------------------------------------------------------
  const parallax = $$("[data-parallax]");

  // ---- HERO CAUSTICS ------------------------------------------------------
  const cv = $("#caustics"), cx = cv.getContext("2d");
  const CW = 160, CH = 90; cv.width = CW; cv.height = CH;
  const cImg = cx.createImageData(CW, CH);
  const drawCaustics = (t) => {
    const d = cImg.data;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      const v = Math.abs(Math.sin(x * 0.09 + t) + Math.sin(y * 0.13 - t * 0.8) + Math.sin((x * 0.6 + y) * 0.07 + t * 1.3) + Math.sin(Math.hypot(x - 80, y - 40) * 0.1 - t));
      const k = Math.pow(Math.max(0, 1 - v * 0.9), 3);
      const i = (y * CW + x) * 4;
      d[i] = 90 * k; d[i + 1] = 220 * k; d[i + 2] = 255 * k; d[i + 3] = 255 * k;
    }
    cx.putImageData(cImg, 0, 0);
  };

  // ==========================================================================
  //  FREEZE → ZOOM → MICROSCOPE SCENE
  // ==========================================================================
  const freeze = $("#freeze"), stage = $("#freezeStage"), faucet = $("#faucet");
  const sc = $("#streamCanvas"), sx = sc.getContext("2d");
  const micro = $("#micro"), mc = $("#microCanvas"), mx = mc.getContext("2d");
  const frost = $("#frost"), flowBar = $("#flowBar"), tempRead = $("#tempRead"), zoomRead = $("#zoomRead");
  const caps = $$(".cap");
  const tagsWrap = $("#microTags");
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let W = 0, H = 0, noz = { x: 0, y: 0, s: 1 };
  let flowT = 0, prog = 0, f = 0, z = 0, m = 0;
  const drops = [];
  const cracks = [];
  const sparks = [];

  // tags
  const thresholds = CONTAMINANTS.map((_, i) => 0.6 + i * 0.033);
  tagsWrap.innerHTML = CONTAMINANTS.map((c) => `
    <div class="tag" style="--c:${c.color}">
      <div class="tag__dot"></div><div class="tag__line"></div>
      <div class="tag__card"><b>${c.name}</b><small>${c.short}</small></div>
    </div>`).join("");
  const tagEls = $$(".tag", tagsWrap);

  // micro particles
  let particles = [], water = [];
  const rand = (a, b) => a + Math.random() * (b - a);
  const buildMicro = () => {
    particles = [];
    CONTAMINANTS.forEach((c, ci) => {
      const n = c.key === "hard" ? 9 : c.key === "micro" ? 6 : 7;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.13;
        particles.push({ ci, c, ox: Math.cos(a) * r, oy: Math.sin(a) * r, size: rand(4, 9) * (c.key === "lead" ? 1.25 : 1),
          ph: Math.random() * 6.28, sp: rand(0.3, 0.8), rot: Math.random() * 6.28, vr: rand(-0.6, 0.6) });
      }
    });
    water = Array.from({ length: 70 }, () => ({ x: rand(-1, 1), y: rand(-1, 1), r: rand(6, 26), ph: Math.random() * 6.28, sp: rand(0.05, 0.2) }));
  };

  const lensGeom = () => {
    const narrow = W < 700;
    const rx = Math.min(W, H) * 0.42;
    return { rx, ry: narrow ? H * 0.34 : rx, cx: W / 2, cy: narrow ? H * 0.46 : H / 2, narrow };
  };
  const meter = $(".freeze__meter");
  const measure = () => {
    W = innerWidth; H = innerHeight;
    [sc, mc].forEach((c) => { c.width = W * DPR; c.height = H * DPR; c.style.width = W + "px"; c.style.height = H + "px"; });
    sx.setTransform(DPR, 0, 0, DPR, 0, 0); mx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const prev = stage.style.transform; stage.style.transform = "none";
    const r = faucet.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const s = Math.min(r.width, r.height) / 1000, ox = (r.width - 1000 * s) / 2;
    noz = { x: r.left - sr.left + ox + 520 * s, y: r.top - sr.top + 330 * s, s };
    stage.style.transform = prev;
    // ice cracks & sparkles in stream space (normalized)
    cracks.length = 0; sparks.length = 0;
    for (let i = 0; i < 26; i++) cracks.push({ y: Math.random(), x: rand(-0.4, 0.4), len: rand(0.02, 0.08), a: rand(-1.2, 1.2) });
    for (let i = 0; i < 40; i++) sparks.push({ y: Math.random(), x: rand(-0.6, 0.6), ph: Math.random() * 6.28, s: rand(1.5, 4) });
    // place tags (ellipse layout on narrow screens so labels have room)
    const g = lensGeom();
    const leftAt = W < 700 ? 0.05 : 0.6;
    CONTAMINANTS.forEach((c, i) => {
      c.p = g.narrow ? c.mpos : c.pos;
      tagEls[i].style.left = g.cx + c.p[0] * g.rx + "px"; tagEls[i].style.top = g.cy + c.p[1] * g.ry + "px";
      tagEls[i].classList.toggle("tag--left", c.p[0] > leftAt);
    });
  };

  const drawStream = (t, dt) => {
    sx.clearRect(0, 0, W, H);
    const top = noz.y, bot = H * 0.9, len = bot - top, ws = 30 * noz.s * (W < 700 ? 1.4 : 1);
    const amp = 1 - f;
    const cxs = noz.x;
    const edge = (y, side) => {
      const k = (y - top) / len;
      const w = ws * (1 - 0.32 * k) / 2;
      const wob = (Math.sin(y * 0.035 - flowT * 9) * 1.6 + Math.sin(y * 0.012 - flowT * 4) * 1.2) * amp * (0.3 + k);
      const jag = f > 0 ? (Math.sin(y * 0.6) * 0.9 + Math.sin(y * 1.7) * 0.6) * f * (1 + k) : 0;
      return cxs + side * (w + jag) + wob;
    };
    // glow
    sx.save();
    sx.shadowColor = `rgba(${lerp(58, 200, f)},${lerp(214, 240, f)},255,${0.5 + f * 0.3})`;
    sx.shadowBlur = 24 + f * 30;
    sx.beginPath();
    for (let y = top; y <= bot; y += 5) sx.lineTo(edge(y, -1), y);
    for (let y = bot; y >= top; y -= 5) sx.lineTo(edge(y, 1), y);
    sx.closePath();
    const g = sx.createLinearGradient(cxs - ws, 0, cxs + ws, 0);
    g.addColorStop(0, `rgba(${lerp(90, 210, f)},${lerp(200, 238, f)},255,${lerp(0.55, 0.95, f)})`);
    g.addColorStop(0.35, `rgba(255,255,255,${lerp(0.25, 0.85, f)})`);
    g.addColorStop(0.55, `rgba(${lerp(140, 230, f)},${lerp(225, 248, f)},255,${lerp(0.35, 0.9, f)})`);
    g.addColorStop(1, `rgba(${lerp(60, 170, f)},${lerp(170, 220, f)},240,${lerp(0.6, 0.95, f)})`);
    sx.fillStyle = g; sx.fill();
    sx.restore();

    // flowing highlights (slow down as it freezes)
    sx.save(); sx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 14; i++) {
      const p = ((i / 14 + flowT * 0.9) % 1);
      const y = top + p * len, h = 30 + (i % 3) * 18;
      sx.strokeStyle = `rgba(255,255,255,${0.35 * (1 - f * 0.6)})`;
      sx.lineWidth = 1.4;
      sx.beginPath(); sx.moveTo(edge(y, -1) + ws * 0.22, y); sx.lineTo(edge(y + h, -1) + ws * 0.22, y + h); sx.stroke();
    }
    sx.restore();

    // ice: cracks + sparkles
    if (f > 0.02) {
      sx.save();
      sx.strokeStyle = `rgba(255,255,255,${0.55 * f})`; sx.lineWidth = 1;
      cracks.forEach((c) => {
        const y = top + c.y * len, x = cxs + c.x * ws;
        sx.beginPath(); sx.moveTo(x, y); sx.lineTo(x + Math.cos(c.a) * c.len * len * 0.3, y + Math.sin(c.a) * c.len * len); sx.stroke();
      });
      sparks.forEach((s) => {
        const y = top + s.y * len, x = cxs + s.x * ws;
        const a = f * (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + s.ph)));
        sx.fillStyle = `rgba(255,255,255,${a})`;
        sx.beginPath(); sx.moveTo(x, y - s.s * 2); sx.lineTo(x + s.s * 0.4, y); sx.lineTo(x, y + s.s * 2); sx.lineTo(x - s.s * 0.4, y); sx.fill();
        sx.beginPath(); sx.moveTo(x - s.s * 2, y); sx.lineTo(x, y + s.s * 0.4); sx.lineTo(x + s.s * 2, y); sx.lineTo(x, y - s.s * 0.4); sx.fill();
      });
      sx.restore();
    }

    // pool + ripples
    const poolW = ws * 7;
    sx.save();
    const pg = sx.createRadialGradient(cxs, bot, 0, cxs, bot, poolW);
    pg.addColorStop(0, `rgba(${lerp(120, 220, f)},${lerp(220, 245, f)},255,${0.35 + f * 0.3})`);
    pg.addColorStop(1, "rgba(58,214,224,0)");
    sx.fillStyle = pg; sx.beginPath(); sx.ellipse(cxs, bot, poolW, poolW * 0.18, 0, 0, Math.PI * 2); sx.fill();
    for (let i = 0; i < 4; i++) {
      const p = (i / 4 + flowT * 0.5) % 1;
      sx.strokeStyle = `rgba(${lerp(150, 235, f)},240,255,${(1 - p) * 0.5})`; sx.lineWidth = 1.2;
      sx.beginPath(); sx.ellipse(cxs, bot, ws * 0.6 + p * poolW, (ws * 0.6 + p * poolW) * 0.18, 0, 0, Math.PI * 2); sx.stroke();
    }
    sx.restore();

    // splash droplets — they hang mid-air when time stops
    const ts = 1 - f;
    if (ts > 0.15 && Math.random() < 0.6 * ts) {
      drops.push({ x: cxs + rand(-ws * 0.4, ws * 0.4), y: bot - 2, vx: rand(-120, 120), vy: rand(-260, -90), r: rand(1.5, 3.5) });
    }
    if (drops.length > 140) drops.splice(0, drops.length - 140);
    sx.save();
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.vy += 900 * dt * ts; d.x += d.vx * dt * ts; d.y += d.vy * dt * ts;
      if (d.y > bot + 6 && ts > 0.05) { drops.splice(i, 1); continue; }
      sx.fillStyle = `rgba(${lerp(170, 240, f)},${lerp(235, 250, f)},255,${0.8})`;
      sx.shadowColor = "rgba(160,240,255,.8)"; sx.shadowBlur = 6 + f * 8;
      sx.beginPath(); sx.arc(d.x, d.y, d.r * (1 + f * 0.4), 0, Math.PI * 2); sx.fill();
    }
    sx.restore();
  };

  const drawShape = (ctx, shape, s) => {
    ctx.beginPath();
    switch (shape) {
      case "circle": ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2); break;
      case "tri": ctx.moveTo(0, -s); ctx.lineTo(s * 0.87, s * 0.5); ctx.lineTo(-s * 0.87, s * 0.5); ctx.closePath(); break;
      case "hex": for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.lineTo(Math.cos(a) * s * 0.85, Math.sin(a) * s * 0.85); } ctx.closePath(); break;
      case "star": for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r = i % 2 ? s * 0.45 : s; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); break;
      case "diamond": ctx.moveTo(0, -s); ctx.lineTo(s * 0.6, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.6, 0); ctx.closePath(); break;
      case "square": ctx.rect(-s * 0.6, -s * 0.6, s * 1.2, s * 1.2); break;
      case "heavy": ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2); break;
      case "shard": ctx.moveTo(-s, -s * 0.3); ctx.lineTo(s * 0.2, -s * 0.8); ctx.lineTo(s, s * 0.1); ctx.lineTo(-s * 0.1, s * 0.7); ctx.closePath(); break;
      case "chain": ctx.moveTo(-s * 1.4, 0); for (let i = 1; i <= 6; i++) ctx.lineTo(-s * 1.4 + i * s * 0.47, i % 2 ? -s * 0.4 : s * 0.4); break;
    }
  };

  const drawMicro = (t) => {
    mx.clearRect(0, 0, W, H);
    const { rx, ry, cx: cxm, cy: cym, narrow } = lensGeom(), R = narrow ? rx * 0.55 : rx;
    const zoomIn = lerp(1.6, 1, smooth(0.48, 0.66, prog));
    mx.save();
    mx.translate(cxm, cym); mx.scale(zoomIn, zoomIn); mx.translate(-cxm, -cym);
    const bg = mx.createRadialGradient(cxm, cym, 0, cxm, cym, Math.max(W, H) * 0.7);
    bg.addColorStop(0, "#0e4660"); bg.addColorStop(0.55, "#072538"); bg.addColorStop(1, "#02070d");
    mx.fillStyle = bg; mx.fillRect(0, 0, W, H);
    // water molecules / bokeh
    water.forEach((w) => {
      const x = cxm + (w.x + Math.sin(t * w.sp + w.ph) * 0.05) * rx * 1.1, y = cym + (w.y + Math.cos(t * w.sp + w.ph) * 0.05) * ry * 1.1;
      const g = mx.createRadialGradient(x, y, 0, x, y, w.r);
      g.addColorStop(0, "rgba(120,230,255,.12)"); g.addColorStop(1, "rgba(120,230,255,0)");
      mx.fillStyle = g; mx.beginPath(); mx.arc(x, y, w.r, 0, Math.PI * 2); mx.fill();
    });
    // contaminants pop in by threshold
    particles.forEach((p) => {
      const appear = smooth(thresholds[p.ci] - 0.02, thresholds[p.ci] + 0.02, prog);
      if (appear <= 0) return;
      const c = p.c;
      const x = cxm + (c.p[0] + Math.sin(t * p.sp + p.ph) * 0.02) * rx + p.ox * R;
      const y = cym + (c.p[1] + Math.cos(t * p.sp * 0.8 + p.ph) * 0.02) * ry + p.oy * R;
      mx.save();
      mx.translate(x, y); mx.rotate(p.rot + t * p.vr); mx.scale(appear, appear);
      mx.shadowColor = c.color; mx.shadowBlur = 14;
      drawShape(mx, c.shape, p.size);
      if (c.shape === "chain") { mx.strokeStyle = c.color; mx.lineWidth = 2.4; mx.lineJoin = "round"; mx.stroke(); }
      else { mx.fillStyle = c.color; mx.globalAlpha = 0.9; mx.fill(); mx.globalAlpha = 1; mx.strokeStyle = "rgba(255,255,255,.5)"; mx.lineWidth = 0.8; mx.stroke(); }
      mx.restore();
    });
    mx.restore();
  };

  const updateFreeze = () => {
    const r = freeze.getBoundingClientRect();
    prog = clamp(-r.top / (r.height - innerHeight));
    f = smooth(0.14, 0.36, prog);
    z = smooth(0.36, 0.56, prog);
    m = smooth(0.48, 0.6, prog);
    const scale = 1 + Math.pow(z, 2.4) * 28;
    const oy = noz.y + (H * 0.9 - noz.y) * 0.45;
    stage.style.transformOrigin = `${noz.x}px ${oy}px`;
    stage.style.transform = `scale(${scale})`;
    stage.style.filter = z > 0.01 ? `blur(${z * z * 6}px)` : "none";
    stage.style.opacity = 1 - m;
    micro.style.opacity = m;
    if (W < 700) meter.style.opacity = 1 - m;
    frost.style.opacity = f * 0.95;
    flowBar.style.width = (1 - f) * 100 + "%";
    tempRead.textContent = Math.round(lerp(68, 28, f)) + "°F";
    const zoomVal = Math.pow(10, smooth(0.36, 0.66, prog) * 4);
    zoomRead.textContent = zoomVal >= 1000 ? fmt(zoomVal) + "×" : (zoomVal < 10 ? zoomVal.toFixed(1) : Math.round(zoomVal)) + "×";
    caps.forEach((c) => c.classList.toggle("is-on", prog >= +c.dataset.from && prog < +c.dataset.to));
    tagEls.forEach((el, i) => el.classList.toggle("is-on", prog >= thresholds[i]));
  };

  // ---- MAIN LOOP ----------------------------------------------------------
  let lastT = performance.now(), heroOn = true, freezeOn = false;
  new IntersectionObserver(([e]) => (heroOn = e.isIntersecting)).observe($(".hero"));
  new IntersectionObserver(([e]) => (freezeOn = e.isIntersecting), { rootMargin: "200px 0px" }).observe(freeze);

  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle("is-scrolled", y > 40);
    nav.classList.toggle("is-hidden", y > lastY && y > 600 && !freezeOn ? true : false);
    if (freezeOn) nav.classList.add("is-hidden");
    if (y < lastY) nav.classList.remove("is-hidden");
    lastY = y;
    mcta.classList.toggle("is-on", y > innerHeight * 0.8 && !isVisible($("#book")));
    const docH = document.documentElement.scrollHeight - innerHeight;
    railFill.style.height = (y / docH) * 100 + "%";
    let label = chapters[0].dataset.chapter;
    chapters.forEach((c) => { if (c.getBoundingClientRect().top < innerHeight * 0.5) label = c.dataset.chapter; });
    if (railLabel.textContent !== label) railLabel.textContent = label;
    if (!reduceMotion) parallax.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      const off = (r.top + r.height / 2 - innerHeight / 2) * +el.dataset.parallax;
      el.style.transform = `translate3d(0, ${off}px, 0)`;
    });
  };

  const loop = (now) => {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    const t = now / 1000;
    if (heroOn && !reduceMotion) drawCaustics(t * 0.9);
    if (freezeOn && document.body.classList.contains("has-3d")) {
      const r = freeze.getBoundingClientRect();
      const p3 = clamp(-r.top / (r.height - innerHeight));
      caps.forEach((c) => c.classList.toggle("is-on", p3 >= +c.dataset.from && p3 < +c.dataset.to));
    } else if (freezeOn) {
      updateFreeze();
      flowT += dt * (1 - f) * (reduceMotion ? 0.2 : 1);
      if (m < 0.99) drawStream(t, dt);
      if (m > 0.01) drawMicro(t);
    }
    requestAnimationFrame(loop);
  };

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { measure(); onScroll(); });
  buildMicro(); measure(); onScroll();
  requestAnimationFrame(loop);

  // ---- 3D TILT on cards ---------------------------------------------------
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine && !reduceMotion) {
    $$("[data-tilt]").forEach((el) => {
      el.classList.add("tilt");
      el.addEventListener("pointermove", (e) => {
        if (!el.classList.contains("is-in") && el.hasAttribute("data-reveal")) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transition = "transform .12s ease-out";
        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 14}deg) translateZ(14px)`;
        el.style.setProperty("--gx", x * 100 + "%"); el.style.setProperty("--gy", y * 100 + "%");
      });
      el.addEventListener("pointerleave", () => { el.style.transition = "transform .7s cubic-bezier(.2,.7,.1,1)"; el.style.transform = ""; });
    });
  }

  // ---- JOURNEY 3D card + SERVICE title depth (scroll-linked) -------------
  const jv = $("#journeyVisual"), journey = $(".journey"), sTitle = $("#serviceTitle");
  let jmx = 0, jmy = 0;
  addEventListener("pointermove", (e) => { jmx = e.clientX / innerWidth - 0.5; jmy = e.clientY / innerHeight - 0.5; }, { passive: true });
  const depthLoop = () => {
    if (!reduceMotion) {
      if (isVisible(journey)) {
        const r = journey.getBoundingClientRect();
        const jp = clamp(-r.top / (r.height - innerHeight));
        jv.style.transform = `rotateY(${lerp(-22, 22, jp) + jmx * 10}deg) rotateX(${lerp(10, -8, jp) - jmy * 8}deg)`;
        jv.style.setProperty("--jp", jp);
      }
      if (isVisible(sTitle)) {
        const r = sTitle.getBoundingClientRect();
        const k = clamp((r.top - innerHeight * 0.15) / (innerHeight * 0.75));
        sTitle.style.transform = `perspective(1100px) rotateX(${k * 38}deg) rotateY(${jmx * -8}deg) translateZ(${-k * 120}px)`;
      }
    }
    requestAnimationFrame(depthLoop);
  };
  depthLoop();

  // hide broken images gracefully (keeps layout backgrounds)
  $$("img").forEach((img) => img.addEventListener("error", () => (img.style.visibility = "hidden")));

  $("#yr").textContent = new Date().getFullYear();
})();
