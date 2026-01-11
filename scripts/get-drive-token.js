const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Common redirect for generating tokens
);

const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'];

const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
});

console.log('\n🔑 GOOGLE DRIVE AUTHENTICATION 🔑');
console.log('---------------------------------');
console.log('1. Open this URL in your browser:');
console.log(url);
console.log('\n2. Authorize the app.');
console.log('3. You will be redirected to the OAuth Playground.');
console.log('4. Look for the "Authorization Code" in the URL or the playground UI.');
console.log('5. Exchange that code for a REFRESH TOKEN and update your .env file.');
console.log('---------------------------------\n');
