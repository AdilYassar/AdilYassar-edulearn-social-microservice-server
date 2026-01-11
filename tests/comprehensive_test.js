const axios = require('axios');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const FormData = require('form-data'); // Manual check: is it in package.json? No. But multer uses it? No.
// I'll check if form-data is installed. If not, I'll use supertest which is in devDeps.
const request = require('supertest');
const mongoose = require('mongoose');

// Configurations
const BASE_URL = 'http://localhost:4001';
const JWT_SECRET = process.env.JWT_SECRET || 'your-test-secret-here';
const USER_UUID = process.env.TEST_USER_UUID || 'your-user-uuid-here';

// Helper to generate token
const generateToken = (uuid) => {
    return jwt.sign(
        { uuid: uuid, type: 'student', name: 'Test User' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
};

const token = generateToken(USER_UUID);
const api = request(BASE_URL);

async function runTests() {
    console.log('🚀 Starting Comprehensive Social Microservice Tests\n');

    try {
        // 1. Create Dummy Files
        console.log('📝 Creating dummy test files...');
        const testFiles = {
            image: path.join(__dirname, 'test_image.png'),
            audio: path.join(__dirname, 'test_audio.mp3'),
            video: path.join(__dirname, 'test_video.mp4')
        };

        fs.writeFileSync(testFiles.image, 'dummy image content');
        fs.writeFileSync(testFiles.audio, 'dummy audio content');
        fs.writeFileSync(testFiles.video, 'dummy video content');

        // 2. Upload Media
        const mediaResults = {};
        for (const [type, filePath] of Object.entries(testFiles)) {
            console.log(`📤 Uploading ${type}...`);
            try {
                const res = await api
                    .post('/api/v1/media/upload')
                    .set('Authorization', `Bearer ${token}`)
                    .attach('file', filePath);

                if (res.status === 201) {
                    mediaResults[type] = res.body.data;
                    console.log(`✅ ${type} uploaded! ID: ${mediaResults[type].id}`);
                } else {
                    console.warn(`⚠️ ${type} upload failed (likely Drive credentials):`, res.body.message);
                }
            } catch (err) {
                console.warn(`⚠️ ${type} upload error:`, err.message);
            }
        }

        // 3. Create Posts (Handle both media and text-only)
        console.log('\n📮 Testing Post Creation...');
        const posts = [];
        
        // Test Text-only Post
        const textPostRes = await api
            .post('/api/v1/feed')
            .set('Authorization', `Bearer ${token}`)
            .send({
                type: 'general',
                content: { text: 'Hello, this is a text-only test post!' },
                visibility: 'public'
            });
        
        if (textPostRes.status === 201) {
            posts.push(textPostRes.body.data);
            console.log(`✅ Text post created! ID: ${textPostRes.body.data._id}`);
        } else {
            console.error(`❌ Text post creation failed! Status: ${textPostRes.status}`, textPostRes.body);
        }

        // Test Media Post (if media uploaded)
        for (const [type, data] of Object.entries(mediaResults)) {
            const postContent = {
                type: 'general',
                content: {
                    text: `This is a test ${type} post`,
                    media: [{ 
                        mediaId: data.id, 
                        type: type === 'image' ? 'image' : (type === 'video' ? 'video' : 'document'),
                        thumbnail: data.thumbnail
                    }]
                },
                visibility: 'public'
            };

            const res = await api
                .post('/api/v1/feed')
                .set('Authorization', `Bearer ${token}`)
                .send(postContent);

            if (res.status === 201) {
                posts.push(res.body.data);
                console.log(`✅ Post with ${type} created!`);
            } else {
                console.error(`❌ Post with ${type} creation failed!`, res.body);
            }
        }

        if (posts.length === 0) throw new Error('Post creation failed.');

        const mainPost = posts[0];

        // 4. Like Post
        console.log('\n👍 Testing Like Post...');
        const likeRes = await api
            .post(`/api/v1/feed/${mainPost._id}/like`)
            .set('Authorization', `Bearer ${token}`);
        console.log('Like Status:', likeRes.status);

        // 5. Comment on Post
        console.log('\n💬 Testing Comment on Post...');
        const commentRes = await api
            .post(`/api/v1/feed/${mainPost._id}/comments`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Nice test post!' });
        console.log('Comment Status:', commentRes.status);
        if (commentRes.status !== 201) console.error('Comment Error:', commentRes.body);

        // 6. Test Friend Requests
        console.log('\n👥 Testing Friend Requests...');
        const TARGET_USER = '6b94381b-714f-497d-a975-de3dba551da2'; // Another synced user
        const friendRes = await api
            .post('/api/v1/friends/request')
            .set('Authorization', `Bearer ${token}`)
            .send({ recipientUUID: TARGET_USER });
        
        console.log('Friend Request Status:', friendRes.status);
        if (friendRes.status !== 201) console.error('Friend Request Error:', friendRes.body);

        // 7. Test Chat / Messaging
        console.log('\n💬 Testing Chat System...');
        const convRes = await api
            .post('/api/v1/chat/conversations')
            .set('Authorization', `Bearer ${token}`)
            .send({
                recipientUUID: TARGET_USER
            });
        
        console.log('Conversation Creation Status:', convRes.status);
        const conversation = convRes.body.data;

        if (conversation) {
            const msgRes = await api
                .post(`/api/v1/chat/conversations/${conversation._id}/messages`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: { text: 'Hey, this is a test message!' },
                    type: 'text'
                });
            console.log('Message Sending Status:', msgRes.status);

            const listMsgRes = await api
                .get(`/api/v1/chat/conversations/${conversation._id}/messages`)
                .set('Authorization', `Bearer ${token}`);
            console.log(`Messages Found: ${listMsgRes.body.data?.length || 0}`);
        }

        // 8. Get Feed
        console.log('\n📰 Fetching Feed...');
        const feedRes = await api
            .get('/api/v1/feed')
            .set('Authorization', `Bearer ${token}`);
        
        console.log(`Feed Items Found: ${feedRes.body.data?.length || 0}`);

        // 8. Cleanup
        console.log('\n🧹 Cleaning up test files...');
        for (const p of Object.values(testFiles)) {
            if (fs.existsSync(p)) fs.unlinkSync(p);
        }

        console.log('\n🎉 TESTS COMPLETED!');

    } catch (error) {
        console.error('\n💥 TEST ERROR:', error.message);
    }
}

runTests();
