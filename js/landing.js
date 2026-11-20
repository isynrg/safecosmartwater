/* FloQuote landing page */
(function () {
  "use strict";
  // Who to contact about FloQuote. Fill these in to show them in the closing section.
  var CONTACT = { phone: "", email: "" };

  var demo = window.FQ_DEMO_LINK || "/view";
  document.querySelectorAll("[data-demo-link]").forEach(function (a) { a.href = demo; });
  document.getElementById("yr").textContent = new Date().getFullYear();

  var c = document.getElementById("contact");
  var parts = [];
  if (CONTACT.phone) parts.push('Call <a href="tel:' + CONTACT.phone.replace(/[^\d+]/g, "") + '">' + CONTACT.phone + "</a>");
  if (CONTACT.email) parts.push('email <a href="mailto:' + CONTACT.email + '">' + CONTACT.email + "</a>");
  if (parts.length) c.innerHTML = "Want FloQuote for your team? " + parts.join(" or ") + ".";
  else c.hidden = true;

  document.getElementById("copyDemo").addEventListener("click", function () {
    var b = this, url = location.origin + demo;
    var done = function () { b.textContent = "Link copied"; setTimeout(function () { b.textContent = "Copy link to share"; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt("Copy this link:", url); });
    else prompt("Copy this link:", url);
  });

  // product tour
  var STEPS = [
    ["Cover", "d-cover", "A branded cover with the homeowner's name, address, their specialist and your product film playing behind it."],
    ["Water test", "d-water", "Log the in-home test. Hardness, chlorine, TDS, iron and pH flag themselves as “needs treatment” or “within range.”"],
    ["Local report", "d-ewg", "Their utility's public water report from the EWG Tap Water Database: each contaminant, how far over the health guideline it is, and which stage removes it."],
    ["How it works", "d-learn", "Tap through all 7 stages of the reverse-osmosis system and a cutaway of the softener tank. Plain English, no jargon."],
    ["Options", "d-options", "Good, better, best. Each option shows its monthly payment, total, what's included and what's not. The homeowner picks one."],
    ["Savings", "d-savings", "A 20-year comparison of what they spend today against paying in full or financing, with break-even points. Adjust it to their household."],
    ["Payment", "d-payment", "Financing plans side by side with the monthly payment, or pay in full, plus a clear investment summary."],
    ["Sign", "d-signed", "Tap-to-initial acknowledgments and draw-or-type signatures for everyone on the agreement."],
    ["Agreement", "d-agreement", "Your installation agreement, filled in automatically and ready to save as a PDF."],
  ];
  var tabs = document.querySelector(".tour-tabs"), img = document.getElementById("tourImg");
  var title = document.getElementById("tourTitle"), text = document.getElementById("tourText");
  var cur = 0, timer = null;
  tabs.innerHTML = STEPS.map(function (s, i) { return '<button role="tab" type="button" data-i="' + i + '"><span>' + (i + 1) + "</span>" + s[0] + "</button>"; }).join("");
  function show(i) {
    cur = i;
    tabs.querySelectorAll("button").forEach(function (b, k) { b.classList.toggle("on", k === i); b.setAttribute("aria-selected", k === i ? "true" : "false"); });
    img.classList.add("swap");
    setTimeout(function () { img.src = "assets/demo/" + STEPS[i][1] + ".webp"; img.alt = STEPS[i][0] + " screen"; img.classList.remove("swap"); }, 160);
    title.textContent = STEPS[i][0]; text.textContent = STEPS[i][2];
  }
  tabs.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; clearInterval(timer); show(+b.dataset.i); });
  STEPS.forEach(function (s) { var p = new Image(); p.src = "assets/demo/" + s[1] + ".webp"; });
  show(0);
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) timer = setInterval(function () { show((cur + 1) % STEPS.length); }, 5000);
  document.querySelector(".tour").addEventListener("pointerenter", function () { clearInterval(timer); });

  // lightbox
  var lb = document.getElementById("lightbox");
  function openLB(src, alt) { lb.querySelector("img").src = src; lb.querySelector("img").alt = alt || ""; lb.hidden = false; }
  document.addEventListener("click", function (e) {
    var t = e.target.closest(".tour-shot, .way-shot, .pipeline-fig img, .phone img");
    if (t) { var im = t.tagName === "IMG" ? t : t.querySelector("img"); openLB(im.src, im.alt); return; }
    if (!lb.hidden && (e.target === lb || e.target.closest(".lb-x"))) lb.hidden = true;
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") lb.hidden = true; });
})();
