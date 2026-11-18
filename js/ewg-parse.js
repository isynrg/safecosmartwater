/* Parses text from an EWG Tap Water Database report (https://www.ewg.org/tapwater/).
 * Used in two places:
 *   - the browser, when a rep pastes the copied text of an EWG report page
 *   - api/ewg.js, the optional server function that fetches the report by ZIP
 * It looks for known contaminant names and reads the nearby "This Utility: 10.6 ppb"
 * value and the "177x EWG's Health Guideline" multiplier.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EWGParse = api;
})(typeof self !== "undefined" ? self : this, function () {
  var UNIT = "(ppb|ppm|ppt|pCi\\/L|mg\\/L|µg\\/L|ug\\/L)";

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function num(s) { var n = parseFloat(String(s).replace(/,/g, "")); return isFinite(n) ? n : null; }
  function normUnit(u) {
    if (!u) return u;
    if (/mg\/L/i.test(u)) return "ppm";
    if (/[µu]g\/L/i.test(u)) return "ppb";
    return u;
  }

  function htmlToText(html) {
    return String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<(br|\/p|\/div|\/li|\/h\d|\/tr|\/td|\/section)[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'")
      .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&times;/g, "×")
      .replace(/&#(\d+);/g, function (_, d) { return String.fromCharCode(+d); });
  }

  function parse(raw, library) {
    var text = String(raw || "").replace(/ /g, " ").replace(/\r/g, "").replace(/[ \t]+/g, " ");
    var hits = [];
    (library || []).forEach(function (c) {
      [c.key].concat(c.alias || []).forEach(function (name) {
        var re = new RegExp("(^|[^A-Za-z0-9])" + escRe(name) + "(?![A-Za-z])", "gi"), m;
        while ((m = re.exec(text))) hits.push({ i: m.index + m[1].length, end: m.index + m[0].length, c: c });
      });
    });
    hits.sort(function (a, b) { return a.i - b.i || (b.end - b.i) - (a.end - a.i); });
    // drop hits that overlap an earlier (longer) hit
    var clean = [];
    hits.forEach(function (h) { var last = clean[clean.length - 1]; if (!last || h.i >= last.end) clean.push(h); });

    var found = {};
    clean.forEach(function (h, k) {
      var next = null;
      for (var j = k + 1; j < clean.length; j++) { if (clean[j].c !== h.c) { next = clean[j]; break; } }
      var seg = text.slice(h.end, Math.min(next ? next.i : text.length, h.end + 700));
      var fm = seg.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:x|×|times)\s+(?:EWG|above|the|health)/i);
      var vm = seg.match(new RegExp("This\\s+utility\\s*:?\\s*(\\d[\\d,]*(?:\\.\\d+)?)\\s*" + UNIT, "i")) ||
               seg.match(new RegExp("(\\d[\\d,]*(?:\\.\\d+)?)\\s*" + UNIT, "i"));
      if (!fm && !vm) return;
      var rec = {
        name: h.c.key,
        value: vm ? num(vm[1]) : null,
        unit: vm ? normUnit(vm[2]) : h.c.unit,
        factor: fm ? num(fm[1]) : null,
      };
      var prev = found[h.c.key];
      var score = function (r) { return (r.value != null ? 2 : 0) + (r.factor != null ? 1 : 0); };
      if (!prev || score(rec) > score(prev)) found[h.c.key] = rec;
    });

    var served = text.match(/Serves\s*:?\s*([\d,]+)\s*(?:people)?/i) || text.match(/Population served\s*:?\s*([\d,]+)/i);
    var source = text.match(/(?:Water\s+)?Source\s*:?\s*((?:Purchased\s+)?(?:surface|ground)\s*water(?:\s+under[\w ]{0,40})?)/i);
    var exceed = text.match(/(\d+)\s+contaminants?\s+detected\s+above\s+(?:EWG|health)/i);

    return {
      served: served ? served[1] : "",
      source: source ? source[1].trim().replace(/\s+/g, " ") : "",
      exceedCount: exceed ? +exceed[1] : null,
      contaminants: Object.keys(found).map(function (k) { return found[k]; }),
    };
  }

  return { parse: parse, htmlToText: htmlToText };
});
