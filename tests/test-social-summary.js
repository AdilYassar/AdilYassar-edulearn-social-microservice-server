const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const connectDB = require('../src/config/database');
const User = require('../src/models/User');

const JWT_SECRET = config.jwt.secret || '7f8afcb202f73909ad8b223f83ecf3e6dd37a26a9e450df8bf';

async function runTest() {
  console.log('Connecting to database...');
  await connectDB();

  // Create or find test user
  const testUUID = 'test-user-social-summary-123';
  let testUser = await User.findOne({ quizServerUUID: testUUID });
  if (!testUser) {
    testUser = await User.create({
      quizServerUUID: testUUID,
      userType: 'student',
      name: 'John Doe',
      isOnline: true
    });
    console.log('Created test user John Doe');
  } else {
    testUser.isOnline = true;
    await testUser.save();
    console.log('Found existing test user John Doe');
  }

  // Create another online user so activeUsers has data
  const anotherUUID = 'another-online-user-456';
  let anotherUser = await User.findOne({ quizServerUUID: anotherUUID });
  if (!anotherUser) {
    anotherUser = await User.create({
      quizServerUUID: anotherUUID,
      userType: 'student',
      name: 'Sam Samantha',
      isOnline: true
    });
    console.log('Created another online user Sam');
  } else {
    anotherUser.isOnline = true;
    await anotherUser.save();
  }

  // Generate test JWT
  const token = jwt.sign(
    {
      uuid: testUUID,
      id: testUUID,
      name: 'John Doe',
      role: 'student'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log('\n--- Testing GET /api/user/social-summary ---');
  const res1 = await request(app)
    .get('/api/user/social-summary')
    .set('Authorization', `Bearer ${token}`);

  console.log('Status Code:', res1.status);
  console.log('Response Body:', JSON.stringify(res1.body, null, 2));

  console.log('\n--- Testing GET /api/v1/users/social-summary ---');
  const res2 = await request(app)
    .get('/api/v1/users/social-summary')
    .set('Authorization', `Bearer ${token}`);

  console.log('Status Code:', res2.status);
  console.log('Response Body:', JSON.stringify(res2.body, null, 2));

  // Clean up if desired or just leave it
  await mongoose.connection.close();
  console.log('\nDisconnected from database.');
}

runTest().catch(err => {
  console.error('Test failed:', err);
  mongoose.connection.close();
});
