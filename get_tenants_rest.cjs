const fs = require('fs');
const path = require('path');
const axios = require('axios');

function mapRestFields(fields) {
  const result = {};
  if (!fields) return result;
  for (const [key, val] of Object.entries(fields)) {
    const v = val;
    if (v === null || v === undefined) continue;
    if ('stringValue' in v) result[key] = v.stringValue;
    else if ('booleanValue' in v) result[key] = v.booleanValue;
    else if ('integerValue' in v) result[key] = parseInt(v.integerValue, 10);
    else if ('doubleValue' in v) result[key] = parseFloat(v.doubleValue);
    else if ('mapValue' in v) result[key] = mapRestFields(v.mapValue.fields);
    else if ('arrayValue' in v) {
      result[key] = (v.arrayValue.values || []).map((item) => {
        if ('stringValue' in item) return item.stringValue;
        if ('booleanValue' in item) return item.booleanValue;
        if ('integerValue' in item) return parseInt(item.integerValue, 10);
        if ('doubleValue' in item) return parseFloat(item.doubleValue);
        return item;
      });
    } else {
      result[key] = v;
    }
  }
  return result;
}

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
  const apiKey = config.apiKey;

  console.log("Using projectId:", projectId);
  console.log("Using databaseId:", databaseId);

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/tenants?key=${apiKey}`;
  
  const headers = {
    'Referer': `https://${config.authDomain}/`,
    'Origin': `https://${config.authDomain}`
  };

  try {
    const res = await axios.get(url, { headers });
    const docs = res.data.documents || [];
    console.log(`Found ${docs.length} tenants:`);
    docs.forEach(doc => {
      const id = doc.name.split('/').pop();
      const data = mapRestFields(doc.fields);
      console.log("-----------------------------------------");
      console.log("ID:", id);
      console.log("Slug:", data.slug);
      console.log("CompanyName:", data.companyName);
      console.log("CustomDomain:", data.customDomain);
    });
  } catch (err) {
    console.error("REST query error:", err.response?.data || err.message);
  }
}

main();
