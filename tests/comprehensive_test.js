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
            const res = await api
                .post('/api/v1/media/upload')
                .set('Authorization', `Bearer ${token}`)
                .attach('file', filePath);

            if (res.status === 201) {
                mediaResults[type] = res.body.data;
                console.log(`✅ ${type} uploaded! ID: ${mediaResults[type].id}`);
            } else {
                console.error(`❌ ${type} upload failed:`, res.body);
            }
        }

        if (Object.keys(mediaResults).length === 0) {
            throw new Error('All uploads failed. Stopping test.');
        }

        // 3. Create Posts
        console.log('\n📮 Creating posts with media...');
        const posts = [];
        for (const [type, data] of Object.entries(mediaResults)) {
            const postContent = {
                type: type === 'image' ? 'post' : type,
                content: {
                    text: `This is a test ${type} post`,
                    media: [
                        {
                            type: type,
                            url: data.url,
                            fileId: data.id,
                            thumbnail: data.thumbnail
                        }
                    ]
                },
                visibility: 'public'
            };

            const res = await api
                .post('/api/v1/feed')
                .set('Authorization', `Bearer ${token}`)
                .send(postContent);

            if (res.status === 201) {
                posts.push(res.body.data);
                console.log(`✅ Post with ${type} created! ID: ${res.body.data._id}`);
            } else {
                console.error(`❌ Failed to create post with ${type}:`, res.body);
            }
        }

        const mainPost = posts[0];
        if (!mainPost) throw new Error('Post creation failed.');

        // 4. Like Post
        console.log('\n👍 Testing Like Post...');
        const likeRes = await api
            .post(`/api/v1/feed/${mainPost._id}/like`)
            .set('Authorization', `Bearer ${token}`);
        console.log('Like Status:', likeRes.status, likeRes.body.data);

        // 5. Comment on Post
        console.log('\n💬 Testing Comment on Post...');
        const commentRes = await api
            .post(`/api/v1/feed/${mainPost._id}/comments`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Nice test post!' });
        console.log('Comment Status:', commentRes.status, commentRes.body.data?._id);

        // 6. Get Feed
        console.log('\n📰 Fetching Feed...');
        const feedRes = await api
            .get('/api/v1/feed')
            .set('Authorization', `Bearer ${token}`);
        
        console.log(`Feed Status: ${feedRes.status}, Items: ${feedRes.body.data?.length}`);
        
        const found = feedRes.body.data?.find(p => p._id === mainPost._id.toString());
        if (found) {
            console.log('✅ Found our test post in feed!');
            console.log('🔗 Media URL:', found.content.media[0]?.url);
            console.log('📊 Stats:', found.stats);
        } else {
            console.log('❌ Test post not found in feed.');
        }

        // 7. Cleanup (Optional: Delete files from GDrive if service implemented it)
        console.log('\n🧹 Cleaning up test files...');
        for (const p of Object.values(testFiles)) {
            if (fs.existsSync(p)) fs.unlinkSync(p);
        }

        console.log('\n🎉 COMPREHENSIVE TEST COMPLETED!');

    } catch (error) {
        console.error('\n💥 TEST ERROR:', error.message);
    }
}

runTests();
