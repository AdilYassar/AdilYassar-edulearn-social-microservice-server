const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:4001';
const API_V1 = `${BASE_URL}/api/v1`;

// Helper to make requests
const request = (method, url, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

// Test functions
const tests = {
  // 1. Health Check
  async healthCheck() {
    console.log('\n========== HEALTH CHECK ==========');
    try {
      const res = await request('GET', `${API_V1}/health`);
      console.log(`✓ Status: ${res.status}`);
      console.log(`✓ Response:`, res.body);
      return res.status === 200;
    } catch (err) {
      console.error('✗ Error:', err.message);
      return false;
    }
  },

  // 2. Initialize User (Auth)
  async initializeUser() {
    console.log('\n========== INITIALIZE USER ==========');
    try {
      // First, you need a valid token. For testing, we'll create a mock scenario
      // In real world, this endpoint requires authentication
      const mockToken = 'test-token-12345'; // This should be a real token from your auth system
      
      const res = await request(
        'POST',
        `${API_V1}/auth/initialize`,
        { 'Authorization': `Bearer ${mockToken}` },
        { name: 'Test User', email: 'test@example.com' }
      );
      
      console.log(`✓ Status: ${res.status}`);
      console.log(`✓ Response:`, res.body);
      return res.body?.data?.token || null;
    } catch (err) {
      console.error('✗ Error:', err.message);
      return null;
    }
  },

  // 3. Get Current User
  async getMe(token) {
    console.log('\n========== GET CURRENT USER ==========');
    if (!token) {
      console.warn('⚠ No token provided, skipping...');
      return null;
    }
    try {
      const res = await request(
        'GET',
        `${API_V1}/users/me`,
        { 'Authorization': `Bearer ${token}` }
      );
      
      console.log(`✓ Status: ${res.status}`);
      console.log(`✓ Response:`, res.body);
      return res.body?.data;
    } catch (err) {
      console.error('✗ Error:', err.message);
      return null;
    }
  },

  // 4. Search Users
  async searchUsers(token, query = 'test') {
    console.log('\n========== SEARCH USERS ==========');
    if (!token) {
      console.warn('⚠ No token provided, skipping...');
      return null;
    }
    try {
      const res = await request(
        'GET',
        `${API_V1}/users/search?q=${query}`,
        { 'Authorization': `Bearer ${token}` }
      );
      
      console.log(`✓ Status: ${res.status}`);
      console.log(`✓ Response:`, res.body);
      return res.body?.data;
    } catch (err) {
      console.error('✗ Error:', err.message);
      return null;
    }
  },

  // 5. Create Post
  async createPost(token) {
    console.log('\n========== CREATE POST ==========');
    if (!token) {
      console.warn('⚠ No token provided, skipping...');
      return null;
    }
    try {
      const postData = {
        content: 'This is a test post created at ' + new Date().toISOString(),
        mediaUrls: [],
      };

      const res = await request(
        'POST',
        `${API_V1}/feed`,
        { 'Authorization': `Bearer ${token}` },
        postData
      );

      console.log(`✓ Status: ${res.status}`);
      console.log(`✓ Response:`, res.body);
      return res.body?.data?._id || res.body?.data?.id;
    } catch (err) {
      console.error('✗ Error:', err.message);
      return null;
    }
  },

  // 6. Get Feed
  async getFeed(token) {
    console.log('\n========== GET FEED ==========');
    if (!token) {
      console.warn('⚠ No token provided, skipping...');
      return null;
    }
    try {
      const res = await request(
        'GET',
        `${API_V1}/feed?limit=10&skip=0`,
        { 'Authorization': `Bearer ${token}` }
      );

      console.log(`✓ Status: ${res.status}`);
      console.log(`✓ Response count:`, res.body?.data?.length || 0);
      if (res.body?.data?.length > 0) {
        console.log(`✓ First post:`, res.body.data[0]);
      } else {
        console.log(`⚠ No posts found in feed`);
      }
      return res.body?.data || [];
    } catch (err) {
      console.error('✗ Error:', err.message);
      return [];
    }
  },

  // 7. Get Single Post
  async getPost(token, postId) {
    console.log('\n========== GET SINGLE POST ==========');
    if (!token || !postId) {
      console.warn('⚠ No token or post ID, skipping...');
      return null;
    }
    try {
      const res = await request(
        'GET',
        `${API_V1}/feed/${postId}`,
        { 'Authorization': `Bearer ${token}` }
      );

      console.log(`✓ Status: ${res.status}`);
      console.log(`✓ Response:`, res.body);
      return res.body?.data;
    } catch (err) {
      console.error('✗ Error:', err.message);
      return null;
    }
  },

  // 8. Like Post
  async likePost(token, postId) {
    console.log('\n========== LIKE POST ==========');
    if (!token || !postId) {
      console.warn('⚠ No token or post ID, skipping...');
      return false;
    }
    try {
      const res = await request(
        'POST',
        `${API_V1}/feed/${postId}/like`,
        { 'Authorization': `Bearer ${token}` },
        {}
      );

      console.log(`✓ Status: ${res.status}`);
      console.log(`✓ Response:`, res.body);
      return res.status === 200;
    } catch (err) {
      console.error('✗ Error:', err.message);
      return false;
    }
  },

  // 9. Comment on Post
  async commentOnPost(token, postId) {
    console.log('\n========== COMMENT ON POST ==========');
    if (!token || !postId) {
      console.warn('⚠ No token or post ID, skipping...');
      return null;
    }
    try {
      const commentData = {
        content: 'This is a test comment at ' + new Date().toISOString(),
      };

      const res = await request(
        'POST',
        `${API_V1}/feed/${postId}/comments`,
        { 'Authorization': `Bearer ${token}` },
        commentData
      );

      console.log(`✓ Status: ${res.status}`);
      console.log(`✓ Response:`, res.body);
      return res.body?.data;
    } catch (err) {
      console.error('✗ Error:', err.message);
      return null;
    }
  },

  // 10. Get Comments
  async getComments(token, postId) {
    console.log('\n========== GET COMMENTS ==========');
    if (!token || !postId) {
      console.warn('⚠ No token or post ID, skipping...');
      return [];
    }
    try {
      const res = await request(
        'GET',
        `${API_V1}/feed/${postId}/comments`,
        { 'Authorization': `Bearer ${token}` }
      );

      console.log(`✓ Status: ${res.status}`);
      console.log(`✓ Response count:`, res.body?.data?.length || 0);
      if (res.body?.data?.length > 0) {
        console.log(`✓ Comments:`, res.body.data);
      }
      return res.body?.data || [];
    } catch (err) {
      console.error('✗ Error:', err.message);
      return [];
    }
  },

  // 11. Get Friends
  async getFriends(token) {
    console.log('\n========== GET FRIENDS ==========');
    if (!token) {
      console.warn('⚠ No token provided, skipping...');
      return [];
    }
    try {
      const res = await request(
        'GET',
        `${API_V1}/friends`,
        { 'Authorization': `Bearer ${token}` }
      );

      console.log(`✓ Status: ${res.status}`);
      console.log(`✓ Response count:`, res.body?.data?.length || 0);
      return res.body?.data || [];
    } catch (err) {
      console.error('✗ Error:', err.message);
      return [];
    }
  },

  // 12. Get Notifications
  async getNotifications(token) {
    console.log('\n========== GET NOTIFICATIONS ==========');
    if (!token) {
      console.warn('⚠ No token provided, skipping...');
      return [];
    }
    try {
      const res = await request(
        'GET',
        `${API_V1}/notifications`,
        { 'Authorization': `Bearer ${token}` }
      );

      console.log(`✓ Status: ${res.status}`);
      console.log(`✓ Response count:`, res.body?.data?.length || 0);
      return res.body?.data || [];
    } catch (err) {
      console.error('✗ Error:', err.message);
      return [];
    }
  },
};

// Main test runner
const runTests = async () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  COMPREHENSIVE API ENDPOINT TEST SUITE     ║');
  console.log('║  Base URL:', BASE_URL);
  console.log('╚════════════════════════════════════════════╝');

  let token = process.env.TEST_TOKEN; // You can set this via environment variable or .env

  // Run tests in sequence
  const healthOk = await tests.healthCheck();
  
  if (!healthOk) {
    console.error('\n❌ Server not responding. Make sure it\'s running on port 4001');
    console.error('Start the server with: npm start');
    process.exit(1);
  }

  // If no token, try to initialize
  if (!token) {
    console.log('\n⚠ No TEST_TOKEN found. Set a valid JWT token in .env file as TEST_TOKEN');
    console.log('Example: TEST_TOKEN=your_jwt_token_here');
    console.log('\n✓ Demonstrating with available public endpoints...');
  } else {
    console.log('\n✓ Using TEST_TOKEN from environment...');
    
    await tests.getMe(token);
    await tests.searchUsers(token);
    
    const postId = await tests.createPost(token);
    await tests.getFeed(token);
    
    if (postId) {
      await tests.getPost(token, postId);
      await tests.likePost(token, postId);
      await tests.commentOnPost(token, postId);
      await tests.getComments(token, postId);
    }
    
    await tests.getFriends(token);
    await tests.getNotifications(token);
  }

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║         TEST SUITE COMPLETED               ║');
  console.log('╚════════════════════════════════════════════╝\n');
};

// Run the tests
runTests().catch(console.error);
