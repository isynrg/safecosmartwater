/* Owner-only team management.
 * GET  /api/auth/users                       list the team
 * POST /api/auth/users { action, ... }       add | update | password | remove
 */
const A = require("../_lib/auth");
module.exports = async (req, res) => {
  A.noStore(res);
  const me = await A.currentUser(req);
  if (!me) return res.status(401).json({ error: "Please sign in." });
  if (me.role !== "owner") return res.status(403).json({ error: "Only owners can manage the team." });
  const users = await A.getUsers();
  if (req.method === "GET") return res.status(200).json({ users: users.map(A.publicUser) });
  if (req.method !== "POST") return res.status(405).json({ error: "Use GET or POST" });

  const b = await A.body(req);
  const owners = users.filter((u) => u.role === "owner" && u.active !== false);
  const target = b.id ? users.find((u) => u.id === b.id) : null;
  const done = async (msg, ev) => { await A.saveUsers(users); if (ev) await A.logEvent(req, Object.assign({ by: me.name }, ev)); res.status(200).json({ ok: true, message: msg, users: users.map(A.publicUser) }); };

  if (b.action === "add") {
    const email = A.normEmail(b.email), name = String(b.name || "").trim();
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "Enter a name and a valid email." });
    if (users.some((u) => u.email === email)) return res.status(409).json({ error: "Someone on the team already uses that email." });
    const bad = A.passwordProblem(b.password); if (bad) return res.status(400).json({ error: bad });
    const role = b.role === "owner" ? "owner" : "rep";
    users.push(Object.assign({ id: A.crypto.randomUUID(), name, email, role, active: true, created: Date.now() }, A.hashPassword(b.password)));
    return done(`${name} can now sign in.`, { type: "user-added", email, name, note: role === "owner" ? "Owner" : "Sales rep" });
  }
  if (!target) return res.status(404).json({ error: "That team member wasn't found." });
  const lastOwner = target.role === "owner" && owners.length <= 1 && target.active !== false;

  if (b.action === "update") {
    if (lastOwner && (b.role === "rep" || b.active === false)) return res.status(400).json({ error: "Keep at least one active owner on the team." });
    const changes = [];
    if (typeof b.name === "string" && b.name.trim() && b.name.trim() !== target.name) { target.name = b.name.trim(); changes.push("name"); }
    if (b.role === "owner" || b.role === "rep") { if (target.role !== b.role) changes.push(b.role === "owner" ? "made owner" : "made sales rep"); target.role = b.role; }
    if (typeof b.active === "boolean") { if ((target.active !== false) !== b.active) changes.push(b.active ? "turned on" : "turned off"); target.active = b.active; }
    return done("Saved.", changes.length ? { type: "user-updated", email: target.email, name: target.name, note: changes.join(", ") } : null);
  }
  if (b.action === "password") {
    const bad = A.passwordProblem(b.password); if (bad) return res.status(400).json({ error: bad });
    Object.assign(target, A.hashPassword(b.password));
    return done(`New password set for ${target.name}.`, { type: "password-reset", email: target.email, name: target.name });
  }
  if (b.action === "remove") {
    if (lastOwner) return res.status(400).json({ error: "Keep at least one active owner on the team." });
    if (target.id === me.id) return res.status(400).json({ error: "You can't remove your own account." });
    users.splice(users.indexOf(target), 1);
    return done(`${target.name} was removed.`, { type: "user-removed", email: target.email, name: target.name });
  }
  res.status(400).json({ error: "Unknown action." });
};
