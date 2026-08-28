const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf-8');

const regex = /function isSuperAdmin\(\) \{[\s\S]*?\}\n/g;
const replacement = `function isSuperAdmin() {
      return isSignedIn() && (
        (request.auth.token.email != null &&
          (request.auth.token.email == 'baliadventours@gmail.com' || 
           request.auth.token.email == 'admin@tripbone.com' ||
          request.auth.token.email == 'kuotabox@gmail.com')) ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('role', '') == 'superadmin')
      );
    }
`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('firestore.rules', code);
  console.log("Regex replaced isSuperAdmin successfully.");
} else {
  console.log("No match found for isSuperAdmin regex!");
}

