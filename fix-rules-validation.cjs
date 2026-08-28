const fs = require('fs');
console.log("Checking if posts rules were updated in firestore.rules...");
const code = fs.readFileSync('firestore.rules', 'utf-8');
if (code.includes('allow list: if isSignedIn();')) {
  console.log("Validation successful. Posts rules updated.");
} else {
  console.log("Validation failed.");
}
