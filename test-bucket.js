require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
});

async function testBuckets() {
    const bucketsToTest = [
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        "focus-board-91609.appspot.com",
        "focus-board-91609"
    ];

    for (const b of bucketsToTest) {
        if (!b) continue;
        try {
            const bucket = admin.storage().bucket(b);
            const [exists] = await bucket.exists();
            console.log(`Bucket ${b} exists: ${exists}`);
        } catch (e) {
            console.error(`Error testing bucket ${b}:`, e.message);
        }
    }
}

testBuckets();
