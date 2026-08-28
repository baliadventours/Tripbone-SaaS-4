const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf-8');

const targetSuperAdmin = `
    function isSuperAdmin() {
      return isSignedIn() && (
        (request.auth.token.email != null &&
          (request.auth.token.email == 'baliadventours@gmail.com' || 
           request.auth.token.email == 'admin@tripbone.com' ||
          request.auth.token.email == 'kuotabox@gmail.com' ||
          request.auth.token.email.lower() == 'baliadventours@gmail.com' || 
           request.auth.token.email.lower() == 'admin@tripbone.com' ||
          request.auth.token.email.lower() == 'kuotabox@gmail.com')) ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('role', '') == 'superadmin')
      );
    }
`;

const replacementSuperAdmin = `
    function isSuperAdmin() {
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

code = code.replace(targetSuperAdmin, replacementSuperAdmin);
fs.writeFileSync('firestore.rules', code);
console.log("Replaced rules safely");
