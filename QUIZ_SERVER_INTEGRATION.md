# Quiz Server Integration Guide

This document outlines the necessary changes required in your **Quiz Server** codebase to ensure flawless communication with the **Social Microservice**.

## 1. Environment Variables

Add the following variables to your Quiz Server's `.env` file. These **MUST** match the values in the Social Microservice.

```env
# Shared Secret for Internal API communication
QUIZ_SERVER_INTERNAL_TOKEN=your-internal-secret-here

# JWT Secrets (Ensure these match exactly)
JWT_SECRET=your-jwt-access-secret-here
JWT_REFRESH_SECRET=your-jwt-refresh-secret-here
```

## 2. Internal API Middleware

Create a middleware in your Quiz Server to validate requests coming from the Social Microservice.

**File:** `src/middlewares/internal-auth.middleware.js` (Example)

```javascript
const internalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const serviceName = req.headers['x-internal-service'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split(' ')[1];

    if (token !== process.env.QUIZ_SERVER_INTERNAL_TOKEN) {
        return res.status(403).json({ message: 'Forbidden: Invalid internal token' });
    }

    // Optional: Check specific service name if needed
    if (serviceName !== 'social-microservice') {
         // Log warning
    }

    next();
};

module.exports = internalAuth;
```

## 3. Required API Endpoints

The Social Microservice calls these endpoints to fetch user and course data. Register these routes (e.g., in a separate router or under `/api`).

**Usage:** apply the `internalAuth` middleware to these routes.

```javascript
// routes/internal.routes.js
const express = require('express');
const router = express.Router();
const internalAuth = require('../middlewares/internal-auth.middleware');
const User = require('../models/User'); // Your Quiz Server User Model
const Course = require('../models/Course'); // Your Quiz Server Course Model

// 1. Get Single User by UUID
router.get('/user/:uuid', internalAuth, async (req, res) => {
    try {
        const user = await User.findOne({ uuid: req.params.uuid }).select('uuid name email avatar bio role');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get Batch Users (for feed/lists)
router.post('/users/batch', internalAuth, async (req, res) => {
    try {
        const { uuids } = req.body;
        const users = await User.find({ uuid: { $in: uuids } }).select('uuid name email avatar bio role');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get Course Students (for group chats)
router.get('/courses/:courseId/students', internalAuth, async (req, res) => {
    try {
        // adjust logic to find students enrolled in course
        const students = await User.find({ enrolledCourses: req.params.courseId }).select('uuid name avatar');
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
```

## 4. RabbitMQ Event Publishing

The Social Microservice listens for RabbitMQ events to sync user data. You must publish events when users are created or updated.

**Queue Config:** Ensure you connect to the same RabbitMQ instance (`amqp://localhost:5672`).

**Exchange:** `user_events` (Topic Exchange)

**Example Publisher Code:**

```javascript
const amqp = require('amqplib');
let channel;

async function publishUserEvent(routingKey, data) {
    if (!channel) {
        const conn = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await conn.createChannel();
        await channel.assertExchange('user_events', 'topic', { durable: true });
    }
    
    // routingKey examples: 'user.created', 'user.updated', 'user.deleted'
    channel.publish('user_events', routingKey, Buffer.from(JSON.stringify(data)));
}

// Usage in your Auth/User Controller:
// When user registers:
publishUserEvent('user.created', {
    uuid: newUser.uuid,
    name: newUser.name,
    email: newUser.email,
    avatar: newUser.avatar,
    role: newUser.role
});

// When user updates profile:
publishUserEvent('user.updated', {
    uuid: updatedUser.uuid,
    name: updatedUser.name,
    // ...other fields
});
```
