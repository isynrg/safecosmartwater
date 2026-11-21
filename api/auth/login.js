/* POST /api/auth/login  { email, password, remember } */
const A = require("../_lib/auth");
module.exports = async (req, res) => {
  A.noStore(res);
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const b = await A.body(req);
  const email = A.normEmail(b.email);
  if (!email || !b.password) return res.status(400).json({ error: "Enter your email and password." });
  try {
    if (await A.isLocked(email)) {
      const who = (await A.getUsers()).find((u) => u.email === email);
      await A.logEvent(req, { type: "locked", email, name: who ? who.name : "" });
      return res.status(429).json({ error: "Too many wrong passwords. Wait 15 minutes, or ask your manager to reset your password." });
    }
    const users = await A.getUsers();
    const user = users.find((u) => u.email === email);
    if (!user || user.active === false || !A.checkPassword(user, b.password)) {
      await A.logEvent(req, { type: "failed", email, name: user ? user.name : "", note: user && user.active === false ? "Account turned off" : user ? "Wrong password" : "Unknown email" });
      return res.status(401).json({ error: user && user.active === false ? "This account is turned off. Ask your manager to turn it back on." : "That email and password don't match." });
    }
    user.lastLogin = Date.now();
    await A.saveUsers(users);
    await A.logEvent(req, { type: "login", email, name: user.name });
    const s = A.signSession(user, !!b.remember);
    res.setHeader("Set-Cookie", A.sessionCookie(s.token, s.maxAge));
    res.status(200).json({ user: A.publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Sign-in isn't available right now. Try again in a minute." });
  }
};
