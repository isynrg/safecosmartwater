/* GET /api/auth/status — is first-time setup needed, and is this browser signed in? */
const A = require("../_lib/auth");
module.exports = async (req, res) => {
  A.noStore(res);
  try {
    const users = await A.getUsers();
    const u = A.readSession(req) ? await A.currentUser(req) : null;
    res.status(200).json({ setupNeeded: users.length === 0, signedIn: !!u });
  } catch (e) {
    res.status(500).json({ error: "Sign-in storage isn't reachable right now. Try again in a minute." });
  }
};
