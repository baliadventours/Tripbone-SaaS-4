const axios = require('axios');
const fs = require('fs');

async function run() {
  const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
  const projectId = config.projectId;
  const databaseId = config.firestoreDatabaseId;
  const apiKey = config.apiKey;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery?key=${apiKey}`;
  
  const structuredQuery = {
    from: [{ collectionId: 'tenants' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'slug' },
        op: 'EQUAL',
        value: { stringValue: 'smartbalitours_mrlpz834' }
      }
    },
    limit: 1
  };

  try {
    const res = await axios.post(url, { structuredQuery });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
run();
