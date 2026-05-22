/**
 * One-time migration: drop the legacy unique index on paperCode
 * so multiple sessions can share the same paper code.
 * Run with: node server/dropPaperCodeIndex.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const col = db.collection('questionsets');

    // List current indexes so we can see what's there
    const indexes = await col.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    const target = 'paperCode_1';
    if (indexes.some(i => i.name === target)) {
      await col.dropIndex(target);
      console.log(`✅ Dropped index "${target}" — multiple sessions with the same paper code are now allowed.`);
    } else {
      console.log(`ℹ️  Index "${target}" not found — nothing to drop.`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected.');
  }
})();
