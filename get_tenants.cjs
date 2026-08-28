const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

async function main() {
  const rootPath = process.cwd();
  const configPath = path.resolve(rootPath, "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    console.log("No config file found");
    return;
  }
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  
  const projectId = config.projectId;
  const databaseId = config.firestoreDatabaseId || "(default)";

  console.log("Using projectId:", projectId);
  console.log("Using databaseId:", databaseId);

  const app = admin.initializeApp({
    projectId: projectId,
  });

  const db = getFirestore(app, databaseId);
  try {
    const snap = await db.collection('tenants').get();
    if (snap.empty) {
      console.log("No tenants found.");
      return;
    }
    console.log(`Found ${snap.size} tenants:`);
    snap.forEach(doc => {
      const data = doc.data();
      console.log("-----------------------------------------");
      console.log("ID:", doc.id);
      console.log("Slug:", data.slug);
      console.log("CompanyName:", data.companyName);
      console.log("CustomDomain:", data.customDomain);
    });
  } catch (err) {
    console.error("Firestore query error:", err.message);
  }
}

main();
