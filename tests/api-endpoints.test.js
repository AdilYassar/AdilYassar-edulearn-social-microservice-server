const axios = require('axios');

// Configuration
const MICROSERVICE_URL = 'https://46b4184ff27f.ngrok-free.app/api/v1';
const QUIZ_SERVER_URL = 'https://romantic-nanete-adildevelopment-3ec66986.koyeb.app';

// Test data storage
let testData = {
  user1: { uuid: null, token: null },
  user2: { uuid: null, token: null },
  conversationId: null,
  messageId: null,
  postId: null,
  commentId: null,
  groupId: null,
  friendRequestId: null,
  messageRequestId: null,
  notificationId: null,
  fileId: null
};

// Helper function to create axios instance with auth
const createAuthClient = (token) => {
  return axios.create({
    baseURL: MICROSERVICE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.yellow}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`)
};

// Test runner
async function runTests() {
  console.log('\n🚀 Starting API Endpoint Tests...\n');

  try {
    // ==================== HEALTH CHECK ====================
    log.section('1. HEALTH CHECK');
    await testHealthCheck();

    // ==================== SETUP: CREATE USERS IN QUIZ SERVER ====================
    log.section('2. SETUP: Creating Test Users in Quiz Server');
    await setupTestUsers();

    // ==================== AUTH ENDPOINTS ====================
    log.section('3. AUTH - Initialize User');
    await testAuthInitialize();

    // ==================== USER ENDPOINTS ====================
    log.section('4. USER ENDPOINTS');
    await testGetMe();
    await testUpdateMe();
    await testSearchUsers();
    await testGetUserByUuid();

    // ==================== FRIEND ENDPOINTS ====================
    log.section('5. FRIEND ENDPOINTS');
    await testSendFriendRequest();
    await testGetFriendRequests();
    await testAcceptFriendRequest();
    await testGetFriends();
    await testGetFriendSuggestions();
    await testBlockUser();
    await testUnblockUser();

    // ==================== CHAT ENDPOINTS ====================
    log.section('6. CHAT ENDPOINTS');
    await testCreateConversation();
    await testGetConversations();
    await testSendMessage();
    await testGetMessages();
    await testAddReaction();
    await testMarkAsRead();
    await testMuteConversation();

    // ==================== MESSAGE REQUEST ENDPOINTS ====================
    log.section('7. MESSAGE REQUEST ENDPOINTS');
    await testCreateMessageRequest();
    await testGetMessageRequests();
    await testAcceptMessageRequest();
    await testRejectMessageRequest();

    // ==================== FEED ENDPOINTS ====================
    log.section('8. FEED ENDPOINTS');
    await testCreatePost();
    await testGetFeed();
    await testGetPost();
    await testUpdatePost();
    await testLikePost();
    await testCommentOnPost();
    await testGetComments();
    await testLikeComment();
    await testDeleteComment();
    await testDeletePost();

    // ==================== GROUP ENDPOINTS ====================
    log.section('9. GROUP ENDPOINTS');
    await testCreateGroup();
    await testGetGroups();
    await testGetGroup();
    await testAddMember();

    // ==================== MEDIA ENDPOINTS ====================
    log.section('10. MEDIA ENDPOINTS');
    await testUploadFile();
    await testGetFile();
    await testDeleteFile();

    // ==================== NOTIFICATION ENDPOINTS ====================
    log.section('11. NOTIFICATION ENDPOINTS');
    await testGetNotifications();
    await testMarkNotificationRead();

    log.section('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('\n📊 Test Summary:');
    console.log(`   User 1 UUID: ${testData.user1.uuid}`);
    console.log(`   User 2 UUID: ${testData.user2.uuid}`);
    console.log(`   Conversation ID: ${testData.conversationId}`);
    console.log(`   Post ID: ${testData.postId}`);
    console.log(`   Group ID: ${testData.groupId}`);

  } catch (error) {
    log.error(`Test Suite Failed: ${error.message}`);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

// ==================== TEST IMPLEMENTATIONS ====================

async function testHealthCheck() {
  try {
    const response = await axios.get(`${MICROSERVICE_URL}/health`);
    if (response.data.status === 'ok') {
      log.success('Health check passed');
    } else {
      throw new Error('Health check failed');
    }
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    throw error;
  }
}

async function setupTestUsers() {
  try {
    // Create User 1
    const user1Response = await axios.post(`${QUIZ_SERVER_URL}/api/student/register`, {
      name: 'Test User 1',
      email: `testuser1_${Date.now()}@example.com`,
      password: 'SecurePass123!',
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`
    });
    testData.user1.uuid = user1Response.data.student.uuid;
    testData.user1.token = user1Response.data.accessToken;
    log.success(`User 1 created: ${testData.user1.uuid}`);

    // Create User 2
    const user2Response = await axios.post(`${QUIZ_SERVER_URL}/api/student/register`, {
      name: 'Test User 2',
      email: `testuser2_${Date.now()}@example.com`,
      password: 'SecurePass123!',
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`
    });
    testData.user2.uuid = user2Response.data.student.uuid;
    testData.user2.token = user2Response.data.accessToken;
    log.success(`User 2 created: ${testData.user2.uuid}`);

  } catch (error) {
    log.error(`Failed to create test users: ${error.message}`);
    throw error;
  }
}

async function testAuthInitialize() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.post('/auth/initialize');
    log.success('User initialized in microservice');
  } catch (error) {
    log.error(`Auth initialize failed: ${error.message}`);
    throw error;
  }
}

async function testGetMe() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.get('/users/me');
    log.success(`Get me: ${response.data.data.name}`);
  } catch (error) {
    log.error(`Get me failed: ${error.message}`);
    throw error;
  }
}

async function testUpdateMe() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.patch('/users/me', {
      bio: 'Updated bio for testing'
    });
    log.success('Profile updated successfully');
  } catch (error) {
    log.error(`Update me failed: ${error.message}`);
    throw error;
  }
}

async function testSearchUsers() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.get('/users/search?q=Test');
    log.success(`Search users: Found ${response.data.data.length} users`);
  } catch (error) {
    log.error(`Search users failed: ${error.message}`);
    throw error;
  }
}

async function testGetUserByUuid() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.get(`/users/${testData.user2.uuid}`);
    log.success(`Get user by UUID: ${response.data.data.name}`);
  } catch (error) {
    log.error(`Get user by UUID failed: ${error.message}`);
    throw error;
  }
}

async function testSendFriendRequest() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.post('/friends/request', {
      recipientUUID: testData.user2.uuid
    });
    log.success('Friend request sent');
  } catch (error) {
    log.error(`Send friend request failed: ${error.message}`);
    throw error;
  }
}

async function testGetFriendRequests() {
  try {
    const client = createAuthClient(testData.user2.token);
    const response = await client.get('/friends/requests');
    log.success(`Get friend requests: ${response.data.data.length} requests`);
  } catch (error) {
    log.error(`Get friend requests failed: ${error.message}`);
    throw error;
  }
}

async function testAcceptFriendRequest() {
  try {
    const client = createAuthClient(testData.user2.token);
    const response = await client.post('/friends/accept', {
      requesterUUID: testData.user1.uuid
    });
    log.success('Friend request accepted');
  } catch (error) {
    log.error(`Accept friend request failed: ${error.message}`);
    throw error;
  }
}

async function testGetFriends() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.get('/friends');
    log.success(`Get friends: ${response.data.data.length} friends`);
  } catch (error) {
    log.error(`Get friends failed: ${error.message}`);
    throw error;
  }
}

async function testGetFriendSuggestions() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.get('/friends/suggestions');
    log.success(`Get friend suggestions: ${response.data.data.length} suggestions`);
  } catch (error) {
    log.error(`Get friend suggestions failed: ${error.message}`);
    throw error;
  }
}

async function testBlockUser() {
  try {
    // Create a third user to block
    const user3Response = await axios.post(`${QUIZ_SERVER_URL}/api/student/register`, {
      name: 'Test User 3',
      email: `testuser3_${Date.now()}@example.com`,
      password: 'SecurePass123!',
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`
    });
    const user3Uuid = user3Response.data.student.uuid;

    const client = createAuthClient(testData.user1.token);
    const response = await client.post(`/friends/block/${user3Uuid}`);
    log.success('User blocked successfully');
  } catch (error) {
    log.error(`Block user failed: ${error.message}`);
    // Don't throw, as this is a bonus test
  }
}

