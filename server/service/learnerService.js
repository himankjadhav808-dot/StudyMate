const bcrypt = require('bcryptjs');

// ── Hash a plaintext password ─────────────────────────────────────────────────
const hashPassword = async (plaintextPassword) => {
  const saltRounds = 10;
  return bcrypt.hash(plaintextPassword, saltRounds);
};

module.exports = { hashPassword };