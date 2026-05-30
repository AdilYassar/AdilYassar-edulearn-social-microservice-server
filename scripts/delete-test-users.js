const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const User = require('../src/models/User');

async function run() {
  console.log('Connecting to database...');
  await connectDB();

  const uuids = ['test-user-social-summary-123', 'another-online-user-456'];
  const result = await User.deleteMany({ quizServerUUID: { $in: uuids } });
  
  console.log(`Successfully deleted ${result.deletedCount} test users from database.`);

  await mongoose.connection.close();
}

run().catch(err => {
  console.error(err);
  mongoose.connection.close();
});