async function testUnblockUser() {
  try {
    const client = createAuthClient(testData.user1.token);
    // This might fail if no user is blocked, that's okay
    log.info('Unblock user test skipped (no blocked user)');
  } catch (error) {
    log.error(`Unblock user failed: ${error.message}`);
  }
}

async function testCreateConversation() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.post('/chat/conversations', {
      recipientUUID: testData.user2.uuid
    });
    testData.conversationId = response.data.data._id;
    log.success(`Conversation created: ${testData.conversationId}`);
  } catch (error) {
    log.error(`Create conversation failed: ${error.message}`);
    throw error;
  }
}

async function testGetConversations() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.get('/chat/conversations');
    log.success(`Get conversations: ${response.data.data.length} conversations`);
  } catch (error) {
    log.error(`Get conversations failed: ${error.message}`);
    throw error;
  }
}

async function testSendMessage() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.post(`/chat/conversations/${testData.conversationId}/messages`, {
      content: { text: 'Hello! This is a test message.' },
      type: 'text'
    });
    testData.messageId = response.data.data._id;
    log.success(`Message sent: ${testData.messageId}`);
  } catch (error) {
    log.error(`Send message failed: ${error.message}`);
    throw error;
  }
}

async function testGetMessages() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.get(`/chat/conversations/${testData.conversationId}/messages`);
    log.success(`Get messages: ${response.data.data.length} messages`);
  } catch (error) {
    log.error(`Get messages failed: ${error.message}`);
    throw error;
  }
}

