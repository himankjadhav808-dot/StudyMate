#!/usr/bin/env node

/**
 * Setup Super Admin
 * 
 * This script creates a default super admin user in the database.
 * Run with: node setupSuperAdmin.js
 * 
 * Make sure MongoDB is connected and environment variables are set.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Learner = require('./models/Learner');

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'SuperSecurePassword123!';

async function setupSuperAdmin() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existingAdmin = await Learner.findOne({ email: SUPER_ADMIN_EMAIL.toLowerCase() });
    if (existingAdmin) {
      if (existingAdmin.role === 'admin' && existingAdmin.verified) {
        console.log('⚠️  Super admin already exists with email:', SUPER_ADMIN_EMAIL);
        console.log('   Role:', existingAdmin.role, '| Verified:', existingAdmin.verified);
      } else {
        // Upgrade to admin if role is wrong (e.g. admin_pending from signup)
        await Learner.updateOne(
          { email: SUPER_ADMIN_EMAIL.toLowerCase() },
          { $set: { role: 'admin', verified: true } }
        );
        console.log('✅ Existing account upgraded to admin role!');
        console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
      }
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

    // Create super admin
    const superAdmin = await Learner.create({
      fname: 'Super',
      lname: 'Admin',
      email: SUPER_ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      verified: true,
      role: 'admin',
      createdAt: new Date(),
    });

    console.log('✅ Super admin created successfully!');
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log('\n⚠️  IMPORTANT: Change the password immediately after first login!');
    console.log('📝 Store credentials securely and never share them.\n');

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (err) {
    console.error('❌ Error setting up super admin:', err.message);
    process.exit(1);
  }
}

setupSuperAdmin();
