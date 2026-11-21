/* Optional server function: GET /api/ewg?zip=75062  or  /api/ewg?pws=TX0570010
 * Fetches the public EWG Tap Water Database report server-side (browsers can't read
 * ewg.org directly because of CORS) and returns structured contaminant data.
 * Runs on Vercel as-is (Node 18+). If EWG changes its page layout or blocks the request,
 * the app falls back to the "Paste report" flow automatically.
 */
const { parse, htmlToText } = require("../js/ewg-parse.js");
const SC = require("../js/data.js");

const HEADERS = { "user-agent": "Mozilla/5.0 (compatible; SafeCoSmartWaterSystem/1.0)", accept: "text/html" };
const BASE = "https://www.ewg.org/tapwater/";

function parseSystems(html) {
  const out = [], seen = new Set();
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  rows.forEach((row) => {
    const a = row.match(/system\.php\?pws=([A-Za-z0-9]+)[^>]*>([\s\S]*?)<\/a>/i);
    if (!a || seen.has(a[1])) return;
    seen.add(a[1]);
    const cells = (row.match(/<td[\s\S]*?<\/td>/gi) || []).map((c) => htmlToText(c).replace(/\s+/g, " ").trim());
    out.push({ pws: a[1], name: htmlToText(a[2]).replace(/\s+/g, " ").trim(), city: cells[1] || "", served: (cells.find((c) => /^[\d,]{3,}$/.test(c)) || "") });
  });
  if (!out.length) { // fallback: any system links on the page
    let m; const re = /system\.php\?pws=([A-Za-z0-9]+)[^>]*>([\s\S]*?)<\/a>/gi;
    while ((m = re.exec(html))) if (!seen.has(m[1])) { seen.add(m[1]); out.push({ pws: m[1], name: htmlToText(m[2]).trim(), city: "", served: "" }); }
  }
  return out;
}

async function getText(url) {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error("EWG responded " + r.status);
  return r.text();
}

module.exports = async (req, res) => {
  const q = req.query || Object.fromEntries(new URL(req.url, "http://x").searchParams);
  const zip = String(q.zip || "").trim();
  const pws = String(q.pws || "").trim();
  if (!/^\d{5}$/.test(zip) && !/^[A-Za-z]{2}\d{4,10}$/.test(pws)) return res.status(400).json({ error: "Provide ?zip=12345 or ?pws=TX0000000" });
  try {
    let systems = [];
    if (zip && !pws) systems = parseSystems(await getText(`${BASE}search-results.php?zip5=${zip}&searchtype=zip`));
    const target = pws || (systems[0] && systems[0].pws);
    let report = null;
    if (target) {
      const url = `${BASE}system.php?pws=${encodeURIComponent(target)}`;
      const html = await getText(url);
      report = Object.assign(parse(htmlToText(html), SC.CONTAMINANTS), { pws: target, url });
      const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1) report.utility = htmlToText(h1[1]).replace(/\s+/g, " ").trim();
    }
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    return res.status(200).json({ zip, systems, report });
  } catch (e) {
    return res.status(502).json({ error: "EWG report unavailable", detail: String(e.message || e) });
  }
};
