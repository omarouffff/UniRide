const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
dotenv.config();

const User = require('../models/User');

async function showUsers() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI or MONGODB_URI is not defined in your backend .env file');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected successfully to MongoDB Atlas!\n');

  const usersCount = await User.countDocuments();
  console.log(`📊 Total Registered Users: ${usersCount}`);

  const roles = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } }
  ]);
  
  console.log('\n👥 Users counts by role:');
  roles.forEach(r => {
    console.log(`  - ${r._id}: ${r.count} users`);
  });

  const allUsers = await User.find({}, 'name email role status isActive').lean();
  console.log('\n📜 Registered Users List:');
  allUsers.forEach((u, i) => {
    console.log(`  ${i + 1}. Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | Status: ${u.status} | Active: ${u.isActive}`);
  });

  console.log('\n----------------------------------------');
  await mongoose.disconnect();
}

showUsers().catch(error => {
  console.error('❌ Error connecting/querying database:', error);
  mongoose.disconnect();
});
