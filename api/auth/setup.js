/* POST /api/auth/setup — create the first owner account. Only works while no accounts exist,
 * and only with the one-time setup code saved in the project's SETUP_CODE environment variable. */
const A = require("../_lib/auth");
module.exports = async (req, res) => {
  A.noStore(res);
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const b = await A.body(req);
  const users = await A.getUsers();
  if (users.length) return res.status(409).json({ error: "Setup is already done. Sign in instead." });
  const code = process.env.SETUP_CODE;
  if (!code) return res.status(503).json({ error: "Setup isn't enabled. Add a SETUP_CODE environment variable in Vercel, then redeploy." });
  const given = String(b.code || "").trim();
  if (given.length !== code.length || !A.crypto.timingSafeEqual(Buffer.from(given), Buffer.from(code))) {
    await A.logEvent(req, { type: "failed", email: A.normEmail(b.email), note: "Wrong setup code" });
    return res.status(403).json({ error: "That setup code isn't right." });
  }
  const email = A.normEmail(b.email), name = String(b.name || "").trim();
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "Enter your name and a valid email." });
  const bad = A.passwordProblem(b.password); if (bad) return res.status(400).json({ error: bad });
  const user = Object.assign({ id: A.crypto.randomUUID(), name, email, role: "owner", active: true, created: Date.now(), lastLogin: Date.now() }, A.hashPassword(b.password));
  await A.saveUsers([user]);
  await A.logEvent(req, { type: "user-added", email, name, by: name, note: "Owner account created" });
  await A.logEvent(req, { type: "login", email, name });
  const s = A.signSession(user, false);
  res.setHeader("Set-Cookie", A.sessionCookie(s.token, s.maxAge));
  res.status(200).json({ user: A.publicUser(user) });
};
