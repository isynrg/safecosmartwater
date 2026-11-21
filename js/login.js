/* SafeCo SmartWater System — sign-in page */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  // where to go after signing in: the page they asked for, plus any #link (e.g. a signed agreement link)
  function destination() {
    let next = params.get("next") || "/";
    if (!next.startsWith("/") || next.startsWith("//")) next = "/";
    return next.includes("#") ? next : next + location.hash;
  }

  async function send(url, data, btn, errEl, label) {
    errEl.textContent = "";
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span> ' + label;
    try {
      const r = await fetch(url, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      let j = {}; try { j = await r.json(); } catch (_) {}
      if (!r.ok) throw new Error(j.error || "Sign-in isn't available right now. Try again in a minute.");
      try { localStorage.setItem("sc_me", JSON.stringify(j.user)); } catch (_) {}
      location.replace(destination());
    } catch (e) {
      errEl.textContent = e.message === "Failed to fetch" ? "You're offline. Connect to the internet to sign in." : e.message;
      btn.disabled = false; btn.textContent = btn.dataset.label;
    }
  }

  $("#go").dataset.label = "Sign in";
  $("#sgo").dataset.label = "Create owner account";

  $("#signin").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#email").value.trim(), password = $("#password").value;
    if (!email || !password) { $("#err").textContent = "Enter your email and password."; return; }
    send("/api/auth/login", { email, password, remember: $("#remember").checked }, $("#go"), $("#err"), "Signing in…");
  });
  $("#setup").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = { code: $("#code").value.trim(), name: $("#sname").value.trim(), email: $("#semail").value.trim(), password: $("#spassword").value };
    if (!d.code || !d.name || !d.email || !d.password) { $("#serr").textContent = "Fill in every field."; return; }
    if (d.password.length < 8) { $("#serr").textContent = "Use at least 8 characters for the password."; return; }
    send("/api/auth/setup", d, $("#sgo"), $("#serr"), "Creating…");
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".pw-show"); if (!b) return;
    const i = document.getElementById(b.dataset.show);
    i.type = i.type === "password" ? "text" : "password";
    b.textContent = i.type === "password" ? "Show" : "Hide";
  });

  // already signed in, or first-time setup?
  fetch("/api/auth/status", { credentials: "same-origin", cache: "no-store" })
    .then((r) => r.json())
    .then((s) => {
      if (s.setupNeeded) { $("#signin").hidden = true; $("#setup").hidden = false; $("#code").focus(); }
      else if (s.signedIn) location.replace(destination());
      else $("#email").focus();
    })
    .catch(() => $("#email").focus());
})();
