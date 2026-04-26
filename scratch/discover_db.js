const mongoose = require('mongoose');
require('dotenv').config();

async function listDatabases() {
    try {
        console.log('Connecting to MongoDB...');
        // Connect to admin or default
        const uri = process.env.MONGODB_URI;
        const client = await mongoose.connect(uri);
        console.log('✅ Connected');

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('Databases found:');
        for (let db of dbs.databases) {
            console.log(`- ${db.name}`);
        }

    } catch (error) {
        console.error('Error listing databases:', error.message);
        console.log('Attempting to guess database name by checking common ones...');
        
        const commonNames = ['edulearn', 'social_microservice', 'chatting_microservice', 'social', 'test'];
        for (let name of commonNames) {
            try {
                const guessUri = process.env.MONGODB_URI.replace('/?', `/${name}?`);
                const conn = await mongoose.createConnection(guessUri).asPromise();
                const collections = await conn.db.listCollections().toArray();
                const collectionNames = collections.map(c => c.name);
                if (collectionNames.includes('devicetokens')) {
                    console.log(`✅ Found 'devicetokens' in database: ${name}`);
                    const count = await conn.collection('devicetokens').countDocuments();
                    console.log(`   Document count: ${count}`);
                }
                await conn.close();
            } catch (e) {
                // Ignore errors
            }
        }
    } finally {
        await mongoose.disconnect();
    }
}

listDatabases();
