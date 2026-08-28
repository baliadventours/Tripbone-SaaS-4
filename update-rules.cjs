const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf-8');

rules = rules.replace(
  /match \/posts\/\{postId\} \{\s*allow get: if \(resource\.data\.status in \['published', 'active'\]\) \|\| isSignedIn\(\);\s*allow list: if isSignedIn\(\);\s*allow write: if isAdmin\(\);\s*\}/,
  `match /posts/{postId} {
      allow get: if true;
      allow list: if true;
      allow write: if isAdmin() || (isSignedIn() && incoming().tenantId != null) || (isSignedIn() && resource.data.tenantId != null);
      allow delete: if isAdmin() || (isSignedIn() && resource.data.tenantId != null);
    }`
);

fs.writeFileSync('firestore.rules', rules);
console.log('Updated firestore.rules for posts');
