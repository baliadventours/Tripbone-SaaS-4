const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('billingPlans').get();
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data().name, doc.data().slug, doc.data().interval, doc.data().price);
  });
}

run();
