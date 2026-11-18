/* SafeCo SmartWater — Proposal Studio
 * Single-page app. No build step. Data is stored on the device (localStorage).
 * Routes:
 *   #/                 pipeline board
 *   #/settings         owner settings (PIN)
 *   #/p/:id/:step      proposal (rep)
 *   #/doc/:id          printable installation agreement
 *   #/share/:payload   homeowner opens a remote proposal link
 *   #/c/:step          homeowner walking a shared proposal
 *   #/return/:payload  rep imports a proposal the homeowner signed remotely
 */
(function () {
  "use strict";

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n, d = 0) => (n < 0 ? "-$" : "$") + Math.abs(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const num = (v) => (v === "" || v == null || isNaN(+v) ? null : +v);
  const today = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fmtDate = (t) => (t ? new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  const initialsOf = (name) => String(name || "").trim().split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 3).join("");
  const fmtX = (n) => (n >= 10 ? Math.round(n).toLocaleString() : (+n).toFixed(1));
  const fmtNum = (n) => (n == null ? "—" : Number(n) >= 100 ? Math.round(n).toLocaleString() : String(+Number(n).toFixed(3)));

  function getPath(o, path) { return path.split(".").reduce((a, k) => (a == null ? a : a[k]), o); }
  function setPath(o, path, v) {
    const ks = path.split("."); let cur = o;
    for (let i = 0; i < ks.length - 1; i++) { if (cur[ks[i]] == null) cur[ks[i]] = {}; cur = cur[ks[i]]; }
    cur[ks[ks.length - 1]] = v;
  }

  const ICONS = {
    home: "M3 11l9-8 9 8M5 10v10h14V10", user: "M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    drop: "M12 2.5s-6.5 7.2-6.5 11.8a6.5 6.5 0 0 0 13 0C18.5 9.7 12 2.5 12 2.5z",
    layers: "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    wrench: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z", chart: "M3 3v18h18M7 15l4-4 3 3 6-6",
    card: "M2 6h20v12H2zM2 10h20M6 15h4", pen: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
    leaf: "M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 12-4 16-9 16zM4 21c3-6 7-9 12-11",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", check: "M20 6 9 17l-5-5", x: "M18 6 6 18M6 6l12 12",
    plus: "M12 5v14M5 12h14", share: "M4 12v8h16v-8M16 6l-4-4-4 4M12 2v14", play: "M6 4l14 8-14 8z",
    gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
    ext: "M14 3h7v7M10 14 21 3M21 14v7H3V3h7",
    phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
    mail: "M3 5h18v14H3zM3 6l9 7 9-7", msg: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    cal: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18",
    print: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
    trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6", copy: "M9 9h11v11H9zM5 15H4V4h11v1",
    search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3", back: "M15 18l-6-6 6-6", next: "M9 18l6-6-6-6",
    expand: "M8 3H3v5M21 8V3h-5M16 21h5v-5M3 16v5h5", download: "M4 17v3h16v-3M12 3v13M7 11l5 5 5-5",
    upload: "M4 17v3h16v-3M12 16V3M7 8l5-5 5 5", star: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
    alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
    lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4", link: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
    paste: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6v4H9z",
  };
  const ic = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n] || ""}"/></svg>`;

  /* ---------- storage ---------- */
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { toast("Couldn't save on this device — storage is full or blocked."); return false; } },
  };
  function mergeDefaults(s) {
    const d = clone(SC.DEFAULTS);
    if (!s) return d;
    const out = Object.assign(d, s);
    out.company = Object.assign(clone(SC.DEFAULTS.company), s.company || {});
    out.savings = Object.assign(clone(SC.DEFAULTS.savings), s.savings || {});
    return out;
  }
  let settings = mergeDefaults(LS.get("sc_settings", null));
  let proposals = LS.get("sc_proposals", []);
  let clientP = LS.get("sc_client", null); // homeowner copy of a shared proposal
  let mode = "rep"; // "rep" | "client"
  let saveTimer = null;
  const saveSettings = () => LS.set("sc_settings", settings);
  function persist(p) {
    if (p) p.updated = Date.now();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { if (mode === "client") LS.set("sc_client", clientP); else LS.set("sc_proposals", proposals); }, 150);
  }
  function persistNow() { clearTimeout(saveTimer); if (mode === "client") LS.set("sc_client", clientP); else LS.set("sc_proposals", proposals); }

  /* settings used to price a proposal: live settings for reps, the shared snapshot for homeowners */
  const S = (p) => (mode === "client" && p && p.snap ? p.snap : settings);

  /* ---------- proposal model ---------- */
  function orderNo() {
    const d = new Date();
    return "SC-" + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "-" + Math.floor(1000 + Math.random() * 9000);
  }
  function itemFromProduct(pid) {
    const pr = settings.products.find((x) => x.id === pid);
    if (!pr) return null;
    return { pid: pr.id, name: pr.name, short: pr.short, category: pr.category, price: +pr.price, redLine: +pr.redLine, includes: (pr.includes || []).slice(), bullets: (pr.bullets || []).slice(), image: pr.image };
  }
  function newProposal() {
    const opts = settings.optionPresets.map((o) => ({ id: uid(), label: o.label, name: o.name, recommended: !!o.recommended, items: o.items.map(itemFromProduct).filter(Boolean), addons: [] }));
    let chosen = opts.findIndex((o) => o.recommended); if (chosen < 0) chosen = opts.length - 1;
    const best = bestPlan(settings.financePlans);
    return {
      id: uid(), order: orderNo(), status: "draft", created: Date.now(), updated: Date.now(), rep: settings.reps[0] || "",
      customer: { name: "", co: "", phone: "", email: "", address: "", city: "", state: "TX", zip: "" },
      test: { hardness: null, chlorine: null, tds: null, iron: null, ph: null, notes: "" },
      area: { zip: "", utility: "", served: "", source: "", url: "", pws: "", contaminants: [], pulledAt: null },
      options: opts, chosen, savings: clone(settings.savings),
      payment: { method: "finance", planId: best ? best.id : null, down: 0 },
      installFee: settings.installFee,
      site: { people: "", flooring: "", ice: "", notes: "", installDate: "" },
      checklist: {}, initials: {}, initialsText: "", sigs: {}, signedAt: null, history: [{ t: Date.now(), e: "Created" }],
    };
  }
  function log(p, e) { (p.history = p.history || []).push({ t: Date.now(), e }); }
  function monthly(amount, plan) {
    if (!plan || amount <= 0) return 0;
    const n = +plan.term || 1, r = (+plan.apr || 0) / 1200;
    return r === 0 ? amount / n : (amount * r) / (1 - Math.pow(1 + r, -n));
  }
  function bestPlan(plans) {
    if (!plans || !plans.length) return null;
    return plans.slice().sort((a, b) => monthly(10000, a) - monthly(10000, b))[0];
  }
  function planOf(p) {
    const plans = S(p).financePlans || [];
    return plans.find((x) => x.id === p.payment.planId) || bestPlan(plans);
  }
  function optTotals(p, o) {
    const s = S(p);
    if (!o) return { items: 0, add: 0, equipment: 0, install: 0, tax: 0, total: 0 };
    const items = o.items.reduce((a, i) => a + (+i.price || 0), 0);
    const add = (o.addons || []).reduce((a, id) => { const ad = (s.addons || []).find((x) => x.id === id); return a + (ad ? +ad.price : 0); }, 0);
    const equipment = items + add;
    const install = +p.installFee || 0;
    const tax = Math.round(equipment * (+s.taxRate || 0)) / 100;
    return { items, add, equipment, install, tax, total: equipment + install + tax };
  }
  const chosenOpt = (p) => p.options[p.chosen] || p.options.find((o) => o.recommended) || p.options[0];
  const includesOf = (o) => new Set((o ? o.items : []).flatMap((i) => i.includes || []));
  function fromMonthly(p, o) { const t = optTotals(p, o); return monthly(t.total, bestPlan(S(p).financePlans)); }
  function financeFigures(p) {
    const o = chosenOpt(p), t = optTotals(p, o), plan = planOf(p);
    const down = Math.min(Math.max(+p.payment.down || 0, 0), t.total);
    if (p.payment.method === "full") return { o, t, plan: null, down: t.total, financed: 0, mo: 0 };
    const financed = t.total - down;
    return { o, t, plan, down, financed, mo: monthly(financed, plan) };
  }

  /* ---------- test + contaminant status ---------- */
  function testState(def, v) {
    if (v == null || v === "") return "none";
    if (def.range) return v < def.range[0] || v > def.range[1] ? "bad" : "ok";
    return v > def.limit ? "bad" : "ok";
  }
  function contamFactor(c) {
    if (c.factor != null) return +c.factor;
    const lib = SC.CONTAMINANTS.find((x) => x.key === c.name);
    if (lib && lib.ewg && c.value != null) return +c.value / lib.ewg;
    return null;
  }
  const libOf = (name) => SC.CONTAMINANTS.find((x) => x.key === name) || {};

  /* ---------- UI primitives ---------- */
  function toast(msg, kind = "") {
    const t = document.createElement("div");
    t.className = "toast " + kind; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 300); }, 2600);
  }
  function modal(html, opts = {}) {
    const wrap = document.createElement("div");
    wrap.className = "modal-back";
    wrap.innerHTML = `<div class="modal ${opts.wide ? "wide" : ""}" role="dialog" aria-modal="true"><button class="modal-x" data-close aria-label="Close">${ic("x")}</button>${html}</div>`;
    document.body.appendChild(wrap);
    const close = () => { wrap.remove(); document.removeEventListener("keydown", onKey); opts.onClose && opts.onClose(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    wrap.addEventListener("click", (e) => { if (e.target === wrap || e.target.closest("[data-close]")) close(); });
    requestAnimationFrame(() => wrap.classList.add("in"));
    return { el: wrap.querySelector(".modal"), close };
  }
  function confirmBox(msg, okLabel = "Confirm") {
    return new Promise((res) => {
      const m = modal(`<h3>${esc(msg)}</h3><div class="row end gap"><button class="btn ghost" data-close>Cancel</button><button class="btn danger" data-ok>${esc(okLabel)}</button></div>`, { onClose: () => res(false) });
      m.el.querySelector("[data-ok]").onclick = () => { res(true); m.close(); };
    });
  }
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); toast("Copied to clipboard", "good"); }
    catch (e) { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast("Copied", "good"); } catch (_) { toast("Copy failed — select and copy manually"); } ta.remove(); }
  }

  /* ---------- link encoding (proposal travels inside the link) ---------- */
  function b64u(u8) { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function unb64u(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  async function encode(obj) {
    const s = JSON.stringify(obj);
    if (window.CompressionStream) {
      const buf = await new Response(new Blob([s]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
      return "z" + b64u(new Uint8Array(buf));
    }
    return "b" + b64u(new TextEncoder().encode(s));
  }
  async function decode(str) {
    const bytes = unb64u(str.slice(1));
    if (str[0] === "z") return JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text());
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  const baseUrl = () => location.href.split("#")[0];

  /* ---------- steps ---------- */
  const STEPS = [
    { id: "cover", title: "Cover", icon: "star" },
    { id: "welcome", title: "Welcome", icon: "home" },
    { id: "customer", title: "Homeowner", icon: "user", rep: true },
    { id: "water", title: "Your Water", icon: "drop" },
    { id: "learn", title: "How It Works", icon: "layers" },
    { id: "build", title: "Build System", icon: "wrench", rep: true },
    { id: "options", title: "Your Options", icon: "grid" },
    { id: "savings", title: "Savings", icon: "chart" },
    { id: "payment", title: "Payment", icon: "card" },
    { id: "sign", title: "Agreement", icon: "pen" },
  ];
  const stepsFor = () => STEPS.filter((s) => !(mode === "client" && s.rep));

  /* ---------- router ---------- */
  let current = null; // {p, step}
  let presenting = false;
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  function findP(id) { return proposals.find((x) => x.id === id); }

  async function route() {
    const parts = (location.hash.slice(1) || "/").split("/").filter(Boolean);
    const view = $("#view");
    document.body.classList.remove("client", "doc-mode");
    $$(".modal-back").forEach((m) => m.parentNode.removeChild(m));
    clearInterval(roTimer);
    current = null;
    try {
      if (parts[0] === "share") return await openShared(parts.slice(1).join("/"));
      if (parts[0] === "return") return await importReturned(parts.slice(1).join("/"));
      if (parts[0] === "c") {
        mode = "client"; document.body.classList.add("client");
        if (!clientP) { view.innerHTML = emptyClient(); renderTop(); return; }
        if (parts[1] === "doc") return renderDoc(clientP);
        return renderProposal(clientP, parts[1] || "cover");
      }
      mode = "rep";
      if (parts[0] === "p") {
        const p = findP(parts[1]);
        if (!p) { toast("Proposal not found"); return go("#/"); }
        return renderProposal(p, parts[2] || "cover");
      }
      if (parts[0] === "doc") { const p = findP(parts[1]); if (!p) return go("#/"); return renderDoc(p); }
      if (parts[0] === "settings") return renderSettings();
      if (parts[0] === "new") { const p = newProposal(); proposals.unshift(p); persistNow(); return go(`#/p/${p.id}/customer`); }
      return renderPipeline();
    } finally { renderTop(); }
  }

  function renderTop() {
    const top = $("#topbar");
    const c = (mode === "client" && clientP && clientP.snap ? clientP.snap.company : settings.company);
    if (mode === "client") {
      top.innerHTML = `<a class="brand" href="#/c/cover"><img src="assets/logo.png" alt="SafeCo SmartWater Systems"></a>
        <div class="top-right"><a class="top-phone" href="tel:${esc(c.phone.replace(/[^\d+]/g, ""))}">${ic("phone")}<span>${esc(c.phone)}</span></a></div>`;
      return;
    }
    const h = location.hash;
    top.innerHTML = `<a class="brand" href="#/"><img src="assets/logo.png" alt="SafeCo SmartWater Systems"></a>
      <nav class="topnav">
        <a href="#/" class="${h === "" || h === "#/" ? "on" : ""}">${ic("grid")}<span>Pipeline</span></a>
        <a href="#/new">${ic("plus")}<span>New proposal</span></a>
        <a href="#/settings" class="${h.startsWith("#/settings") ? "on" : ""}">${ic("gear")}<span>Settings</span></a>
      </nav>`;
  }

  /* ======================================================================
   * PIPELINE
   * ==================================================================== */
  const COLUMNS = [
    { id: "draft", title: "Draft" }, { id: "presented", title: "Presented" }, { id: "sent", title: "Sent" },
    { id: "signed", title: "Signed" }, { id: "installed", title: "Installed" },
  ];
  let pipeQuery = "";
  function renderPipeline() {
    const q = pipeQuery.toLowerCase();
    const list = proposals.filter((p) => !q || [p.customer.name, p.customer.city, p.customer.zip, p.rep, p.order].join(" ").toLowerCase().includes(q));
    const val = (p) => optTotals(p, chosenOpt(p)).total;
    const sum = (arr) => arr.reduce((a, p) => a + val(p), 0);
    const open = proposals.filter((p) => ["draft", "presented", "sent"].includes(p.status));
    const won = proposals.filter((p) => ["signed", "installed"].includes(p.status));
    const pitched = proposals.filter((p) => p.status !== "draft");
    const rate = pitched.length ? Math.round((won.length / pitched.length) * 100) : 0;
    $("#view").innerHTML = `
      <section class="page">
        <div class="page-head">
          <div><div class="eyebrow">Sales pipeline</div><h1>Proposals</h1></div>
          <div class="row gap wrap">
            <label class="search">${ic("search")}<input id="pipeSearch" placeholder="Search name, city, ZIP, rep" value="${esc(pipeQuery)}"></label>
            <button class="btn ghost" data-act="import-link">${ic("link")} Import signed link</button>
            <button class="btn ghost" data-act="backup">${ic("download")} Backup</button>
            <button class="btn ghost" data-act="restore">${ic("upload")} Restore</button>
            <a class="btn" href="#/new">${ic("plus")} New proposal</a>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><span>Open pipeline</span><b>${money(sum(open))}</b><small>${open.length} proposals</small></div>
          <div class="stat"><span>Signed & installed</span><b>${money(sum(won))}</b><small>${won.length} deals</small></div>
          <div class="stat"><span>Close rate</span><b>${rate}%</b><small>of presented proposals</small></div>
          <div class="stat"><span>Average deal</span><b>${money(won.length ? sum(won) / won.length : 0)}</b><small>signed deals</small></div>
        </div>
        ${proposals.length === 0 ? `
          <div class="empty card">
            <img src="assets/system.jpg" alt="" class="empty-img">
            <h2>Build your first proposal</h2>
            <p>Run a guided water proposal at the kitchen table, or send it as a link and let the homeowner walk it from their couch.</p>
            <div class="row gap center"><a class="btn lg" href="#/new">${ic("plus")} New proposal</a><button class="btn ghost lg" data-act="demo">Load a sample proposal</button></div>
          </div>` : `
        <div class="board">
          ${COLUMNS.map((col) => {
            const items = list.filter((p) => p.status === col.id);
            return `<div class="col" data-col="${col.id}">
              <div class="col-head"><span class="dot s-${col.id}"></span>${col.title}<span class="count">${items.length}</span><span class="col-sum">${money(sum(items))}</span></div>
              <div class="col-body">${items.map(dealCard).join("") || `<div class="col-empty">No proposals</div>`}</div>
            </div>`;
          }).join("")}
        </div>`}
      </section>`;
    const s = $("#pipeSearch");
    if (s) s.addEventListener("input", (e) => { pipeQuery = e.target.value; const pos = e.target.selectionStart; renderPipeline(); const n = $("#pipeSearch"); n.focus(); n.setSelectionRange(pos, pos); });
  }
  function dealCard(p) {
    const o = chosenOpt(p), t = optTotals(p, o);
    const days = Math.max(0, Math.round((Date.now() - p.updated) / 86400000));
    return `<div class="deal" data-act="open" data-id="${p.id}" tabindex="0">
      <div class="deal-top"><b>${esc(p.customer.name || "Unnamed homeowner")}</b><span class="deal-amt">${money(t.total)}</span></div>
      <div class="deal-sub">${esc([p.customer.city, p.customer.zip].filter(Boolean).join(" · ") || "No address yet")} · ${esc(o ? o.name : "")}</div>
      <div class="deal-chips">
        ${p.signedAt ? `<span class="chip good">Signed</span>` : ""}
        ${p.payment.method === "full" ? `<span class="chip">Pay in full</span>` : `<span class="chip">${money(financeFigures(p).mo)}/mo</span>`}
        ${p.site.installDate ? `<span class="chip">Install ${esc(fmtDate(p.site.installDate + "T12:00"))}</span>` : ""}
      </div>
      <div class="deal-foot"><span class="avatar">${esc(initialsOf(p.rep) || "—")}</span><span>${esc(p.rep || "")}</span><span class="grow"></span><span class="muted">${days === 0 ? "Today" : days + "d"}</span>
        <select class="mini" data-act-change="move" data-id="${p.id}" aria-label="Move">${COLUMNS.map((c) => `<option value="${c.id}" ${c.id === p.status ? "selected" : ""}>${c.title}</option>`).join("")}<option value="__dup">Duplicate…</option><option value="__del">Delete…</option></select>
      </div>
    </div>`;
  }

  function demoProposal() {
    const p = newProposal();
    Object.assign(p.customer, { name: "Sarah Mitchell", co: "David Mitchell", phone: "(214) 555-0142", email: "sarah@example.com", address: "1450 Oak Hollow Dr", city: "Irving", state: "TX", zip: "75062" });
    Object.assign(p.test, { hardness: 14, chlorine: 2.1, tds: 380, iron: 0.1, ph: 7.9 });
    Object.assign(p.area, { zip: "75062", utility: "City of Irving (sample data)", served: "256,000", source: "Purchased surface water", url: ewgSearchUrl("75062"),
      contaminants: [
        { name: "Total trihalomethanes (TTHMs)", value: 41.2, unit: "ppb", factor: null },
        { name: "Bromodichloromethane", value: 10.6, unit: "ppb", factor: null },
        { name: "Haloacetic acids (HAA5)", value: 14.8, unit: "ppb", factor: null },
        { name: "Chromium (hexavalent)", value: 0.11, unit: "ppb", factor: null },
        { name: "Nitrate", value: 0.5, unit: "ppm", factor: null },
      ] });
    p.rep = settings.reps[0] || "Sales Rep";
    log(p, "Sample data loaded — replace with the homeowner's real report");
    return p;
  }

  /* ======================================================================
   * PROPOSAL SHELL
   * ==================================================================== */
  function renderProposal(p, stepId) {
    const steps = stepsFor();
    let idx = steps.findIndex((s) => s.id === stepId);
    if (idx < 0) idx = 0;
    const step = steps[idx];
    current = { p, step: step.id };
    const base = mode === "client" ? "#/c/" : `#/p/${p.id}/`;
    const o = chosenOpt(p), ff = financeFigures(p);
    $("#view").innerHTML = `
      <div class="prop ${presenting ? "presenting" : ""}">
        <aside class="rail">
          <div class="rail-cust">
            <div class="avatar lg">${esc(initialsOf(p.customer.name) || "SC")}</div>
            <div><b>${esc(p.customer.name || "New homeowner")}</b><small>${esc([p.customer.city, p.customer.zip].filter(Boolean).join(", ") || p.order)}</small></div>
          </div>
          <ol class="steps">
            ${steps.map((s, i) => `<li><a href="${base}${s.id}" class="${i === idx ? "on" : ""} ${i < idx ? "done" : ""}">
              <span class="num">${i < idx ? ic("check") : i + 1}</span><span class="lbl">${s.title}</span>${s.rep ? `<span class="rep-tag">Rep</span>` : ""}</a></li>`).join("")}
          </ol>
          ${mode === "rep" ? `<div class="rail-actions">
            <button class="btn block" data-act="present">${ic("play")} Present</button>
            <button class="btn ghost block" data-act="share">${ic("share")} Send to homeowner</button>
            <a class="btn ghost block" href="#/doc/${p.id}">${ic("print")} Agreement PDF</a>
          </div>` : ""}
        </aside>
        <main class="stage">
          ${presenting ? `<div class="present-bar"><img src="assets/logo.png" alt=""><div class="pdots">${steps.map((s, i) => `<a href="${base}${s.id}" class="${i === idx ? "on" : ""} ${i < idx ? "done" : ""}" title="${s.title}"></a>`).join("")}</div><button class="btn ghost sm" data-act="exit-present">${ic("x")} Exit</button></div>` : ""}
          <div class="mstrip">${steps.map((s, i) => `<a href="${base}${s.id}" class="${i === idx ? "on" : ""}">${i + 1}. ${s.title}</a>`).join("")}</div>
          <div class="stage-body" id="stageBody">${STEP_RENDER[step.id](p)}</div>
          <footer class="stage-foot">
            ${idx > 0 ? `<a class="btn ghost" href="${base}${steps[idx - 1].id}">${ic("back")} ${steps[idx - 1].title}</a>` : `<span></span>`}
            <div class="foot-sum" data-live="footSum">${footSum(p)}</div>
            ${idx < steps.length - 1 ? `<a class="btn" href="${base}${steps[idx + 1].id}">${steps[idx + 1].title} ${ic("next")}</a>` : `<span></span>`}
          </footer>
        </main>
      </div>`;
    window.scrollTo(0, 0);
    const after = STEP_AFTER[step.id]; if (after) after(p);
  }
  function footSum(p) {
    const o = chosenOpt(p); if (!o) return "";
    const t = optTotals(p, o);
    return `<span class="muted">${esc(o.label)} · ${esc(o.name)}</span><b>${money(t.total)}</b><span class="muted">or ${money(fromMonthly(p, o))}/mo</span>`;
  }
  function stepHead(eyebrow, title, sub) {
    return `<div class="step-head"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${sub ? `<p class="lead">${sub}</p>` : ""}</div>`;
  }
  const isRep = () => mode === "rep";

  /* live regions: re-rendered after every input without losing focus */
  const LIVE = {
    footSum: (p) => footSum(p),
    testStatus: (p, el) => testBadge(SC.TESTS.find((t) => t.id === el.dataset.id), p.test[el.dataset.id]),
    testSummary: (p) => testSummary(p),
    buildTotals: (p) => buildTotals(p),
    savings: (p) => savingsBlock(p),
    payment: (p) => paymentSummary(p),
    redline: (p, el) => redlineMsg(p, el),
  };
  function updateLive(p) { $$("[data-live]").forEach((el) => { const f = LIVE[el.dataset.live]; if (f) el.innerHTML = f(p, el); }); }

  /* ======================================================================
   * STEP: COVER
   * ==================================================================== */
  function stepCover(p) {
    const c = S(p).company, cu = p.customer;
    const names = cu.name ? esc(cu.name) + (cu.co ? " &amp; " + esc(cu.co) : "") : "Valued Homeowner";
    const addr = [cu.address, [cu.city, cu.state].filter(Boolean).join(", "), cu.zip].filter(Boolean).join(" · ");
    const next = mode === "client" ? "#/c/welcome" : `#/p/${p.id}/welcome`;
    return `<section class="cover">
      <div class="cover-glow" aria-hidden="true"></div>
      <div class="cover-top">
        <img class="cover-logo" src="assets/logo.png" alt="SafeCo SmartWater Systems">
        <div class="cover-rule"><span></span><b>Premium Equipment · Professional Installation · Better Water. Better Living.</b><span></span></div>
      </div>
      <div class="cover-main">
        <div class="cover-text">
          <div class="cover-kicker">Water Quality &amp; Treatment Proposal</div>
          <h1 class="cover-title">Clean, soft water<br>for every tap in your home.</h1>
          <div class="cover-for">
            <small>Prepared exclusively for</small>
            <b>${names}</b>
            ${addr ? `<span>${esc(addr)}</span>` : ""}
          </div>
          <dl class="cover-meta">
            <div><dt>Date</dt><dd>${esc(fmtDate(p.created) || today())}</dd></div>
            <div><dt>Water specialist</dt><dd>${esc(p.rep || c.salesOrg)}</dd></div>
            <div><dt>Proposal #</dt><dd>${esc(p.order)}</dd></div>
          </dl>
          <a class="btn lg cyan" href="${next}">Begin presentation ${ic("next")}</a>
        </div>
        <div class="cover-img"><img src="assets/system.jpg" alt="SafeCo Complete Home Softener &amp; Filtration System"></div>
      </div>
      <div class="cover-foot">
        <div class="cover-badges">${SC.ABOUT.badges.map((b) => `<span>${esc(b)}</span>`).join("")}</div>
        <div class="cover-contact"><span>${ic("phone")} ${esc(c.phone)}</span><span>${esc(c.website)}</span><span>${esc(c.address)}</span></div>
      </div>
    </section>`;
  }

  /* ======================================================================
   * STEP: WELCOME
   * ==================================================================== */
  const PILLAR_ICON = { drop: "drop", leaf: "leaf", shield: "shield", home: "home" };
  function stepWelcome(p) {
    const c = S(p).company;
    const first = (p.customer.name || "").split(" ")[0];
    return `
      <section class="hero">
        <div class="hero-text">
          <div class="eyebrow cyan">${mode === "client" ? "Your personal water proposal" : "Water proposal"} · ${esc(today())}</div>
          <h1>${first ? `${esc(first)}, let's look at<br>what's in your water.` : esc(SC.ABOUT.headline)}</h1>
          <p>${esc(SC.ABOUT.intro)}</p>
          <div class="hero-meta">
            ${p.customer.name ? `<div><small>Prepared for</small><b>${esc(p.customer.name)}${p.customer.co ? " & " + esc(p.customer.co) : ""}</b></div>` : ""}
            ${p.customer.address ? `<div><small>Home</small><b>${esc(p.customer.address)}${p.customer.city ? ", " + esc(p.customer.city) : ""}</b></div>` : ""}
            ${p.rep ? `<div><small>Your water specialist</small><b>${esc(p.rep)}</b></div>` : ""}
          </div>
          ${mode === "client" ? `<a class="btn lg cyan" href="#/c/water">Start my walkthrough ${ic("next")}</a>` : ""}
        </div>
        <div class="hero-img"><img src="assets/system.jpg" alt="SafeCo Complete Home Softener & Filtration System"></div>
      </section>
      <section class="pillars">
        ${SC.ABOUT.pillars.map((x) => `<div class="pillar"><span class="pill-ic">${ic(PILLAR_ICON[x.icon])}</span><b>${esc(x.title)}</b><p>${esc(x.text)}</p></div>`).join("")}
      </section>
      <section class="grid2">
        <div class="card">
          <h3>What we'll cover together</h3>
          <ol class="agenda">
            <li><b>Your water</b> — your in-home test and the public report for your address</li>
            <li><b>How it works</b> — what each stage removes, in plain English</li>
            <li><b>Your options</b> — pick the system that fits your home</li>
            <li><b>Savings</b> — what you spend today vs. owning the system</li>
            <li><b>Payment & agreement</b> — a clear monthly payment and sign on any device</li>
          </ol>
        </div>
        <div class="card">
          <h3>The SafeCo promise</h3>
          <ul class="checks">${SC.ABOUT.promise.map((x) => `<li>${ic("check")}${esc(x)}</li>`).join("")}</ul>
          <div class="badges">${SC.ABOUT.badges.map((b) => `<span class="badge">${esc(b)}</span>`).join("")}</div>
          <p class="muted small">${esc(c.name)} · ${esc(c.phone)} · ${esc(c.website)}</p>
        </div>
      </section>`;
  }

  /* ======================================================================
   * STEP: CUSTOMER (rep)
   * ==================================================================== */
  function field(label, path, opts = {}) {
    const v = getPath(current.p, path);
    const type = opts.type || "text";
    const attrs = `data-bind="${path}" ${opts.num ? 'data-num="1"' : ""} ${opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : ""} ${opts.attrs || ""}`;
    let input;
    if (opts.select) input = `<select ${attrs} data-rerender="${opts.rerender ? 1 : ""}">${opts.select.map((o) => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(v) === String(val) ? "selected" : ""}>${esc(lab)}</option>`; }).join("")}</select>`;
    else if (opts.textarea) input = `<textarea rows="${opts.rows || 3}" ${attrs}>${esc(v)}</textarea>`;
    else input = `<input type="${type}" value="${esc(v == null ? "" : v)}" ${attrs}>`;
    return `<label class="field ${opts.cls || ""}"><span>${label}</span>${input}</label>`;
  }
  function stepCustomer(p) {
    const c = p.customer;
    const tel = (c.phone || "").replace(/[^\d+]/g, "");
    return `${stepHead("Step · Rep only", "Homeowner details", "These fill the proposal and the installation agreement automatically.")}
      <div class="grid2">
        <div class="card">
          <h3>Customer information</h3>
          <div class="fgrid">
            ${field("Customer name", "customer.name", { placeholder: "Sarah Mitchell" })}
            ${field("Co-customer name", "customer.co", { placeholder: "Optional" })}
            ${field("Phone", "customer.phone", { type: "tel", placeholder: "(214) 555-0142" })}
            ${field("Email", "customer.email", { type: "email", placeholder: "name@email.com" })}
            ${field("Installation address", "customer.address", { cls: "span2", placeholder: "Street address" })}
            ${field("City", "customer.city")}
            <div class="fgrid tight">${field("State", "customer.state")}${field("ZIP", "customer.zip", { attrs: 'inputmode="numeric" maxlength="5"' })}</div>
          </div>
        </div>
        <div class="card">
          <h3>Deal</h3>
          <div class="fgrid">
            ${field("Sales representative", "rep", { select: settings.reps.length ? settings.reps : [""] })}
            ${field("Status", "status", { select: COLUMNS.map((c) => [c.id, c.title]) })}
            ${field("Project / order #", "order")}
            ${field("Sales organization", "salesOrg", { placeholder: settings.company.salesOrg })}
          </div>
          <div class="quick">
            <a class="btn ghost ${tel ? "" : "disabled"}" href="tel:${esc(tel)}">${ic("phone")} Call</a>
            <a class="btn ghost ${tel ? "" : "disabled"}" href="sms:${esc(tel)}">${ic("msg")} Text</a>
            <a class="btn ghost ${c.email ? "" : "disabled"}" href="mailto:${esc(c.email)}">${ic("mail")} Email</a>
          </div>
          <h3 class="mt">Activity</h3>
          <ul class="timeline">${(p.history || []).slice().reverse().slice(0, 8).map((h) => `<li><span>${esc(fmtDate(h.t))}</span>${esc(h.e)}</li>`).join("")}</ul>
        </div>
      </div>`;
  }

  /* ======================================================================
   * STEP: WATER (in-home test + EWG area report)
   * ==================================================================== */
  const ewgSearchUrl = (zip) => `https://www.ewg.org/tapwater/search-results.php?zip5=${encodeURIComponent(zip)}&searchtype=zip`;
  function testBadge(def, v) {
    const s = testState(def, v);
    return s === "none" ? `<span class="tag muted">Not tested</span>` : s === "bad" ? `<span class="tag bad">Needs treatment</span>` : `<span class="tag good">Within range</span>`;
  }
  function testSummary(p) {
    const st = SC.TESTS.map((d) => testState(d, p.test[d.id]));
    const bad = st.filter((x) => x === "bad").length, ok = st.filter((x) => x === "ok").length;
    if (!bad && !ok) return `No readings logged yet`;
    return `<b class="bad-t">${bad} need${bad === 1 ? "s" : ""} treatment</b> · ${ok} within range`;
  }
  function stepWater(p) {
    const zip = p.area.zip || p.customer.zip || "";
    const rep = isRep();
    const contams = (p.area.contaminants || []).map((c) => ({ ...c, f: contamFactor(c) })).sort((a, b) => (b.f || 0) - (a.f || 0));
    const above = contams.filter((c) => c.f != null && c.f > 1).length;
    return `${stepHead(`Water test${zip ? " · ZIP " + esc(zip) : ""}`, `${p.customer.name ? esc(p.customer.name.split(" ")[0]) + "’s" : "Your"} water test results`, "Your in-home test sits on top of the public water-quality report for your address — published utility data, not a sales claim.")}
      <div class="card">
        <div class="card-head"><div><div class="eyebrow">Your in-home test</div><div data-live="testSummary">${testSummary(p)}</div></div></div>
        <div class="tests">
          ${SC.TESTS.map((d) => {
            const v = p.test[d.id];
            return `<div class="test ${testState(d, v)}">
              <div class="test-top"><b>${d.label}</b><span data-live="testStatus" data-id="${d.id}">${testBadge(d, v)}</span></div>
              <div class="test-val">${rep ? `<input type="number" step="${d.step}" min="0" max="${d.max}" value="${v == null ? "" : v}" data-bind="test.${d.id}" data-num="1" placeholder="—" aria-label="${d.label}">` : `<span class="big">${v == null ? "—" : esc(v)}</span>`}<span class="unit">${d.unit}</span></div>
              ${rep ? `<input type="range" min="0" max="${d.max}" step="${d.step}" value="${v == null ? 0 : v}" data-bind="test.${d.id}" data-num="1" aria-label="${d.label} slider">` : ""}
              <p class="test-help">${esc(d.help)}</p>
            </div>`;
          }).join("")}
        </div>
      </div>

      <div class="card area">
        <div class="card-head">
          <div><div class="eyebrow">Your area's water</div><h3>${esc(p.area.utility || "Your water utility")}</h3>
            <div class="muted">${[p.area.served ? "Serving " + esc(p.area.served) + " people" : "", esc(p.area.source)].filter(Boolean).join(" · ") || "Pull the EWG Tap Water report for this address."}</div></div>
          ${rep ? `<div class="row gap wrap">
            <label class="field inline"><span>ZIP</span><input value="${esc(zip)}" data-bind="area.zip" inputmode="numeric" maxlength="5" style="width:6.5em"></label>
            <button class="btn" data-act="ewg-pull">${ic("download")} Pull EWG report</button>
            <a class="btn ghost" target="_blank" rel="noopener" href="${esc(p.area.url || ewgSearchUrl(zip))}">${ic("ext")} Open on EWG</a>
            <button class="btn ghost" data-act="ewg-paste">${ic("paste")} Paste report</button>
            <button class="btn ghost" data-act="contam-add">${ic("plus")} Add</button>
          </div>` : p.area.url ? `<a class="btn ghost" target="_blank" rel="noopener" href="${esc(p.area.url)}">${ic("ext")} View the full EWG report</a>` : ""}
        </div>
        ${contams.length ? `
          <div class="area-sum"><div class="ring">${above}</div><div><b>${above} contaminant${above === 1 ? "" : "s"} detected above health guidelines</b><p class="muted">Health guidelines are the levels scientists say carry minimal risk. Many are far below the legal limit, which hasn't been updated in decades for some chemicals.</p></div></div>
          <div class="contams">${contams.map((c, i) => contamRow(c, p.area.contaminants.indexOf(p.area.contaminants.find((x) => x.name === c.name)), rep)).join("")}</div>
          <p class="src muted small">Source: Environmental Working Group Tap Water Database${p.area.pulledAt ? ", retrieved " + esc(fmtDate(p.area.pulledAt)) : ""}. Health guideline and legal limit shown for reference; confirm against the full report.</p>`
        : `<div class="area-empty">${ic("drop", "lg")}<p>${rep ? "Enter the ZIP and tap <b>Pull EWG report</b>. If auto-pull isn't available, open the report on EWG, copy the page and use <b>Paste report</b> — or add contaminants by hand." : "Your specialist will add your local utility's report here."}</p></div>`}
      </div>
      ${rep || p.test.notes ? `<div class="card">${rep ? field("Test notes (shown to homeowner)", "test.notes", { textarea: true, rows: 2, placeholder: "e.g. Spotting on shower glass, white scale on faucets, chlorine smell…" }) : `<h3>Notes from your specialist</h3><p>${esc(p.test.notes)}</p>`}</div>` : ""}`;
  }
  function contamRow(c, idx, rep) {
    const lib = libOf(c.name);
    const f = c.f;
    const w = f == null ? 0 : Math.min(100, (Math.log10(f + 1) / Math.log10(5001)) * 100);
    return `<div class="contam ${f != null && f > 1 ? "over" : ""}">
      <div class="c-name"><b>${esc(c.name)}</b><small>${esc(lib.group || "Contaminant")}${lib.effect ? " · Potential effect: " + esc(lib.effect) : ""}</small></div>
      <div class="c-bar"><div class="bar"><i style="width:${w.toFixed(1)}%"></i></div>
        <span class="c-x">${f == null ? "Detected" : f >= 1 ? `<b>${fmtX(f)}×</b> EWG health guideline` : "Below EWG health guideline"}</span></div>
      <div class="c-vals"><span><small>Your utility</small>${c.value == null ? "—" : fmtNum(c.value) + " " + esc(c.unit || lib.unit || "")}</span>
        <span><small>Health guideline</small>${lib.ewg == null ? "—" : fmtNum(lib.ewg) + " " + esc(lib.unit)}</span>
        <span><small>Legal limit</small>${lib.legal == null ? "None" : fmtNum(lib.legal) + " " + esc(lib.unit)}</span></div>
      <div class="c-fix">${lib.fix ? `<span class="tag cyan">Removed by ${esc(lib.fix)}</span>` : ""}${rep ? `<button class="icon-btn" data-act="contam-del" data-i="${idx}" aria-label="Remove">${ic("trash")}</button>` : ""}</div>
    </div>`;
  }

  async function ewgPull(p) {
    const zip = (p.area.zip || p.customer.zip || "").trim();
    if (!/^\d{5}$/.test(zip)) return toast("Enter a 5-digit ZIP first");
    p.area.zip = zip;
    const btn = $('[data-act="ewg-pull"]'); if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spin"></span> Pulling…`; }
    try {
      const r = await fetch(`api/ewg?zip=${zip}`, { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error("http " + r.status);
      const j = await r.json();
      if (!j.report || !j.report.contaminants) throw new Error("no report");
      if (j.systems && j.systems.length > 1) return chooseSystem(p, j.systems, j);
      applyReport(p, j.report, j.systems && j.systems[0]);
    } catch (e) {
      ewgFallback(p, zip);
    } finally { if (btn && document.body.contains(btn)) { btn.disabled = false; btn.innerHTML = `${ic("download")} Pull EWG report`; } }
  }
  function applyReport(p, rep, sys) {
    p.area.utility = rep.utility || (sys && sys.name) || p.area.utility;
    p.area.served = rep.served || (sys && sys.served) || p.area.served;
    p.area.source = rep.source || p.area.source;
    p.area.pws = rep.pws || (sys && sys.pws) || "";
    p.area.url = rep.url || ewgSearchUrl(p.area.zip);
    p.area.contaminants = rep.contaminants || [];
    p.area.pulledAt = Date.now();
    log(p, `EWG report pulled for ${p.area.utility || p.area.zip}`);
    persist(p); renderProposal(p, "water");
    toast(`${p.area.contaminants.length} contaminants loaded from EWG`, "good");
  }
  function chooseSystem(p, systems, first) {
    const m = modal(`<h3>Which water utility serves this home?</h3><p class="muted">EWG lists ${systems.length} utilities for ZIP ${esc(p.area.zip)}.</p>
      <div class="pick-list">${systems.map((s, i) => `<button class="pick" data-i="${i}"><b>${esc(s.name)}</b><small>${esc([s.city, s.served ? "serves " + s.served : ""].filter(Boolean).join(" · "))}</small></button>`).join("")}</div>`);
    m.el.addEventListener("click", async (e) => {
      const b = e.target.closest(".pick"); if (!b) return;
      const s = systems[+b.dataset.i];
      if (first.report && first.report.pws === s.pws) { m.close(); return applyReport(p, first.report, s); }
      b.innerHTML = `<span class="spin"></span> Loading ${esc(s.name)}…`;
      try { const r = await fetch(`api/ewg?pws=${encodeURIComponent(s.pws)}`); const j = await r.json(); m.close(); applyReport(p, j.report, s); }
      catch (_) { m.close(); ewgFallback(p, p.area.zip); }
    });
  }
  function ewgFallback(p, zip) {
    const url = ewgSearchUrl(zip);
    const m = modal(`<h3>Pull the report from EWG</h3>
      <p>Auto-pull isn't reachable from this device right now${location.protocol === "file:" ? " (the app is opened as a local file)" : ""}. It takes 20 seconds by hand:</p>
      <ol class="howto"><li>Open the EWG report for ZIP <b>${esc(zip)}</b> and tap the utility that serves the home.</li>
        <li>Select all on the page (<kbd>Ctrl/⌘ A</kbd>) and copy (<kbd>Ctrl/⌘ C</kbd>).</li>
        <li>Come back and paste it below — we'll find the contaminants for you.</li></ol>
      <div class="row gap wrap"><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${ic("ext")} Open EWG for ${esc(zip)}</a><button class="btn ghost" data-go-paste>${ic("paste")} I copied it — paste now</button></div>`);
    m.el.querySelector("[data-go-paste]").onclick = () => { m.close(); ewgPaste(p); };
  }
  function ewgPaste(p) {
    const m = modal(`<h3>Paste the EWG report</h3>
      <div class="fgrid">
        <label class="field"><span>Utility name</span><input id="pUtil" value="${esc(p.area.utility)}" placeholder="e.g. City of Irving"></label>
        <label class="field"><span>EWG report link (optional)</span><input id="pUrl" value="${esc(p.area.url)}" placeholder="https://www.ewg.org/tapwater/system.php?pws=…"></label>
      </div>
      <label class="field"><span>Report text</span><textarea id="pText" rows="8" placeholder="Paste everything you copied from the EWG utility page…"></textarea></label>
      <div id="pPrev" class="muted small">Contaminants we recognise will appear here.</div>
      <div class="row end gap"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="pUse" disabled>Use these results</button></div>`, { wide: true });
    let parsed = null;
    const ta = m.el.querySelector("#pText");
    ta.addEventListener("input", () => {
      parsed = EWGParse.parse(ta.value, SC.CONTAMINANTS);
      const n = parsed.contaminants.length;
      m.el.querySelector("#pUse").disabled = !n;
      m.el.querySelector("#pPrev").innerHTML = n ? `<b>${n} found:</b> ${parsed.contaminants.map((c) => `${esc(c.name)}${c.value != null ? ` (${fmtNum(c.value)} ${esc(c.unit)})` : ""}`).join(", ")}${parsed.served ? ` · serves ${esc(parsed.served)}` : ""}` : "No known contaminants found yet — make sure you copied the utility page (not the ZIP search list).";
    });
    m.el.querySelector("#pUse").onclick = () => {
      p.area.utility = m.el.querySelector("#pUtil").value.trim() || p.area.utility;
      p.area.url = m.el.querySelector("#pUrl").value.trim() || p.area.url || ewgSearchUrl(p.area.zip || p.customer.zip);
      if (parsed.served) p.area.served = parsed.served;
      if (parsed.source) p.area.source = parsed.source;
      p.area.contaminants = parsed.contaminants;
      p.area.pulledAt = Date.now();
      log(p, "EWG report pasted");
      persist(p); m.close(); renderProposal(p, "water");
    };
  }
  function contamAdd(p) {
    const m = modal(`<h3>Add a contaminant</h3>
      <label class="field"><span>Contaminant</span><select id="cName">${SC.CONTAMINANTS.map((c) => `<option>${esc(c.key)}</option>`).join("")}<option value="__other">Other…</option></select></label>
      <label class="field hidden" id="cOtherW"><span>Name</span><input id="cOther"></label>
      <div class="fgrid"><label class="field"><span>Level at this utility</span><input id="cVal" type="number" step="any"></label>
      <label class="field"><span>Unit</span><select id="cUnit"><option>ppb</option><option>ppm</option><option>ppt</option><option>pCi/L</option></select></label>
      <label class="field"><span>× EWG guideline (optional)</span><input id="cFac" type="number" step="any" placeholder="auto"></label></div>
      <div class="row end gap"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="cAdd">Add</button></div>`);
    const sel = m.el.querySelector("#cName"), unit = m.el.querySelector("#cUnit");
    const sync = () => { m.el.querySelector("#cOtherW").classList.toggle("hidden", sel.value !== "__other"); const lib = libOf(sel.value); if (lib.unit) unit.value = lib.unit; };
    sel.onchange = sync; sync();
    m.el.querySelector("#cAdd").onclick = () => {
      const name = sel.value === "__other" ? m.el.querySelector("#cOther").value.trim() : sel.value;
      if (!name) return toast("Name the contaminant");
      p.area.contaminants = (p.area.contaminants || []).filter((c) => c.name !== name);
      p.area.contaminants.push({ name, value: num(m.el.querySelector("#cVal").value), unit: unit.value, factor: num(m.el.querySelector("#cFac").value) });
      if (!p.area.url) p.area.url = ewgSearchUrl(p.area.zip || p.customer.zip || "");
      persist(p); m.close(); renderProposal(p, "water");
    };
  }

  /* ======================================================================
   * STEP: LEARN (education)
   * ==================================================================== */
  const TEST_FIX = {
    hardness: { fix: "Hydro Spring softening resin", why: "Ion exchange trades hardness minerals for sodium so scale can't build up in pipes, fixtures and appliances.", inc: "softener" },
    chlorine: { fix: "Coconut-shell carbon + RO carbon blocks", why: "Activated carbon adsorbs chlorine and chloramine — no more pool smell, dry skin or brittle hair.", inc: "carbon" },
    tds: { fix: "RO membrane (stage 4)", why: "The thin-film membrane rejects 95–99% of dissolved solids for crisp, clean drinking water.", inc: "ro" },
    iron: { fix: "Softening resin", why: "Low-to-moderate dissolved iron is exchanged out with hardness, ending orange stains.", inc: "softener" },
    ph: { fix: "Alkaline remineralizer (stage 6)", why: "Adds calcium and magnesium back and balances pH for great-tasting water.", inc: "alkaline" },
  };
  let roActive = 2, layerActive = 2, roTimer = null;
  function stepLearn(p) {
    const findings = [];
    SC.TESTS.forEach((d) => { if (testState(d, p.test[d.id]) === "bad") findings.push({ what: `${d.label} ${p.test[d.id]} ${d.unit}`.trim(), ...TEST_FIX[d.id] }); });
    (p.area.contaminants || []).forEach((c) => { const f = contamFactor(c); const lib = libOf(c.name); if (f != null && f > 1) findings.push({ what: `${c.name} · ${fmtX(f)}× guideline`, fix: lib.fix === "RO" ? "Reverse osmosis membrane" : lib.fix || "Reverse osmosis", why: `${lib.group || "Contaminant"}${lib.effect ? " linked to " + lib.effect.toLowerCase() + " risk" : ""}.`, inc: /RO/.test(lib.fix || "RO") ? "ro" : "carbon" }); });
    const inc = includesOf(chosenOpt(p));
    return `${stepHead("How it works", "From what we found to how we fix it", "Every stage has a job. Tap any stage to see exactly what it removes.")}
      ${findings.length ? `<div class="card"><h3>Your water → your solution</h3><div class="fixes">${findings.slice(0, 10).map((f) => `
        <div class="fix ${inc.has(f.inc) ? "covered" : ""}"><div class="fix-what">${ic("alert")}<b>${esc(f.what)}</b></div><div class="fix-arrow">${ic("next")}</div>
        <div class="fix-how"><b>${esc(f.fix)}</b><small>${esc(f.why)}</small></div>${inc.has(f.inc) ? `<span class="tag good">${ic("check")} Covered</span>` : `<span class="tag muted">Not in current option</span>`}</div>`).join("")}</div></div>` : ""}

      <div class="card">
        <div class="card-head"><div><div class="eyebrow">Drinking water · HW800 AlkaPro</div><h3>7-stage reverse osmosis</h3></div>
          <button class="btn ghost sm" data-act="ro-play">${ic("play")} Walk the stages</button></div>
        <div class="ro-flow">
          <div class="ro-pipe"><i></i></div>
          ${SC.RO_STAGES.map((s, i) => `<button class="ro-stage ${i === roActive ? "on" : ""}" data-act="ro" data-i="${i}" style="--sc:${s.color}"><span class="ro-can"></span><b>${s.n}</b><small>${esc(s.title)}</small></button>`).join("")}
          <div class="ro-tap">${ic("drop")}<small>Faucet</small></div>
        </div>
        <div class="ro-detail" id="roDetail">${roDetail(roActive)}</div>
      </div>

      <div class="card">
        <div class="eyebrow">Whole home · Hydro Spring softener</div><h3>Inside the tank</h3>
        <div class="tank-wrap">
          <div class="tank">
            ${SC.SOFTENER_LAYERS.map((l, i) => `<button class="layer l${i} ${i === layerActive ? "on" : ""}" data-act="layer" data-i="${i}" aria-label="${esc(l.title)}"><span>${esc(l.title.split(" — ")[0])}</span></button>`).join("")}
          </div>
          <div class="layer-detail" id="layerDetail">${layerDetail(layerActive)}</div>
        </div>
        <div class="specs">${SC.SPECS.map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join("")}</div>
      </div>

      <div class="card sheet">
        <div class="card-head"><div><div class="eyebrow">Product sheet</div><h3>Complete Home Softener & Filtration System</h3></div><button class="btn ghost sm" data-act="zoom" data-src="assets/product-sheet.jpg">${ic("expand")} Full screen</button></div>
        <img src="assets/product-sheet.jpg" alt="SafeCo Complete Home Softener and Filtration System product sheet" data-act="zoom" data-src="assets/product-sheet.jpg">
      </div>`;
  }
  function roDetail(i) {
    const s = SC.RO_STAGES[i];
    return `<div class="ro-d-head"><span class="ro-num">Stage ${s.n}</span><span class="tag cyan">${esc(s.tag)}</span></div><h4>${esc(s.title)}</h4><p>${esc(s.text)}</p><div class="chips">${s.removes.map((r) => `<span class="chip">${ic("check")} ${esc(r)}</span>`).join("")}</div>`;
  }
  function layerDetail(i) {
    const l = SC.SOFTENER_LAYERS[i];
    return `<h4>${esc(l.title)}</h4><ul class="checks">${l.points.map((x) => `<li>${ic("check")}${esc(x)}</li>`).join("")}</ul>`;
  }

  /* ======================================================================
   * STEP: BUILD (rep)
   * ==================================================================== */
  let buildTab = null;
  function stepBuild(p) {
    if (buildTab == null || buildTab >= p.options.length) buildTab = p.chosen != null ? p.chosen : 0;
    const o = p.options[buildTab];
    const s = settings;
    return `${stepHead("Step · Rep only", "Build the options", "Set up to three options. The monthly payment updates at your financing rate as you go. Prices can't go under the red line.")}
      <div class="tabs">${p.options.map((x, i) => `<button class="tab ${i === buildTab ? "on" : ""}" data-act="btab" data-i="${i}">${esc(x.label)} · ${esc(x.name)}${x.recommended ? " ★" : ""}</button>`).join("")}
        ${p.options.length < 4 ? `<button class="tab add" data-act="opt-add">${ic("plus")}</button>` : ""}</div>
      <div class="build">
        <div>
          <div class="card">
            <div class="fgrid">
              <label class="field"><span>Option label</span><input value="${esc(o.label)}" data-bind="options.${buildTab}.label"></label>
              <label class="field"><span>Option name</span><input value="${esc(o.name)}" data-bind="options.${buildTab}.name"></label>
            </div>
            <div class="row gap wrap mt">
              <label class="check"><input type="checkbox" ${o.recommended ? "checked" : ""} data-act-change="recommend" data-i="${buildTab}"> Recommended option</label>
              ${p.options.length > 1 ? `<button class="btn ghost sm" data-act="opt-del" data-i="${buildTab}">${ic("trash")} Remove option</button>` : ""}
            </div>
          </div>
          <div class="card">
            <h3>Products</h3>
            <div class="catalog">${s.products.map((pr) => {
              const on = o.items.some((i) => i.pid === pr.id);
              return `<div class="prod ${on ? "on" : ""}"><img src="${esc(pr.image || "assets/system.jpg")}" alt="">
                <div class="prod-body"><small>${esc(pr.category)}</small><b>${esc(pr.name)}</b><span class="muted">${esc(pr.short || "")}</span>
                <div class="prod-price"><b>${money(monthly(pr.price * (1 + s.taxRate / 100), bestPlan(s.financePlans)))}/mo</b><span>${money(pr.price)} retail</span></div></div>
                <button class="btn ${on ? "good" : "ghost"} sm" data-act="prod-toggle" data-pid="${pr.id}">${on ? ic("check") + " Added" : ic("plus") + " Add"}</button></div>`;
            }).join("")}</div>
          </div>
          <div class="card">
            <h3>Add-ons</h3>
            <div class="addons">${(s.addons || []).map((a) => `<label class="addon"><input type="checkbox" ${o.addons.includes(a.id) ? "checked" : ""} data-act-change="addon" data-id="${a.id}"><span>${esc(a.name)}</span><b>+${money(a.price)}</b></label>`).join("")}</div>
          </div>
        </div>
        <div>
          <div class="card sticky">
            <h3>Selected · ${esc(o.label)}</h3>
            ${o.items.length ? o.items.map((it, k) => `<div class="line">
              <div class="line-name"><b>${esc(it.name)}</b><small>${esc(it.category || "")}</small></div>
              <label class="price-in">$<input type="number" min="0" step="1" value="${it.price}" data-price="${buildTab}.${k}" aria-label="Price for ${esc(it.name)}"></label>
              <button class="icon-btn" data-act="item-del" data-k="${k}" aria-label="Remove">${ic("x")}</button>
              <div class="redline" data-live="redline" data-o="${buildTab}" data-k="${k}">${redlineMsg(p, { dataset: { o: buildTab, k } })}</div>
            </div>`).join("") : `<p class="muted">No products yet — add one from the catalog.</p>`}
            <div class="fgrid mt">
              <label class="field"><span>Installation (agreement line)</span><input type="number" min="0" value="${p.installFee || 0}" data-bind="installFee" data-num="1"></label>
            </div>
            <div data-live="buildTotals">${buildTotals(p)}</div>
          </div>
        </div>
      </div>`;
  }
  function redlineMsg(p, el) {
    const o = p.options[+el.dataset.o]; const it = o && o.items[+el.dataset.k];
    if (!it) return "";
    if (+it.price < +it.redLine) return `<span class="bad-t">${ic("alert")} Can't be below the ${money(it.redLine)} red line.</span>`;
    return `<span class="muted small">Retail ${money(settings.products.find((x) => x.id === it.pid)?.price ?? it.price)}</span>`;
  }
  function buildTotals(p) {
    const o = p.options[buildTab] || chosenOpt(p); const t = optTotals(p, o);
    return `<div class="totals">
      <div><span>Equipment</span><b>${money(t.items)}</b></div>
      ${t.add ? `<div><span>Add-ons</span><b>${money(t.add)}</b></div>` : ""}
      ${t.install ? `<div><span>Installation</span><b>${money(t.install)}</b></div>` : ""}
      <div><span>Sales tax (${S(p).taxRate}%)</span><b>${money(t.tax, 2)}</b></div>
      <div class="grand"><span>${o.items.length} product${o.items.length === 1 ? "" : "s"} selected</span><b>${money(fromMonthly(p, o))}/mo</b><small>${money(t.total)} total</small></div></div>`;
  }

  /* ======================================================================
   * STEP: OPTIONS
   * ==================================================================== */
  const FEATURES = [
    { inc: "softener", label: "Soft water at every tap — no scale, spots or dry skin" },
    { inc: "carbon", label: "Whole-home chlorine & chloramine removal" },
    { inc: "ro", label: "Pure RO drinking water — TDS, lead, PFAS, nitrates" },
    { inc: "alkaline", label: "Alkaline, mineral-rich drinking water" },
    { inc: "*", label: "Professional installation, startup & calibration" },
    { inc: "*", label: "1-year workmanship warranty + manufacturer warranty" },
  ];
  function stepOptions(p) {
    return `${stepHead("Your options", "Choose the system that fits your home", "Every option includes professional installation by trained SafeCo installers.")}
      <div class="opts n${p.options.length}">
        ${p.options.map((o, i) => {
          const t = optTotals(p, o), inc = includesOf(o), on = i === p.chosen;
          return `<div class="opt ${on ? "on" : ""} ${o.recommended ? "rec" : ""}">
            ${o.recommended ? `<div class="ribbon">${ic("star")} Most popular</div>` : ""}
            <div class="opt-label">${esc(o.label)}${on ? ` <span class="tag good">Your choice</span>` : ""}</div>
            <h3>${esc(o.name)}</h3>
            <div class="opt-price"><b>${money(fromMonthly(p, o))}</b><span>/mo with financing</span></div>
            <div class="muted">or ${money(t.total)} total</div>
            <ul class="opt-items">${o.items.map((it) => `<li><b>${esc(it.name)}</b>${(it.bullets || []).slice(0, 2).map((b) => `<small>${esc(b)}</small>`).join("")}</li>`).join("")}
              ${(o.addons || []).map((id) => { const a = (S(p).addons || []).find((x) => x.id === id); return a ? `<li><small>+ ${esc(a.name)}</small></li>` : ""; }).join("")}</ul>
            <ul class="feat">${FEATURES.map((f) => { const has = f.inc === "*" || inc.has(f.inc); return `<li class="${has ? "y" : "n"}">${ic(has ? "check" : "x")}${esc(f.label)}</li>`; }).join("")}</ul>
            <button class="btn block ${on ? "good" : o.recommended ? "" : "ghost"}" data-act="choose" data-i="${i}">${on ? ic("check") + " Selected" : "Choose " + esc(o.label)}</button>
          </div>`;
        }).join("")}
      </div>`;
  }

  /* ======================================================================
   * STEP: SAVINGS
   * ==================================================================== */
  function savingsModel(p) {
    const o = chosenOpt(p), s = p.savings, inc = includesOf(o);
    const hasRO = inc.has("ro"), hasSoft = inc.has("softener");
    const monthlyCurrent = (hasRO ? +s.bottled : 0) + (hasSoft ? +s.soaps + (+s.appliances + +s.energy) / 12 : 0);
    const upkeepYr = (hasSoft ? +s.upkeepSoftener : 0) + (hasRO ? +s.upkeepRO : 0);
    const t = optTotals(p, o);
    const plan = planOf(p) || { apr: 0, term: 1 };
    const down = p.payment.method === "full" ? 0 : Math.min(+p.payment.down || 0, t.total);
    const mo = monthly(t.total - down, plan);
    const months = (+s.years || 20) * 12, r = (+s.inflation || 0) / 100;
    let cur = 0, full = t.total, fin = down;
    const series = { cur: [0], full: [full], fin: [fin] };
    for (let m = 1; m <= months; m++) {
      const inf = Math.pow(1 + r, Math.floor((m - 1) / 12));
      cur += monthlyCurrent * inf;
      const up = (upkeepYr / 12) * inf;
      full += up; fin += up + (m <= plan.term ? mo : 0);
      series.cur.push(cur); series.full.push(full); series.fin.push(fin);
    }
    return { o, t, plan, mo, months, series, cur, full, fin, monthlyCurrent, upkeepYr, hasRO, hasSoft };
  }
  function breakEven(a, b) { // first month where b (system) drops to/below a (current) after being above
    for (let m = 1; m < a.length; m++) if (b[m - 1] > a[m - 1] && b[m] <= a[m]) return m;
    return null;
  }
  function chartSVG(M) {
    const W = 860, H = 330, L = 64, R = 18, T = 18, B = 36;
    const max = Math.max(...M.series.cur, ...M.series.full, ...M.series.fin, 1);
    const step = Math.pow(10, Math.floor(Math.log10(max))) / 2;
    const yMax = Math.ceil(max / step) * step;
    const x = (m) => L + (m / M.months) * (W - L - R), y = (v) => T + (1 - v / yMax) * (H - T - B);
    const path = (arr) => arr.map((v, m) => `${m ? "L" : "M"}${x(m).toFixed(1)},${y(v).toFixed(1)}`).join("");
    const ticks = 4; let grid = "";
    for (let i = 0; i <= ticks; i++) { const v = (yMax / ticks) * i; grid += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" class="ax">${v >= 1000 ? "$" + Math.round(v / 1000) + "k" : "$" + Math.round(v)}</text>`; }
    let xt = ""; const yrs = M.months / 12;
    for (let yr = 0; yr <= yrs; yr += 5) xt += `<text x="${x(yr * 12)}" y="${H - 10}" text-anchor="middle" class="ax">${yr === 0 ? "Today" : "Yr " + yr}</text>`;
    const dots = [["full", "c-full"], ["fin", "c-fin"]].map(([k, cls]) => { const m = breakEven(M.series.cur, M.series[k]); return m ? `<circle cx="${x(m)}" cy="${y(M.series[k][m])}" r="6" class="dot ${cls}"><title>Break-even: year ${(m / 12).toFixed(1)}</title></circle>` : ""; }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Cumulative cost over ${yrs} years">
      ${grid}${xt}
      <path d="${path(M.series.cur)}" class="ln c-cur"/><path d="${path(M.series.fin)}" class="ln c-fin"/><path d="${path(M.series.full)}" class="ln c-full"/>${dots}</svg>`;
  }
  function savingsBlock(p) {
    const M = savingsModel(p);
    if (!M.monthlyCurrent) return `<p class="muted">Choose an option with a softener or RO system to see the savings comparison.</p>`;
    const saveFull = M.cur - M.full, saveFin = M.cur - M.fin, best = Math.max(saveFull, saveFin);
    const be = breakEven(M.series.cur, M.series.full);
    const yrs = M.months / 12;
    return `<div class="save-hero"><div class="eyebrow">Best net savings over ${yrs} years</div><div class="save-big">${money(Math.max(0, best))}</div><div class="muted">vs. ${money(M.cur)} spent doing nothing</div></div>
      <div class="chart-wrap">${chartSVG(M)}
        <div class="legend"><span><i class="c-cur"></i>Current spending</span><span><i class="c-full"></i>Pay in full</span><span><i class="c-fin"></i>Finance plan (${money(M.mo)}/mo)</span><span class="muted">● break-even — where the system has paid for itself</span></div></div>
      <div class="stats s3">
        <div class="stat"><span>You spend today</span><b>${money(M.monthlyCurrent)}/mo</b><small>on what this system replaces</small></div>
        <div class="stat"><span>Pays for itself</span><b>${be ? "Year " + (be / 12).toFixed(1) : "—"}</b><small>when paid in full</small></div>
        <div class="stat"><span>Finance plan</span><b>${money(saveFin)}</b><small>net ${yrs}-yr savings at ${money(M.mo)}/mo</small></div>
      </div>`;
  }
  function stepSavings(p) {
    const M = savingsModel(p);
    const s = p.savings;
    const slider = (key, label, max, stp, unit, show = true) => show ? `<label class="slide"><span>${label}</span><div><input type="range" min="0" max="${max}" step="${stp}" value="${s[key]}" data-bind="savings.${key}" data-num="1"><input type="number" min="0" step="${stp}" value="${s[key]}" data-bind="savings.${key}" data-num="1"><em>${unit}</em></div></label>` : "";
    return `${stepHead("Value comparison", "Close on the savings", "A side-by-side look at what you spend today versus owning your SafeCo system. Adjust the numbers to match your household.")}
      <div class="savings">
        <div class="card"><div data-live="savings">${savingsBlock(p)}</div></div>
        <div class="card">
          <h3>Your household today</h3>
          ${slider("bottled", "Bottled water, pitchers & filters", 200, 5, "$/mo", M.hasRO)}
          ${slider("soaps", "Extra soap, detergent & cleaners", 120, 5, "$/mo", M.hasSoft)}
          ${slider("appliances", "Appliance wear, repairs & fixtures", 1200, 25, "$/yr", M.hasSoft)}
          ${slider("energy", "Water heater energy lost to scale", 600, 10, "$/yr", M.hasSoft)}
          <h3 class="mt">System upkeep</h3>
          ${slider("upkeepSoftener", "Salt & softener upkeep", 400, 10, "$/yr", M.hasSoft)}
          ${slider("upkeepRO", "RO filter changes", 300, 10, "$/yr", M.hasRO)}
          ${slider("inflation", "Yearly price increases", 8, 0.5, "%")}
          <p class="muted small">Estimates for illustration, based on the household amounts above. Actual savings vary.</p>
        </div>
      </div>`;
  }

  /* ======================================================================
   * STEP: PAYMENT
   * ==================================================================== */
  function stepPayment(p) {
    const s = S(p), o = chosenOpt(p), t = optTotals(p, o);
    const pm = p.payment;
    return `${stepHead("Last step before signing", "How would you like to move forward?", "Choose how you'd like to pay. Financing offers are subject to credit approval.")}
      <div class="pay">
        <div>
          <div class="pay-opts">
            ${(s.financePlans || []).map((pl) => {
              const on = pm.method === "finance" && pm.planId === pl.id;
              const mo = monthly(t.total - (+pm.down || 0), pl);
              return `<button class="pay-opt ${on ? "on" : ""}" data-act="plan" data-id="${pl.id}">
                <span class="radio"></span><div><b>${esc(pl.label)}</b><small>${esc(pl.lender)} · ${pl.apr}% APR · ${pl.term} months</small></div>
                <div class="pay-mo"><b>${money(mo)}</b><small>/mo</small></div></button>`;
            }).join("")}
            <button class="pay-opt ${pm.method === "full" ? "on" : ""}" data-act="plan-full"><span class="radio"></span><div><b>Pay in full</b><small>Card, check or bank transfer</small></div><div class="pay-mo"><b>${money(t.total)}</b><small>total</small></div></button>
          </div>
          ${pm.method === "finance" ? `<div class="card mt">
            <label class="slide"><span>Down payment</span><div><input type="range" min="0" max="${Math.round(t.total)}" step="50" value="${pm.down || 0}" data-bind="payment.down" data-num="1"><input type="number" min="0" step="50" value="${pm.down || 0}" data-bind="payment.down" data-num="1"><em>$</em></div></label>
            ${(() => { const pl = planOf(p); return pl && pl.applyUrl ? `<a class="btn" target="_blank" rel="noopener" href="${esc(pl.applyUrl)}">${ic("ext")} Apply for financing with ${esc(pl.lender)}</a>` : ""; })()}
            <p class="muted small">For illustration only — not an offer of credit. Subject to credit approval. Payment shown is an estimate based on the APR and term selected.</p>
          </div>` : ""}
        </div>
        <div class="card sticky" data-live="payment">${paymentSummary(p)}</div>
      </div>`;
  }
  function paymentSummary(p) {
    const F = financeFigures(p);
    return `<div class="eyebrow">Investment summary</div><h3>${esc(F.o.label)} · ${esc(F.o.name)}</h3>
      <div class="totals">
        <div><span>Equipment</span><b>${money(F.t.equipment, 2)}</b></div>
        <div><span>Installation</span><b>${money(F.t.install, 2)}</b></div>
        <div><span>Sales tax</span><b>${money(F.t.tax, 2)}</b></div>
        <div class="grand"><span>Total investment</span><b>${money(F.t.total, 2)}</b></div>
        ${F.plan ? `<div><span>Down payment</span><b>${money(F.down, 2)}</b></div>
          <div><span>Amount financed</span><b>${money(F.financed, 2)}</b></div>
          <div><span>Finance company</span><b>${esc(F.plan.lender)}</b></div>
          <div><span>APR · Term</span><b>${F.plan.apr}% · ${F.plan.term} mo</b></div>
          <div class="grand"><span>Estimated monthly</span><b>${money(F.mo, 2)}/mo</b></div>` : `<div><span>Paid at signing</span><b>Full amount</b></div>`}
      </div>`;
  }

  /* ======================================================================
   * STEP: SIGN
   * ==================================================================== */
  const ACCEPT = [
    ["scope", "I have reviewed the scope of work and system specifications."],
    ["location", "The installation location has been approved by me."],
    ["warranty", "I have received the warranty information."],
    ["operation", "The system operation and maintenance were explained to me."],
  ];
  const CHECKLIST = ["Water Supply Available", "Drain Available", "Electrical Outlet Available", "Installation Location Approved", "Existing Equipment Disclosed", "Customer Walkthrough Scheduled"];
  function sigBox(p, key, label) {
    const sg = p.sigs[key];
    const locked = !!p.signedAt;
    return `<div class="sig ${sg ? "has" : ""}">
      <small>${label}</small>
      ${sg ? `<div class="sig-art">${sigMarkup(sg)}</div><div class="sig-meta">${esc(sg.name)} · ${esc(fmtDate(sg.at))}</div>` : `<div class="sig-empty">Tap to sign</div>`}
      ${locked ? "" : `<button class="sig-btn" data-act="sign" data-k="${key}">${sg ? "Re-sign" : ic("pen") + " Sign"}</button>`}
    </div>`;
  }
  function stepSign(p) {
    const F = financeFigures(p), inc = includesOf(F.o), c = p.customer;
    const ini = p.initialsText || initialsOf(c.name);
    const signed = !!p.signedAt;
    const ready = p.sigs.customer && ACCEPT.every(([k]) => p.initials[k]) && c.name;
    return `${stepHead("Residential installation & material fulfillment agreement", signed ? "Agreement signed — welcome to better water." : "Review and sign", signed ? `Signed ${esc(fmtDate(p.signedAt))}. A copy is ready to download or print.` : "Review the details, initial each acknowledgment and sign with your finger, stylus or by typing.")}
      ${signed ? `<div class="card success">
        <div class="success-ic">${ic("check")}</div>
        <div><h3>${esc(c.name)} is all set</h3><p class="muted">${esc(F.o.name)} · ${money(F.t.total, 2)}${F.plan ? ` · ${money(F.mo)}/mo` : ""}</p></div>
        <div class="row gap wrap">
          <a class="btn" href="${mode === "client" ? "#/c/doc" : "#/doc/" + p.id}">${ic("print")} View / save PDF</a>
          ${p.site.installDate ? `<a class="btn ghost" target="_blank" rel="noopener" href="${esc(gcalLink(p))}">${ic("cal")} Add install to calendar</a>` : ""}
          ${mode === "client" ? `<button class="btn ghost" data-act="send-back">${ic("share")} Send signed copy to SafeCo</button>` : `<button class="btn ghost" data-act="mark-installed">${ic("check")} Mark installed</button><button class="btn ghost" data-act="unsign">Reopen agreement</button>`}
        </div></div>` : ""}
      <div class="grid2">
        <div class="card">
          <h3>System selection</h3>
          <ul class="checks">
            ${[["bundle", "SafeCo Complete Home Water Filtration System", inc.has("softener") && inc.has("ro")], ["softener", "48,000 Grain Water Softener", inc.has("softener")], ["carbon", "Coconut Shell Carbon Filtration", inc.has("carbon")], ["ro", "Reverse Osmosis Drinking Water System", inc.has("ro")], ["alkaline", "Alkaline Remineralization System", inc.has("alkaline")], ["install", "Professional Installation", true]]
              .map(([, l, on]) => `<li class="${on ? "" : "off"}">${ic(on ? "check" : "x")}${esc(l)}</li>`).join("")}
          </ul>
          <h3 class="mt">Scope of work</h3>
          <p class="small">SafeCo SmartWater Systems will furnish all materials and labor to install the equipment listed above. Work to include standard installation as outlined below. Any additional work will require a written change order.</p>
          <details class="terms"><summary>Included installation, warranty & terms</summary>${termsHTML()}</details>
        </div>
        <div class="card">${paymentSummary(p)}</div>
      </div>
      <div class="grid2">
        <div class="card">
          <h3>Site details</h3>
          <div class="fgrid">
            ${field("Number of people in home", "site.people", { type: "number", num: true })}
            ${field("Flooring type", "site.flooring", { select: [["", "—"], "Raised", "Concrete Slab"] })}
            ${field("Ice maker hook-up", "site.ice", { select: [["", "—"], "Yes", "No"] })}
            ${field("Installation date", "site.installDate", { type: "date" })}
            ${field("Other / notes", "site.notes", { textarea: true, rows: 2, cls: "span2" })}
          </div>
          ${isRep() ? `<h3 class="mt">Installation checklist</h3><div class="addons">${CHECKLIST.map((x, i) => `<label class="addon"><input type="checkbox" ${p.checklist[i] ? "checked" : ""} data-act-change="checklist" data-i="${i}"><span>${esc(x)}</span></label>`).join("")}</div>` : ""}
        </div>
        <div class="card">
          <h3>Customer acceptance</h3>
          <p class="muted small">Tap each box to initial.</p>
          <label class="field inline"><span>Initials</span><input value="${esc(ini)}" maxlength="4" data-bind="initialsText" style="width:5em" ${signed ? "disabled" : ""}></label>
          <div class="accept">${ACCEPT.map(([k, l]) => `<button class="init ${p.initials[k] ? "on" : ""}" data-act="initial" data-k="${k}" ${signed ? "disabled" : ""}><span class="init-box">${esc(p.initials[k] || "")}</span><span>${esc(l)}</span></button>`).join("")}</div>
        </div>
      </div>
      <div class="card">
        <h3>Signatures</h3>
        <p class="muted small">By signing below, the parties agree to the terms and conditions of this Residential Installation & Material Fulfillment Agreement.</p>
        <div class="sigs">
          ${sigBox(p, "customer", "Customer signature")}
          ${c.co ? sigBox(p, "co", "Co-customer signature") : ""}
          ${isRep() ? sigBox(p, "rep", "Sales rep signature") : ""}
        </div>
        ${signed ? "" : `<div class="row end mt"><button class="btn lg ${ready ? "" : "disabled"}" data-act="finalize">${ic("pen")} Sign agreement</button></div>
        ${ready ? "" : `<p class="muted small right">${!c.name ? "Add the customer name. " : ""}${ACCEPT.every(([k]) => p.initials[k]) ? "" : "Initial all four boxes. "}${p.sigs.customer ? "" : "Customer signature required."}</p>`}`}
      </div>`;
  }
  function termsHTML() {
    return `<div class="terms-grid">
      <div><h4>Included installation</h4><ul class="checks">${["Delivery of Equipment", "Standard Installation", "Plumbing Connections", "System Startup & Testing", "Pressure & Leak Test", "System Calibration", "Customer Orientation", "Work Area Cleanup", "Warranty Registration"].map((x) => `<li>${ic("check")}${x}</li>`).join("")}</ul><p class="small">All work is performed by trained SafeCo SmartWater Systems installers.</p></div>
      <div><h4>Workmanship warranty</h4><p class="small">SafeCo SmartWater Systems warrants its workmanship for a period of ONE (1) YEAR from the date of installation. Manufacturer warranties apply to equipment components in accordance with the manufacturer's written warranty.</p>
      <h4>Existing conditions</h4><p class="small">SafeCo SmartWater Systems is not responsible for existing plumbing defects, corrosion, leaks, code violations, low water pressure, mold, structural conditions or other issues that are not caused by our installation. Any additional work required to address these conditions will be completed only with customer approval on a change order.</p>
      <h4>Sales organization responsibilities</h4><p class="small">The Sales Organization is responsible for all product representations, pricing, financing presentation, measurements, and promises made prior to installation. SafeCo SmartWater Systems is only responsible for the installation of the equipment and services outlined in this written agreement.</p></div></div>`;
  }
  function gcalLink(p) {
    const d = (p.site.installDate || "").replace(/-/g, "");
    if (!d) return "#";
    const nd = new Date(p.site.installDate + "T12:00"); nd.setDate(nd.getDate() + 1);
    const e = nd.toISOString().slice(0, 10).replace(/-/g, "");
    const c = p.customer;
    const q = new URLSearchParams({ action: "TEMPLATE", text: `SafeCo install · ${c.name}`, dates: `${d}/${e}`, details: `${chosenOpt(p).name}\n${c.phone || ""}\nOrder ${p.order}`, location: [c.address, c.city, c.state, c.zip].filter(Boolean).join(", ") });
    return "https://calendar.google.com/calendar/render?" + q.toString();
  }

  /* ---------- signature pad ---------- */
  function openSignPad(title, defName, onDone) {
    const m = modal(`<h3>${esc(title)}</h3>
      <label class="field"><span>Your full name</span><input id="sgName" value="${esc(defName || "")}"></label>
      <div class="seg"><button class="on" data-tab="draw">Draw signature</button><button data-tab="type">Type to sign</button></div>
      <div class="pad" id="sgDraw"><canvas id="sgCanvas"></canvas><div class="pad-line"></div><button class="btn ghost sm pad-clear" id="sgClear">Clear</button></div>
      <div class="pad typed hidden" id="sgType"><div class="typed-sig" id="sgPrev"></div><div class="pad-line"></div></div>
      <p class="muted small">Use your finger or stylus to draw your signature above. By applying your signature you agree to the terms outlined in the agreement.</p>
      <div class="row end gap"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="sgApply">Apply signature</button></div>`, { wide: true });
    const el = m.el, cv = el.querySelector("#sgCanvas"), ctx = cv.getContext("2d");
    let tab = "draw", drawing = false, strokes = [];
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const size = () => { const r = cv.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0b1a2e"; ctx.fillStyle = "#0b1a2e"; ctx.lineWidth = 2.6; strokes = []; };
    requestAnimationFrame(size);
    const pt = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener("pointerdown", (e) => { drawing = true; cv.setPointerCapture(e.pointerId); const p0 = pt(e); strokes.push([p0]); ctx.beginPath(); ctx.arc(p0[0], p0[1], 1.3, 0, Math.PI * 2); ctx.fill(); });
    cv.addEventListener("pointermove", (e) => {
      if (!drawing) return;
      const s = strokes[strokes.length - 1], last = s[s.length - 1], p2 = pt(e);
      if (Math.hypot(p2[0] - last[0], p2[1] - last[1]) < 1.5) return;
      ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); s.push(p2);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => cv.addEventListener(ev, () => (drawing = false)));
    el.querySelector("#sgClear").onclick = () => { ctx.clearRect(0, 0, cv.width, cv.height); strokes = []; };
    const nameIn = el.querySelector("#sgName"), prev = el.querySelector("#sgPrev");
    const syncPrev = () => (prev.textContent = nameIn.value || "Your name");
    nameIn.addEventListener("input", syncPrev); syncPrev();
    el.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { tab = b.dataset.tab; el.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("on", x === b)); el.querySelector("#sgDraw").classList.toggle("hidden", tab !== "draw"); el.querySelector("#sgType").classList.toggle("hidden", tab !== "type"); }));
    el.querySelector("#sgApply").onclick = () => {
      const name = nameIn.value.trim();
      if (!name) return toast("Enter your full name");
      const sg = { name, at: Date.now(), method: tab };
      if (tab === "draw") {
        if (!strokes.length) return toast("Draw your signature first");
        sg.svg = strokesToSvg(strokes);
      }
      m.close(); onDone(sg);
    };
  }
  /* drawn signatures are stored as a compact SVG path (a few KB) so links stay short */
  function strokesToSvg(strokes) {
    const all = strokes.flat();
    const x0 = Math.min(...all.map((q) => q[0])), y0 = Math.min(...all.map((q) => q[1]));
    const x1 = Math.max(...all.map((q) => q[0])), y1 = Math.max(...all.map((q) => q[1]));
    const pad = 4, k = Math.min(1, 100 / Math.max(1, y1 - y0 + pad * 2));
    const f = (v, o) => Math.round((v - o + pad) * k);
    const d = strokes.map((s) => s.length === 1 ? `M${f(s[0][0], x0)} ${f(s[0][1], y0)}h0` : s.map((q, i) => `${i ? "L" : "M"}${f(q[0], x0)} ${f(q[1], y0)}`).join("")).join("");
    return { w: Math.round((x1 - x0 + pad * 2) * k), h: Math.round((y1 - y0 + pad * 2) * k), d };
  }
  function sigMarkup(sg) {
    if (!sg) return "";
    if (sg.svg) return `<svg class="sig-svg" viewBox="0 0 ${sg.svg.w} ${sg.svg.h}" role="img" aria-label="Signature of ${esc(sg.name)}"><path d="${esc(sg.svg.d)}"/></svg>`;
    if (sg.img) return `<img src="${esc(sg.img)}" alt="Signature of ${esc(sg.name)}">`;
    return `<span class="sig-typed">${esc(sg.name)}</span>`;
  }

  /* ======================================================================
   * AGREEMENT DOCUMENT (print / save as PDF)
   * ==================================================================== */
  function renderDoc(p) {
    document.body.classList.add("doc-mode");
    const c = S(p).company, cu = p.customer, F = financeFigures(p), inc = includesOf(F.o);
    const box = (on) => `<span class="dbox">${on ? "✔" : ""}</span>`;
    const val = (v) => `<span class="dval">${esc(v || "")}</span>`;
    const sig = (k) => sigMarkup(p.sigs[k]);
    const sigDate = (k) => p.sigs[k] ? fmtDate(p.sigs[k].at) : "";
    const specs = inc.has("softener") ? SC.SPECS : SC.RO_STAGES.map((s) => ["Stage " + s.n, s.title]);
    const header = (page) => `<div class="d-head"><img src="assets/logo.png" alt="SafeCo SmartWater Systems"><div class="d-badges"><span>PREMIUM<br>EQUIPMENT</span><span>PROFESSIONAL<br>INSTALLATION</span><span>BETTER WATER.<br>BETTER LIVING.</span></div></div>
      <div class="d-title"><b>${page === 1 ? "RESIDENTIAL INSTALLATION &amp; MATERIAL FULFILLMENT AGREEMENT" : "TERMS, CONDITIONS &amp; SIGNATURES"}</b><span>PAGE ${page} OF 2</span></div>`;
    $("#view").innerHTML = `
      <div class="doc-bar no-print">
        <a class="btn ghost" href="${mode === "client" ? "#/c/sign" : "#/p/" + p.id + "/sign"}">${ic("back")} Back to proposal</a>
        <span class="grow"></span>
        <button class="btn" data-act="print">${ic("print")} Print / Save as PDF</button>
      </div>
      <div class="doc">
        <section class="dpage">
          ${header(1)}
          <div class="d-row">
            <div class="d-box grow2"><h5>CUSTOMER INFORMATION</h5>
              <div class="d-grid2"><div>Customer Name: ${val(cu.name)}</div><div>Co-Customer Name: ${val(cu.co)}</div><div>Phone: ${val(cu.phone)}</div><div>Email: ${val(cu.email)}</div></div>
              <div>Installation Address: ${val(cu.address)}</div>
              <div class="d-grid3"><div>City: ${val(cu.city)}</div><div>State: ${val(cu.state)}</div><div>Zip: ${val(cu.zip)}</div></div></div>
            <div class="d-box"><div>Agreement Date: ${val(fmtDate(p.signedAt || Date.now()))}</div><div>Installation Date: ${val(p.site.installDate ? fmtDate(p.site.installDate + "T12:00") : "")}</div><div>Sales Organization: ${val(p.salesOrg || c.salesOrg)}</div><div>Sales Representative: ${val(p.rep)}</div><div>Project / Order #: ${val(p.order)}</div></div>
          </div>
          <div class="d-row">
            <div class="d-box"><h5>SYSTEM SELECTION <small>INCLUDED IN THIS AGREEMENT</small></h5>
              ${[["SafeCo Complete Home Water Filtration System", inc.has("softener") && inc.has("ro")], ["48,000 Grain Water Softener", inc.has("softener")], ["Coconut Shell Carbon Filtration", inc.has("carbon")], ["Reverse Osmosis Drinking Water System", inc.has("ro")], ["Alkaline Remineralization System", inc.has("alkaline")], ["Professional Installation", true]].map(([l, on]) => `<div class="d-check">${box(on)}${l}</div>`).join("")}</div>
            <div class="d-box"><h5>SYSTEM SPECIFICATIONS</h5><table class="d-specs">${specs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table></div>
            <div class="d-img"><img src="assets/system.jpg" alt=""></div>
          </div>
          <div class="d-row">
            <div class="d-box grow2"><h5>SCOPE OF WORK</h5><p>SafeCo SmartWater Systems will furnish all materials and labor to install the equipment listed above. Work to include standard installation as outlined below. Any additional work will require a written change order.</p>
              <p class="d-items"><b>${esc(F.o.label)} · ${esc(F.o.name)}:</b> ${F.o.items.map((i) => esc(i.name)).join(", ")}${(F.o.addons || []).map((id) => { const a = (S(p).addons || []).find((x) => x.id === id); return a ? ", " + esc(a.name) : ""; }).join("")}</p></div>
            <div class="d-box"><h5>INVESTMENT SUMMARY</h5>
              <div class="d-money"><span>Equipment:</span>${val(money(F.t.equipment, 2))}</div><div class="d-money"><span>Installation:</span>${val(money(F.t.install, 2))}</div>
              <div class="d-money"><span>Sales Tax (if applicable):</span>${val(money(F.t.tax, 2))}</div><div class="d-money total"><span>TOTAL INVESTMENT:</span>${val(money(F.t.total, 2))}</div>
              <div class="d-money"><span>Down Payment:</span>${val(F.plan ? money(F.down, 2) : money(F.t.total, 2))}</div><div class="d-money"><span>Amount Financed:</span>${val(money(F.financed, 2))}</div>
              <div class="d-money"><span>Finance Company:</span>${val(F.plan ? F.plan.lender : "N/A — paid in full")}</div><div class="d-money"><span>APR:</span>${val(F.plan ? F.plan.apr + "%" : "")}</div><div class="d-money"><span>Term (Months):</span>${val(F.plan ? F.plan.term : "")}</div></div>
          </div>
          <div class="d-row">
            <div class="d-box"><h5>INSTALLATION CHECKLIST</h5>${CHECKLIST.map((x, i) => `<div class="d-check">${box(p.checklist[i])}${x}</div>`).join("")}</div>
            <div class="d-box grow2"><h5>SITE DETAILS</h5><div>Number of people in home: ${val(p.site.people)}</div>
              <div>Flooring Type: ${box(p.site.flooring === "Raised")} Raised ${box(p.site.flooring === "Concrete Slab")} Concrete Slab</div>
              <div>Ice Maker Hook-up: ${box(p.site.ice === "Yes")} Yes ${box(p.site.ice === "No")} No</div>
              <div>Hardness (Grains): ${val(p.test.hardness)}</div><div>Other / Notes: ${val(p.site.notes)}</div></div>
          </div>
          <div class="d-foot"><div><b>THANK YOU</b><br>We appreciate your trust in SafeCo SmartWater Systems. Better water. Better life.</div><div><b>CONTACT US</b><br>☎ ${esc(c.phone)}<br>${esc(c.website)}</div><div><b>VISIT US</b><br>${esc(c.address)}</div></div>
        </section>
        <section class="dpage">
          ${header(2)}
          <div class="d-sub">Residential Installation &amp; Material Fulfillment Agreement · Customer: ${esc(cu.name)}</div>
          <div class="d-row">
            <div class="d-box"><h5>INCLUDED INSTALLATION</h5>${["Delivery of Equipment", "Standard Installation", "Plumbing Connections", "System Startup & Testing", "Pressure & Leak Test", "System Calibration", "Customer Orientation", "Work Area Cleanup", "Warranty Registration"].map((x) => `<div class="d-check">${box(true)}${x}</div>`).join("")}<p class="small">All work is performed by trained SafeCo SmartWater Systems installers.</p></div>
            <div class="d-box"><h5>WORKMANSHIP WARRANTY</h5><p>SafeCo SmartWater Systems warrants its workmanship for a period of ONE (1) YEAR from the date of installation.</p><p>Manufacturer warranties apply to equipment components in accordance with the manufacturer's written warranty.</p>
              <h5>EXISTING CONDITIONS</h5><p>SafeCo SmartWater Systems is not responsible for existing plumbing defects, corrosion, leaks, code violations, low water pressure, mold, structural conditions or other issues that are not caused by our installation. Any additional work required to address these conditions will be completed only with customer approval on a change order.</p></div>
            <div class="d-box"><h5>SALES ORGANIZATION RESPONSIBILITIES</h5><p>The Sales Organization is responsible for all product representations, pricing, financing presentation, measurements, and promises made prior to installation.</p><p>SafeCo SmartWater Systems is only responsible for the installation of the equipment and services outlined in this written agreement.</p>
              <h5>CUSTOMER ACCEPTANCE</h5><p>By initialing below, customer acknowledges:</p>${ACCEPT.map(([k, l]) => `<div class="d-init"><span class="d-ini">${esc(p.initials[k] || "")}</span>${esc(l)}</div>`).join("")}</div>
          </div>
          <div class="d-box"><h5>SIGNATURES</h5><p>By signing below, the parties agree to the terms and conditions of this Residential Installation &amp; Material Fulfillment Agreement.</p>
            <div class="d-sigs">
              <div><div class="d-sigline">${sig("customer")}</div><span>Customer Signature</span><span>Date: ${esc(sigDate("customer"))}</span></div>
              <div><div class="d-sigline">${sig("co")}</div><span>Co-Customer Signature</span><span>Date: ${esc(sigDate("co"))}</span></div>
              <div><div class="d-sigline">${sig("rep")}</div><span>Sales Rep Signature</span><span>Date: ${esc(sigDate("rep"))}</span></div>
              <div><div class="d-sigline"></div><span>SafeCo Rep Signature</span><span>Date:</span></div>
            </div>
            ${p.signedAt ? `<p class="small muted">Electronically signed ${esc(new Date(p.signedAt).toLocaleString())} · Order ${esc(p.order)}</p>` : ""}</div>
          <div class="d-foot"><div><b>QUALITY. INTEGRITY. SERVICE.</b><br>SafeCo SmartWater Systems is committed to providing you with the highest quality water and the best customer experience.</div><div><b>FOR SUPPORT</b><br>Call ${esc(c.phone)}<br>${esc(c.hours)}<br>${esc(c.website.toUpperCase())}</div></div>
        </section>
      </div>`;
    window.scrollTo(0, 0);
  }

  /* ======================================================================
   * SHARE / REMOTE
   * ==================================================================== */
  function snapshot() {
    const s = settings;
    return { company: s.company, financePlans: s.financePlans, taxRate: s.taxRate, addons: s.addons };
  }
  async function shareProposal(p) {
    if (!p.customer.name) toast("Tip: add the homeowner's name first");
    const pub = clone(p);
    pub.options.forEach((o) => o.items.forEach((i) => { delete i.redLine; delete i.image; }));
    delete pub.history;
    if (!pub.signedAt) { pub.sigs = {}; pub.initials = {}; }
    const link = baseUrl() + "#/share/" + (await encode({ v: 1, p: pub, snap: snapshot() }));
    if (["draft", "presented"].includes(p.status)) { p.status = "sent"; }
    log(p, "Proposal link created"); persistNow();
    const first = (p.customer.name || "").split(" ")[0] || "there";
    const msg = `Hi ${first}, here's your SafeCo SmartWater proposal. You can walk through your water report, compare options and sign right from your phone: ${link}`;
    const tel = (p.customer.phone || "").replace(/[^\d+]/g, "");
    modal(`<h3>Send to ${esc(p.customer.name || "homeowner")}</h3>
      <p class="muted">They'll walk the same guided sequence — water report, options, savings and payment — and can sign at the bottom.</p>
      ${location.protocol === "file:" ? `<p class="warn">${ic("alert")} You're running the app from a local file, so this link only works on this computer. Host the app (see README) to send real links.</p>` : ""}
      <div class="linkbox"><input readonly value="${esc(link)}" onclick="this.select()"><button class="btn" data-copy>${ic("copy")} Copy</button></div>
      <div class="row gap wrap mt">
        <a class="btn ghost" href="sms:${esc(tel)}?&body=${encodeURIComponent(msg)}">${ic("msg")} Text it</a>
        <a class="btn ghost" href="mailto:${esc(p.customer.email)}?subject=${encodeURIComponent("Your SafeCo SmartWater proposal")}&body=${encodeURIComponent(msg)}">${ic("mail")} Email it</a>
        <a class="btn ghost" href="${esc(link)}" target="_blank" rel="noopener">${ic("ext")} Preview as homeowner</a>
      </div>
      <p class="muted small mt">The proposal travels inside the link — nothing is uploaded. When the homeowner signs, they'll send you a "signed" link; open it or use <b>Import signed link</b> on the pipeline to bring it in.</p>`, { wide: true }).el.querySelector("[data-copy]").onclick = () => copyText(link);
  }
  async function openShared(payload) {
    try {
      const data = await decode(payload);
      const incoming = data.p; incoming.snap = data.snap;
      if (!clientP || clientP.id !== incoming.id || !clientP.signedAt) clientP = incoming;
      LS.set("sc_client", clientP);
      history.replaceState(null, "", baseUrl() + "#/c/cover");
    } catch (e) { $("#view").innerHTML = emptyClient("This proposal link looks incomplete. Ask your SafeCo specialist to resend it."); return; }
    route();
  }
  function emptyClient(msg) {
    return `<section class="page"><div class="empty card"><img src="assets/logo.png" alt="" style="max-width:320px;background:#081427;padding:16px;border-radius:12px"><h2>${esc(msg || "No proposal on this device yet")}</h2><p>Open the link your SafeCo specialist sent you.</p><a class="btn ghost" href="#/">I'm a SafeCo rep</a></div></section>`;
  }
  async function sendBack(p) {
    const link = baseUrl() + "#/return/" + (await encode({ v: 1, p }));
    const c = S(p).company;
    const body = `Signed SafeCo agreement from ${p.customer.name} (order ${p.order}). Open this link to import it: ${link}`;
    modal(`<h3>Send your signed copy to SafeCo</h3><p class="muted">Send this link to your specialist so the signed agreement lands in their system. Also download a PDF copy for your records.</p>
      <div class="linkbox"><input readonly value="${esc(link)}" onclick="this.select()"><button class="btn" data-copy>${ic("copy")} Copy</button></div>
      <div class="row gap wrap mt">
        <a class="btn ghost" href="mailto:${esc(c.email || "")}?subject=${encodeURIComponent("Signed agreement · " + p.customer.name)}&body=${encodeURIComponent(body)}">${ic("mail")} Email</a>
        <a class="btn ghost" href="sms:?&body=${encodeURIComponent(body)}">${ic("msg")} Text</a>
        <a class="btn ghost" href="#/c/doc">${ic("print")} Download PDF</a>
      </div>`, { wide: true }).el.querySelector("[data-copy]").onclick = () => copyText(link);
  }
  async function importReturned(payload) {
    mode = "rep";
    try {
      const data = await decode(payload);
      const inc = data.p; delete inc.snap;
      const ex = findP(inc.id);
      if (ex) {
        Object.assign(ex, { chosen: inc.chosen, payment: inc.payment, sigs: inc.sigs, initials: inc.initials, initialsText: inc.initialsText, site: inc.site, savings: inc.savings, signedAt: inc.signedAt });
        if (inc.signedAt && !["signed", "installed"].includes(ex.status)) ex.status = "signed";
        log(ex, inc.signedAt ? "Homeowner signed remotely" : "Homeowner updates imported");
      } else {
        inc.status = inc.signedAt ? "signed" : "sent"; inc.history = [{ t: Date.now(), e: "Imported from homeowner link" }];
        proposals.unshift(inc);
      }
      persistNow();
      toast(inc.signedAt ? `Signed agreement imported — ${inc.customer.name}` : "Proposal imported", "good");
      history.replaceState(null, "", baseUrl() + `#/p/${inc.id}/sign`);
    } catch (e) { toast("That link couldn't be read"); history.replaceState(null, "", baseUrl() + "#/"); }
    route();
  }

  /* ======================================================================
   * SETTINGS
   * ==================================================================== */
  let unlocked = sessionStorage.getItem("sc_unlocked") === "1";
  function renderSettings() {
    if (!unlocked) {
      $("#view").innerHTML = `<section class="page narrow"><div class="card center-card">${ic("lock", "lg")}<h2>Owner settings</h2><p class="muted">Pricing, red lines and financing are protected. Enter the owner PIN.</p>
        <div class="row gap center"><input id="pin" type="password" inputmode="numeric" placeholder="PIN" class="pin"><button class="btn" data-act="unlock">Unlock</button></div><p class="muted small">Default PIN is 1234 — change it once you're in.</p></div></section>`;
      const pin = $("#pin"); pin.focus(); pin.addEventListener("keydown", (e) => { if (e.key === "Enter") $('[data-act="unlock"]').click(); });
      return;
    }
    const s = settings;
    const inp = (path, opts = {}) => { const v = getPath(s, path); return `<input ${opts.type ? `type="${opts.type}"` : ""} value="${esc(v == null ? "" : v)}" data-sbind="${path}" ${opts.type === "number" ? 'data-num="1" step="any"' : ""} ${opts.ph ? `placeholder="${esc(opts.ph)}"` : ""}>`; };
    const INC = [["softener", "Softener"], ["carbon", "Carbon"], ["ro", "RO"], ["alkaline", "Alkaline"]];
    $("#view").innerHTML = `<section class="page">
      <div class="page-head"><div><div class="eyebrow">Owner</div><h1>Settings</h1></div><div class="row gap"><button class="btn ghost" data-act="lock">${ic("lock")} Lock</button></div></div>

      <div class="card"><h3>Products & red-line pricing</h3><p class="muted small">Reps can't quote a product below its red line.</p>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Category</th><th>Short description</th><th>Retail $</th><th>Red line $</th><th>Includes</th><th></th></tr></thead><tbody>
        ${s.products.map((pr, i) => `<tr><td>${inp(`products.${i}.name`)}</td><td>${inp(`products.${i}.category`)}</td><td>${inp(`products.${i}.short`)}</td><td>${inp(`products.${i}.price`, { type: "number" })}</td><td>${inp(`products.${i}.redLine`, { type: "number" })}</td>
          <td class="incs">${INC.map(([k, l]) => `<label><input type="checkbox" ${pr.includes.includes(k) ? "checked" : ""} data-act-change="inc" data-i="${i}" data-k="${k}">${l}</label>`).join("")}</td>
          <td><button class="icon-btn" data-act="s-del" data-list="products" data-i="${i}">${ic("trash")}</button></td></tr>
          <tr class="sub"><td colspan="7"><label class="field"><span>Bullet points (one per line)</span><textarea rows="2" data-sbind-lines="products.${i}.bullets">${esc((pr.bullets || []).join("\n"))}</textarea></label></td></tr>`).join("")}
        </tbody></table></div><button class="btn ghost sm mt" data-act="s-add" data-list="products">${ic("plus")} Add product</button></div>

      <div class="grid2">
        <div class="card"><h3>Add-ons</h3><table class="tbl"><thead><tr><th>Name</th><th>Price $</th><th></th></tr></thead><tbody>
          ${s.addons.map((a, i) => `<tr><td>${inp(`addons.${i}.name`)}</td><td>${inp(`addons.${i}.price`, { type: "number" })}</td><td><button class="icon-btn" data-act="s-del" data-list="addons" data-i="${i}">${ic("trash")}</button></td></tr>`).join("")}
          </tbody></table><button class="btn ghost sm mt" data-act="s-add" data-list="addons">${ic("plus")} Add add-on</button></div>
        <div class="card"><h3>Option presets</h3><p class="muted small">What a new proposal starts with.</p>
          ${s.optionPresets.map((o, i) => `<div class="preset"><div class="fgrid"><label class="field"><span>Label</span>${inp(`optionPresets.${i}.label`)}</label><label class="field"><span>Name</span>${inp(`optionPresets.${i}.name`)}</label></div>
            <div class="row gap wrap">${s.products.map((pr) => `<label class="check"><input type="checkbox" ${o.items.includes(pr.id) ? "checked" : ""} data-act-change="preset-item" data-i="${i}" data-pid="${pr.id}">${esc(pr.name)}</label>`).join("")}
            <label class="check"><input type="radio" name="rec" ${o.recommended ? "checked" : ""} data-act-change="preset-rec" data-i="${i}"> Recommended</label>
            <button class="icon-btn" data-act="s-del" data-list="optionPresets" data-i="${i}">${ic("trash")}</button></div></div>`).join("")}
          <button class="btn ghost sm" data-act="s-add" data-list="optionPresets">${ic("plus")} Add preset</button></div>
      </div>

      <div class="card"><h3>Financing plans</h3><table class="tbl"><thead><tr><th>Lender</th><th>Label</th><th>APR %</th><th>Term (mo)</th><th>Application link (optional)</th><th></th></tr></thead><tbody>
        ${s.financePlans.map((f, i) => `<tr><td>${inp(`financePlans.${i}.lender`)}</td><td>${inp(`financePlans.${i}.label`)}</td><td>${inp(`financePlans.${i}.apr`, { type: "number" })}</td><td>${inp(`financePlans.${i}.term`, { type: "number" })}</td><td>${inp(`financePlans.${i}.applyUrl`, { ph: "https://…" })}</td><td><button class="icon-btn" data-act="s-del" data-list="financePlans" data-i="${i}">${ic("trash")}</button></td></tr>`).join("")}
        </tbody></table><button class="btn ghost sm mt" data-act="s-add" data-list="financePlans">${ic("plus")} Add plan</button></div>

      <div class="grid2">
        <div class="card"><h3>Pricing defaults</h3><div class="fgrid">
          <label class="field"><span>Sales tax % (on equipment)</span>${inp("taxRate", { type: "number" })}</label>
          <label class="field"><span>Default installation $</span>${inp("installFee", { type: "number" })}</label></div>
          <h3 class="mt">Savings defaults</h3><div class="fgrid">
          ${[["bottled", "Bottled water $/mo"], ["soaps", "Soaps & cleaners $/mo"], ["appliances", "Appliance wear $/yr"], ["energy", "Water heater energy $/yr"], ["upkeepSoftener", "Softener upkeep $/yr"], ["upkeepRO", "RO filters $/yr"], ["inflation", "Inflation %"], ["years", "Years compared"]].map(([k, l]) => `<label class="field"><span>${l}</span>${inp("savings." + k, { type: "number" })}</label>`).join("")}</div></div>
        <div class="card"><h3>Company</h3><div class="fgrid">
          ${[["name", "Company name"], ["salesOrg", "Sales organization"], ["phone", "Phone"], ["email", "Email for signed agreements"], ["website", "Website"], ["address", "Address"], ["hours", "Support hours"]].map(([k, l]) => `<label class="field"><span>${l}</span>${inp("company." + k)}</label>`).join("")}</div>
          <label class="field mt"><span>Sales reps (one per line)</span><textarea rows="4" data-sbind-lines="reps">${esc(s.reps.join("\n"))}</textarea></label>
          <label class="field"><span>Owner PIN</span>${inp("settingsPin", { type: "password" })}</label>
          <div class="row gap wrap mt"><button class="btn ghost" data-act="s-reset">Reset all settings to defaults</button></div></div>
      </div>
    </section>`;
  }

  /* ======================================================================
   * EVENTS
   * ==================================================================== */
  const STEP_RENDER = { cover: stepCover, welcome: stepWelcome, customer: stepCustomer, water: stepWater, learn: stepLearn, build: stepBuild, options: stepOptions, savings: stepSavings, payment: stepPayment, sign: stepSign };
  const STEP_AFTER = {};
  const rerender = () => current && renderProposal(current.p, current.step);

  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.bind && current) {
      const p = current.p;
      let v = el.type === "checkbox" ? el.checked : el.value;
      if (el.dataset.num) v = num(v);
      setPath(p, el.dataset.bind, v);
      // mirror slider <-> number pairs
      $$(`[data-bind="${el.dataset.bind}"]`).forEach((x) => { if (x !== el && x.type !== "checkbox") x.value = v == null ? "" : v; });
      if (el.dataset.bind === "customer.zip" && !p.area.contaminants.length) p.area.zip = el.value;
      if (el.dataset.bind === "payment.down") p.payment.method = "finance";
      $$(".test").forEach((t) => { const id = t.querySelector("[data-live=testStatus]")?.dataset.id; if (id) { const d = SC.TESTS.find((x) => x.id === id); t.className = "test " + testState(d, p.test[id]); } });
      updateLive(p); persist(p);
    } else if (el.dataset.price && current) {
      const [oi, k] = el.dataset.price.split(".").map(Number);
      const it = current.p.options[oi].items[k];
      it.price = num(el.value) || 0;
      updateLive(current.p); persist(current.p);
    } else if (el.dataset.sbind) {
      let v = el.value; if (el.dataset.num) v = num(v);
      setPath(settings, el.dataset.sbind, v); saveSettings();
    } else if (el.dataset.sbindLines) {
      setPath(settings, el.dataset.sbindLines, el.value.split("\n").map((x) => x.trim()).filter(Boolean)); saveSettings();
    }
  });

  document.addEventListener("change", (e) => {
    const el = e.target;
    if (el.dataset.price && current) { // enforce red line on commit
      const p = current.p; const [oi, k] = el.dataset.price.split(".").map(Number); const it = p.options[oi].items[k];
      if (+it.price < +it.redLine) { it.price = +it.redLine; el.value = it.redLine; toast(`Price can't go below the ${money(it.redLine)} red line`, "bad"); }
      updateLive(p); persist(p); return;
    }
    if (el.dataset.bind && current && ["payment.down", "area.zip", "customer.co"].includes(el.dataset.bind) && current.step !== "customer") { persist(current.p); return rerender(); }
    if (el.dataset.bind && el.tagName === "SELECT" && current) { persist(current.p); if (el.dataset.bind === "status" || el.dataset.bind === "rep") renderTop(); return; }
    const act = el.dataset.actChange; if (!act) return;
    const p = current && current.p;
    if (act === "move") {
      const id = el.dataset.id, v = el.value, pr = findP(id);
      if (v === "__dup") { const d = clone(pr); d.id = uid(); d.order = orderNo(); d.status = "draft"; d.signedAt = null; d.sigs = {}; d.initials = {}; d.created = d.updated = Date.now(); d.history = [{ t: Date.now(), e: "Duplicated from " + pr.order }]; proposals.unshift(d); persistNow(); return renderPipeline(); }
      if (v === "__del") { confirmBox(`Delete the proposal for ${pr.customer.name || "this homeowner"}?`, "Delete").then((ok) => { if (ok) { proposals = proposals.filter((x) => x.id !== id); persistNow(); } renderPipeline(); }); return; }
      pr.status = v; log(pr, "Moved to " + v); pr.updated = Date.now(); persistNow(); return renderPipeline();
    }
    if (act === "recommend") { p.options.forEach((o, i) => (o.recommended = el.checked && i === +el.dataset.i)); persist(p); return rerender(); }
    if (act === "addon") { const o = p.options[buildTab]; const id = el.dataset.id; o.addons = el.checked ? [...new Set([...o.addons, id])] : o.addons.filter((x) => x !== id); persist(p); return updateLive(p); }
    if (act === "checklist") { p.checklist[el.dataset.i] = el.checked; persist(p); return; }
    if (act === "inc") { const pr = settings.products[+el.dataset.i]; const k = el.dataset.k; pr.includes = el.checked ? [...new Set([...pr.includes, k])] : pr.includes.filter((x) => x !== k); saveSettings(); return; }
    if (act === "preset-item") { const o = settings.optionPresets[+el.dataset.i]; const pid = el.dataset.pid; o.items = el.checked ? [...new Set([...o.items, pid])] : o.items.filter((x) => x !== pid); saveSettings(); return; }
    if (act === "preset-rec") { settings.optionPresets.forEach((o, i) => (o.recommended = i === +el.dataset.i)); saveSettings(); return; }
  });

  document.addEventListener("click", async (e) => {
    const a = e.target.closest("[data-act]");
    if (!a || a.tagName === "SELECT" || (a.tagName === "INPUT" && a.type !== "button")) return;
    const act = a.dataset.act, p = current && current.p;
    switch (act) {
      case "open": if (e.target.closest("select")) return; return go(`#/p/${a.dataset.id}/cover`);
      case "demo": { const d = demoProposal(); proposals.unshift(d); persistNow(); return go(`#/p/${d.id}/cover`); }
      case "present": {
        presenting = true; if (p.status === "draft") { p.status = "presented"; log(p, "Presented"); persistNow(); }
        try { await document.documentElement.requestFullscreen(); } catch (_) {}
        return rerender();
      }
      case "exit-present": presenting = false; try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (_) {} return rerender();
      case "share": return shareProposal(p);
      case "send-back": return sendBack(p);
      case "print": return window.print();
      case "ewg-pull": return ewgPull(p);
      case "ewg-paste": return ewgPaste(p);
      case "contam-add": return contamAdd(p);
      case "contam-del": p.area.contaminants.splice(+a.dataset.i, 1); persist(p); return rerender();
      case "ro": roActive = +a.dataset.i; $$(".ro-stage").forEach((b, i) => b.classList.toggle("on", i === roActive)); $("#roDetail").innerHTML = roDetail(roActive); return;
      case "ro-play": {
        clearInterval(roTimer); roActive = 0;
        const tick = () => { if (!$("#roDetail")) return clearInterval(roTimer); $$(".ro-stage").forEach((b, i) => b.classList.toggle("on", i === roActive)); $("#roDetail").innerHTML = roDetail(roActive); roActive++; if (roActive >= SC.RO_STAGES.length) { clearInterval(roTimer); roActive = SC.RO_STAGES.length - 1; } };
        tick(); roTimer = setInterval(tick, 3200); return;
      }
      case "layer": layerActive = +a.dataset.i; $$(".layer").forEach((b, i) => b.classList.toggle("on", i === layerActive)); $("#layerDetail").innerHTML = layerDetail(layerActive); return;
      case "zoom": modal(`<img src="${esc(a.dataset.src)}" alt="" class="zoom-img">`, { wide: true }); return;
      case "btab": buildTab = +a.dataset.i; return rerender();
      case "opt-add": p.options.push({ id: uid(), label: "Option " + String.fromCharCode(65 + p.options.length), name: "Custom", recommended: false, items: [], addons: [] }); buildTab = p.options.length - 1; persist(p); return rerender();
      case "opt-del": { const i = +a.dataset.i; p.options.splice(i, 1); if (p.chosen >= p.options.length) p.chosen = p.options.length - 1; else if (p.chosen > i) p.chosen--; buildTab = 0; persist(p); return rerender(); }
      case "prod-toggle": {
        const o = p.options[buildTab], pid = a.dataset.pid, k = o.items.findIndex((i) => i.pid === pid);
        if (k >= 0) o.items.splice(k, 1); else { const it = itemFromProduct(pid); if (it) o.items.push(it); }
        persist(p); return rerender();
      }
      case "item-del": p.options[buildTab].items.splice(+a.dataset.k, 1); persist(p); return rerender();
      case "choose": p.chosen = +a.dataset.i; log(p, `Chose ${p.options[p.chosen].label}`); persist(p); return rerender();
      case "plan": p.payment.method = "finance"; p.payment.planId = a.dataset.id; persist(p); return rerender();
      case "plan-full": p.payment.method = "full"; persist(p); return rerender();
      case "initial": {
        const ini = p.initialsText || initialsOf(p.customer.name);
        if (!ini) return toast("Enter the customer's name or initials first");
        p.initials[a.dataset.k] = p.initials[a.dataset.k] ? "" : ini; persist(p); return rerender();
      }
      case "sign": {
        const k = a.dataset.k;
        const def = k === "customer" ? p.customer.name : k === "co" ? p.customer.co : p.rep;
        const label = k === "customer" ? "Customer signature" : k === "co" ? "Co-customer signature" : "Sales rep signature";
        return openSignPad(label, def, (sg) => { p.sigs[k] = sg; persist(p); rerender(); });
      }
      case "finalize": {
        if (a.classList.contains("disabled")) return toast("Complete the initials and customer signature first");
        p.signedAt = Date.now(); p.status = "signed"; log(p, "Agreement signed"); persistNow(); rerender();
        return toast("Agreement signed", "good");
      }
      case "unsign": if (await confirmBox("Reopen this agreement? Signatures are kept but it will need to be signed again.", "Reopen")) { p.signedAt = null; p.status = "presented"; log(p, "Agreement reopened"); persistNow(); rerender(); } return;
      case "mark-installed": p.status = "installed"; log(p, "Installed"); persistNow(); toast("Marked installed", "good"); return;
      case "import-link": {
        const m = modal(`<h3>Import a signed link</h3><p class="muted">Paste the link the homeowner sent back.</p><label class="field"><input id="impL" placeholder="https://…#/return/…"></label><div class="row end gap"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="impGo">Import</button></div>`);
        m.el.querySelector("#impGo").onclick = () => { const v = m.el.querySelector("#impL").value; const i = v.indexOf("#/return/"); if (i < 0) return toast("That isn't a signed SafeCo link"); m.close(); importReturned(v.slice(i + 9)); };
        return;
      }
      case "backup": {
        const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), settings, proposals }, null, 2)], { type: "application/json" });
        const u = URL.createObjectURL(blob); const l = document.createElement("a"); l.href = u; l.download = `safeco-proposals-${new Date().toISOString().slice(0, 10)}.json`; l.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); return;
      }
      case "restore": {
        const f = document.createElement("input"); f.type = "file"; f.accept = "application/json";
        f.onchange = async () => { try { const j = JSON.parse(await f.files[0].text()); if (!Array.isArray(j.proposals)) throw 0; const ids = new Set(proposals.map((x) => x.id)); j.proposals.forEach((x) => { if (!ids.has(x.id)) proposals.push(x); }); if (j.settings && (await confirmBox("Also restore pricing & settings from the backup?", "Restore settings"))) { settings = mergeDefaults(j.settings); saveSettings(); } persistNow(); toast("Backup restored", "good"); renderPipeline(); } catch (_) { toast("That file isn't a SafeCo backup"); } };
        f.click(); return;
      }
      case "unlock": if ($("#pin").value === String(settings.settingsPin)) { unlocked = true; sessionStorage.setItem("sc_unlocked", "1"); renderSettings(); } else toast("Wrong PIN", "bad"); return;
      case "lock": unlocked = false; sessionStorage.removeItem("sc_unlocked"); return renderSettings();
      case "s-add": {
        const L = a.dataset.list;
        const blank = { products: { id: "p-" + uid(), name: "New product", short: "", category: "Whole Home", price: 0, redLine: 0, image: "assets/system.jpg", includes: [], bullets: [] }, addons: { id: "a-" + uid(), name: "New add-on", price: 0 }, financePlans: { id: "f-" + uid(), lender: "Lender", label: "New plan", apr: 9.99, term: 60, applyUrl: "" }, optionPresets: { label: "Option " + String.fromCharCode(65 + settings.optionPresets.length), name: "New option", items: [] } }[L];
        settings[L].push(blank); saveSettings(); return renderSettings();
      }
      case "s-del": settings[a.dataset.list].splice(+a.dataset.i, 1); saveSettings(); return renderSettings();
      case "s-reset": if (await confirmBox("Reset products, pricing, financing and company info to the defaults?", "Reset")) { const pin = settings.settingsPin; settings = clone(SC.DEFAULTS); settings.settingsPin = pin; saveSettings(); renderSettings(); } return;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!current || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || $(".modal-back")) return;
    const steps = stepsFor(), i = steps.findIndex((s) => s.id === current.step);
    const base = mode === "client" ? "#/c/" : `#/p/${current.p.id}/`;
    if (e.key === "ArrowRight" && i < steps.length - 1) go(base + steps[i + 1].id);
    if (e.key === "ArrowLeft" && i > 0) go(base + steps[i - 1].id);
  });
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && presenting) { presenting = false; rerender(); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.classList && e.target.classList.contains("deal")) e.target.click(); });

  window.addEventListener("hashchange", route);
  window.addEventListener("beforeunload", persistNow);
  route();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
