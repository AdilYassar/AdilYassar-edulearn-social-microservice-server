# Quiz Server Integration Guide: Social Profile Sync

To ensure the Social Learning platform shows real-time stats (Streaks, Scores, etc.), the Quiz Server must notify the Social Microservice whenever student data changes.

---

## 1. Environment Configuration (Quiz Server)
Add these to your `.env` file on the Quiz Server:
```env
SOCIAL_SERVICE_URL=http://localhost:4001
SOCIAL_INTERNAL_TOKEN=your-shared-secret-token
```

---

## 2. Implementation Strategy

### A. Create the Sync Helper
Create `src/services/socialSync.service.js` in your Quiz Server:

```javascript
const axios = require('axios');

/**
 * Syncs a full student/admin profile to the Social Microservice
 * @param {Object} userData - The full Mongoose user object
 */
const syncToSocial = async (userData) => {
    try {
        // Convert Mongoose doc to plain object if necessary
        const data = userData.toObject ? userData.toObject() : userData;
        
        await axios.post(`${process.env.SOCIAL_SERVICE_URL}/api/v1/internal/users/sync-profile`, 
            data, 
            {
                headers: { 'X-Internal-Token': process.env.SOCIAL_INTERNAL_TOKEN }
            }
        );
        console.log(`[Sync] Successfully pushed ${data.name} to social service.`);
    } catch (error) {
        console.error(`[Sync Error] Failed for ${userData.uuid}:`, error.message);
    }
};

module.exports = { syncToSocial };
```

### B. Trigger Points

#### 1. On Profile Update
In your `StudentController` or `ProfileController`, call the sync helper after a successful update:
```javascript
const student = await Student.findOneAndUpdate({ uuid }, updates, { new: true });
socialSync.syncToSocial(student);
```

#### 2. On Quiz Completion
In your Quiz Grading logic, once the score and streak are updated in the database:
```javascript
await student.save();
socialSync.syncToSocial(student);
```

---

## 3. Mass Migration Script
Run this one-time script from your Quiz Server to populate the Social database with all existing students:

```javascript
const Student = require('./models/Student');
const { syncToSocial } = require('./services/socialSync.service');

const migrateAll = async () => {
    const students = await Student.find({});
    console.log(`Starting migration for ${students.length} students...`);
    
    for (const student of students) {
        await syncToSocial(student);
        // Small delay to prevent rate limiting
        await new Promise(r => setTimeout(r, 100));
    }
    
    console.log("Migration complete!");
};
```

---

## 4. Expected Data Mapping
The Social Microservice automatically maps these Quiz Server fields:
- `uuid` -> `quizServerUUID`
- `name` -> `name`
- `photo` -> `avatar`
- `learningStreak` -> `learningStats.streak`
- `averageScore` -> `learningStats.averageScore`
- `totalQuizzesTaken` -> `learningStats.totalQuizzes`
