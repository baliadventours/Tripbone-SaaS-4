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
    function getEmail() {
      return request.auth.token.get('email', '');
    }
    function isSuperAdmin() {
      return isSignedIn() && (
        (getEmail().lower() == 'baliadventours@gmail.com' || 
         getEmail().lower() == 'admin@tripbone.com' ||
         getEmail().lower() == 'kuotabox@gmail.com') ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin')
      );
    }
`;

const targetAdmin = `
    function isAdmin() {
      return isSignedIn() && (
        isSuperAdmin() || (
          exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
          getUserData().role == 'admin' &&
          (
            (request.resource != null && request.resource.data.tenantId != null && getUserData().tenantId == request.resource.data.tenantId) ||
            (resource != null && resource.data.tenantId != null && getUserData().tenantId == resource.data.tenantId) ||
            (
              (request.resource == null || request.resource.data.tenantId == null) &&
              (resource == null || resource.data.tenantId == null)
            )
          )
        )
      );
    }
`;

const replacementAdmin = `
    function isAdmin() {
      return isSignedIn() && (
        isSuperAdmin() || (
          exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
          getUserData().role == 'admin' &&
          (
            (request.resource != null && request.resource.data.get('tenantId', null) != null && getUserData().get('tenantId', null) == request.resource.data.get('tenantId', null)) ||
            (resource != null && resource.data.get('tenantId', null) != null && getUserData().get('tenantId', null) == resource.data.get('tenantId', null)) ||
            (
              (request.resource == null || request.resource.data.get('tenantId', null) == null) &&
              (resource == null || resource.data.get('tenantId', null) == null)
            )
          )
        )
      );
    }
`;

code = code.replace(targetSuperAdmin, replacementSuperAdmin);
code = code.replace(targetAdmin, replacementAdmin);

fs.writeFileSync('firestore.rules', code);
console.log("Replaced rules safely");
