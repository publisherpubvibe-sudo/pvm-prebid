/**
 * Run once to create the initial superadmin account.
 * Usage: node src/services/seedAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pubvibe');

  const existing = await User.findOne({ email: 'admin@pubvibe.com' });
  if (existing) {
    console.log('Superadmin already exists.');
    process.exit(0);
  }

  await User.create({
    name: 'Super Admin',
    email: 'admin@pubvibe.com',
    password: 'Admin@12345',     // CHANGE THIS immediately after first login!
    role: 'superadmin',
    isActive: true,
  });

  console.log('✅ Superadmin created: admin@pubvibe.com / Admin@12345');
  console.log('⚠️  Change the password immediately after first login!');
  await mongoose.disconnect();
}

seed().catch(console.error);
