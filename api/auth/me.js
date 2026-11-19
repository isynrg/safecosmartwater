/* GET /api/auth/me — the signed-in person, or 401 */
const A = require("../_lib/auth");
module.exports = async (req, res) => {
  A.noStore(res);
  try {
    const u = await A.currentUser(req);
    if (!u) { res.setHeader("Set-Cookie", A.clearCookie()); return res.status(401).json({ error: "Please sign in." }); }
    res.status(200).json({ user: A.publicUser(u) });
  } catch (e) {
    res.status(503).json({ error: "Couldn't check your sign-in right now." });
  }
};
