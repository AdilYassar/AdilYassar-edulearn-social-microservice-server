const fs = require('fs');
const path = require('path');

// Change this path if your service account file is named differently
const SERVICE_ACCOUNT_FILE = 'src/config/firebase-service-account.json';

try {
    const filePath = path.join(process.cwd(), SERVICE_ACCOUNT_FILE);
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: File not found at ${filePath}`);
        console.log('Please make sure your Firebase service account JSON file is in src/config/');
        process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Validate it's proper JSON
    JSON.parse(fileContent);

    const base64String = Buffer.from(fileContent).toString('base64');

    console.log('\n✅ Firebase Service Account converted to Base64 successfully!');
    console.log('\n--- COPY THE STRING BELOW ---');
    console.log(base64String);
    console.log('--- END OF STRING ---\n');
    console.log('Use this string as the value for FIREBASE_SERVICE_ACCOUNT_JSON in your Koyeb environment variables.');

} catch (error) {
    console.error('❌ Error processing file:', error.message);
}
