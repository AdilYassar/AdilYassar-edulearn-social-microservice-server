const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const User = require('../src/models/User');

async function run() {
  console.log('Connecting to database...');
  await connectDB();

  const totalUsers = await User.countDocuments({});
  const onlineUsers = await User.countDocuments({ isOnline: true });
  const activeUsers = await User.countDocuments({ isActive: true });
  const students = await User.countDocuments({ userType: 'student' });
  const admins = await User.countDocuments({ userType: 'admin' });

  console.log('\n=========================================');
  console.log('📊 USER STATS REPORT');
  console.log('=========================================');
  console.log(`Total Users registered in Social DB: ${totalUsers}`);
  console.log(`Active Users:                        ${activeUsers}`);
  console.log(`Online Users:                        ${onlineUsers}`);
  console.log(`Students:                            ${students}`);
  console.log(`Admins:                              ${admins}`);
  console.log('=========================================\n');

  console.log('Recent Users list:');
  const recentUsers = await User.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .select('name userType isOnline quizServerUUID')
    .lean();
    
  recentUsers.forEach((u, i) => {
    console.log(`  ${i + 1}. [${u.userType || 'student'}] ${u.name || 'Unknown'} (Online: ${u.isOnline || false}) - UUID: ${u.quizServerUUID}`);
  });

  await mongoose.connection.close();
  console.log('\nDatabase connection closed.');
}

run().catch(err => {
  console.error('Error executing script:', err);
  mongoose.connection.close();
});
