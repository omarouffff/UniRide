const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@uniride.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

async function seedAdmin() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI or MONGODB_URI is not defined');
  }

  await mongoose.connect(mongoUri);

  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
  if (existingAdmin) {
    existingAdmin.name = 'UniRide Admin';
    existingAdmin.role = 'admin';
    existingAdmin.status = 'approved';
    existingAdmin.universityIdStatus = 'approved';
    existingAdmin.passwordHash = ADMIN_PASSWORD;
    await existingAdmin.save();
    console.log(`Admin updated: ${ADMIN_EMAIL}`);
  } else {
    await User.create({
      name: 'UniRide Admin',
      email: ADMIN_EMAIL,
      passwordHash: ADMIN_PASSWORD,
      role: 'admin',
      status: 'approved',
      universityIdStatus: 'approved',
      isActive: true,
    });
    console.log(`Admin created: ${ADMIN_EMAIL}`);
  }

  console.log(`Admin password: ${ADMIN_PASSWORD}`);
  await mongoose.disconnect();
}

seedAdmin().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