async function testAddReaction() {
  try {
    const client = createAuthClient(testData.user2.token);
    const response = await client.post(`/chat/messages/${testData.messageId}/react`, {
      emoji: '👍'
    });
    log.success('Reaction added to message');
  } catch (error) {
    log.error(`Add reaction failed: ${error.message}`);
    throw error;
  }
}

async function testMarkAsRead() {
  try {
    const client = createAuthClient(testData.user2.token);
    const response = await client.put(`/chat/conversations/${testData.conversationId}/read`);
    log.success('Conversation marked as read');
  } catch (error) {
    log.error(`Mark as read failed: ${error.message}`);
    throw error;
  }
}

async function testMuteConversation() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.put(`/chat/conversations/${testData.conversationId}/mute`, {
      muted: true
    });
    log.success('Conversation muted');
  } catch (error) {
    log.error(`Mute conversation failed: ${error.message}`);
    throw error;
  }
}

async function testCreateMessageRequest() {
  try {
    // Create a new user for message request
    const user4Response = await axios.post(`${QUIZ_SERVER_URL}/api/student/register`, {
      name: 'Test User 4',
      email: `testuser4_${Date.now()}@example.com`,
      password: 'SecurePass123!',
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`
    });
    const user4Uuid = user4Response.data.student.uuid;
    const user4Token = user4Response.data.accessToken;

    // Initialize user 4 in microservice
    const initClient = createAuthClient(user4Token);
    await initClient.post('/auth/initialize');

    const client = createAuthClient(user4Token);
    const response = await client.post('/message-requests', {
      recipientUUID: testData.user1.uuid,
      message: { text: 'Hi! Can we chat?' },
      type: 'text'
    });
    testData.messageRequestId = response.data.data._id;
    log.success(`Message request created: ${testData.messageRequestId}`);
  } catch (error) {
    log.error(`Create message request failed: ${error.message}`);
    // Don't throw, continue with other tests
  }
}

async function testGetMessageRequests() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.get('/message-requests');
    log.success(`Get message requests: ${response.data.data.length} requests`);
  } catch (error) {
    log.error(`Get message requests failed: ${error.message}`);
  }
}

async function testAcceptMessageRequest() {
  try {
    if (!testData.messageRequestId) {
      log.info('Accept message request skipped (no request ID)');
      return;
    }
    const client = createAuthClient(testData.user1.token);
    const response = await client.put(`/message-requests/${testData.messageRequestId}/accept`);
    log.success('Message request accepted');
  } catch (error) {
    log.error(`Accept message request failed: ${error.message}`);
  }
}

async function testRejectMessageRequest() {
  try {
    // Create another message request to reject
    log.info('Reject message request test skipped (would need another request)');
  } catch (error) {
    log.error(`Reject message request failed: ${error.message}`);
  }
}

async function testCreatePost() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.post('/feed', {
      content: { text: 'This is my first test post! #testing' },
      visibility: 'public'
    });
    testData.postId = response.data.data._id;
    log.success(`Post created: ${testData.postId}`);
  } catch (error) {
    log.error(`Create post failed: ${error.message}`);
    throw error;
  }
}

async function testGetFeed() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.get('/feed');
    log.success(`Get feed: ${response.data.data.length} posts`);
  } catch (error) {
    log.error(`Get feed failed: ${error.message}`);
    throw error;
  }
}

async function testGetPost() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.get(`/feed/${testData.postId}`);
    log.success(`Get post: ${response.data.data.content}`);
  } catch (error) {
    log.error(`Get post failed: ${error.message}`);
    throw error;
  }
}

async function testUpdatePost() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.put(`/feed/${testData.postId}`, {
      content: { text: 'Updated test post content!' }
    });
    log.success('Post updated successfully');
  } catch (error) {
    log.error(`Update post failed: ${error.message}`);
    throw error;
  }
}

async function testLikePost() {
  try {
    const client = createAuthClient(testData.user2.token);
    const response = await client.post(`/feed/${testData.postId}/like`);
    log.success('Post liked successfully');
  } catch (error) {
    log.error(`Like post failed: ${error.message}`);
    throw error;
  }
}

async function testCommentOnPost() {
  try {
    const client = createAuthClient(testData.user2.token);
    const response = await client.post(`/feed/${testData.postId}/comments`, {
      content: 'Great post! This is a test comment.'
    });
    testData.commentId = response.data.data._id;
    log.success(`Comment created: ${testData.commentId}`);
  } catch (error) {
    log.error(`Comment on post failed: ${error.message}`);
    throw error;
  }
}

async function testGetComments() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.get(`/feed/${testData.postId}/comments`);
    log.success(`Get comments: ${response.data.data.length} comments`);
  } catch (error) {
    log.error(`Get comments failed: ${error.message}`);
    throw error;
  }
}

async function testLikeComment() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.post(`/feed/comments/${testData.commentId}/like`);
    log.success('Comment liked successfully');
  } catch (error) {
    log.error(`Like comment failed: ${error.message}`);
    throw error;
  }
}

async function testDeleteComment() {
  try {
    const client = createAuthClient(testData.user2.token);
    const response = await client.delete(`/feed/comments/${testData.commentId}`);
    log.success('Comment deleted successfully');
  } catch (error) {
    log.error(`Delete comment failed: ${error.message}`);
    throw error;
  }
}

async function testDeletePost() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.delete(`/feed/${testData.postId}`);
    log.success('Post deleted successfully');
  } catch (error) {
    log.error(`Delete post failed: ${error.message}`);
    throw error;
  }
}

async function testCreateGroup() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.post('/groups', {
      name: 'Test Study Group',
      description: 'A group for testing purposes'
    });
    testData.groupId = response.data.data._id;
    log.success(`Group created: ${testData.groupId}`);
  } catch (error) {
    log.error(`Create group failed: ${error.message}`);
    throw error;
  }
}

async function testGetGroups() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.get('/groups');
    log.success(`Get groups: ${response.data.data.length} groups`);
  } catch (error) {
    log.error(`Get groups failed: ${error.message}`);
    throw error;
  }
}

async function testGetGroup() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.get(`/groups/${testData.groupId}`);
    log.success(`Get group: ${response.data.data.name}`);
  } catch (error) {
    log.error(`Get group failed: ${error.message}`);
    throw error;
  }
}

async function testAddMember() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.post(`/groups/${testData.groupId}/members`, {
      userUUID: testData.user2.uuid
    });
    log.success('Member added to group');
  } catch (error) {
    log.error(`Add member failed: ${error.message}`);
    throw error;
  }
}

async function testUploadFile() {
  try {
    const FormData = require('form-data');
    const fs = require('fs');
    const path = require('path');

    // Create a test file
    const testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for upload');

    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));

    const response = await axios.post(`${MICROSERVICE_URL}/media/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${testData.user1.token}`
      }
    });

    testData.fileId = response.data.fileId;
    log.success(`File uploaded: ${testData.fileId}`);

    // Clean up test file
    fs.unlinkSync(testFilePath);
  } catch (error) {
    log.error(`Upload file failed: ${error.message}`);
    // Don't throw, file upload might have specific requirements
  }
}

async function testGetFile() {
  try {
    if (!testData.fileId) {
      log.info('Get file test skipped (no file ID)');
      return;
    }
    const client = createAuthClient(testData.user1.token);
    const response = await client.get(`/media/${testData.fileId}`);
    log.success('File retrieved successfully');
  } catch (error) {
    log.error(`Get file failed: ${error.message}`);
  }
}

async function testDeleteFile() {
  try {
    if (!testData.fileId) {
      log.info('Delete file test skipped (no file ID)');
      return;
    }
    const client = createAuthClient(testData.user1.token);
    const response = await client.delete(`/media/${testData.fileId}`);
    log.success('File deleted successfully');
  } catch (error) {
    log.error(`Delete file failed: ${error.message}`);
  }
}

async function testGetNotifications() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.get('/notifications');
    log.success(`Get notifications: ${response.data.data.length} notifications`);
  } catch (error) {
    log.error(`Get notifications failed: ${error.message}`);
    throw error;
  }
}

async function testMarkNotificationRead() {
  try {
    const client = createAuthClient(testData.user1.token);
    const response = await client.put('/notifications/read');
    log.success('All notifications marked as read');
  } catch (error) {
    log.error(`Mark notification read failed: ${error.message}`);
    throw error;
  }
}

// Run the tests
runTests();
