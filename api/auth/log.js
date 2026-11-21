/* GET /api/auth/log?months=2 — the sign-in sheet (owners only) */
const A = require("../_lib/auth");
module.exports = async (req, res) => {
  A.noStore(res);
  const me = await A.currentUser(req);
  if (!me) return res.status(401).json({ error: "Please sign in." });
  if (me.role !== "owner") return res.status(403).json({ error: "Only owners can see the sign-in sheet." });
  const months = Math.min(12, Math.max(1, parseInt((req.query && req.query.months) || "2", 10) || 2));
  res.status(200).json({ events: (await A.readLog(months)).slice(0, 2000) });
};
