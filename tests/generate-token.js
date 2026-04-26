const jwt = require('jsonwebtoken');

const JWT_SECRET = '7f8afcb202f73909ad8b223f83ecf3e6dd37a26a9e450df8bf';

// Create a test token
const testToken = jwt.sign(
  {
    uuid: 'test-user-123',
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User'
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('Test JWT Token:');
console.log(testToken);
