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
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin')
      );
    }
`;

const replacementSuperAdmin = `
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

code = code.replace(targetSuperAdmin, replacementSuperAdmin);

// And we ALSO need to make sure `list` on posts doesn't fail for normal admins
// Normal admins need to filter by tenantId, so the query MUST be:
// query(collection(db, 'posts'), where('tenantId', '==', tenantId))
// BUT the current frontend just does: query(collection(db, 'posts')) !!
// If the frontend does NOT use `where('tenantId')`, then normal admins will fail.
// So we must fix the frontend too!
fs.writeFileSync('firestore.rules', code);
console.log("Replaced rules safely");
