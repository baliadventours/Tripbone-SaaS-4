const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf-8');

const targetPosts = `
    match /posts/{postId} {
      allow get: if (resource.data.status in ['published', 'active']) || isAdmin();
      allow list: if isAdmin() || (resource.data.status in ['published', 'active']);
      allow write: if isAdmin();
    }
`;

const replacementPosts = `
    match /posts/{postId} {
      allow get: if (resource.data.status in ['published', 'active']) || isSignedIn();
      allow list: if isSignedIn();
      allow write: if isAdmin();
    }
`;

code = code.replace(targetPosts, replacementPosts);
fs.writeFileSync('firestore.rules', code);
console.log("Replaced posts rules safely");
