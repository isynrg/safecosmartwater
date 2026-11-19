/* POST /api/auth/logout */
const A = require("../_lib/auth");
module.exports = async (req, res) => {
  A.noStore(res);
  const s = A.readSession(req);
  if (s) await A.logEvent(req, { type: "logout", name: s.n, email: "" , uid: s.sub });
  res.setHeader("Set-Cookie", A.clearCookie());
  res.status(200).json({ ok: true });
};
