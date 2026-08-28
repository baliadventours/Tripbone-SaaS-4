const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('users').where('role', '==', 'superadmin').get();
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
  
  const bali = await db.collection('users').where('email', '==', 'baliadventours@gmail.com').get();
  bali.forEach(doc => {
    console.log('Bali User:', doc.id, '=>', doc.data());
  });
}

run().catch(console.error);
