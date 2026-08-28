const axios = require('axios');
const fs = require('fs');
async function run() {
  const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/tenants?key=${config.apiKey}`;
  const res = await axios.get(url);
  res.data.documents.forEach(doc => {
    const data = doc.fields;
    console.log("ID:", doc.name.split('/').pop());
    console.log("Slug:", data.slug ? data.slug.stringValue : 'none');
  });
}
run();
