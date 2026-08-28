const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

code = code.replace(
  /unsubscribeUsers = onSnapshot\(collection\(db, 'users'\), \(snapshot\) => \{/,
  `const userQ = tenantId 
          ? query(collection(db, 'users'), where('tenantId', '==', tenantId))
          : collection(db, 'users');
      unsubscribeUsers = onSnapshot(userQ, (snapshot) => {`
);

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log('Fixed Admin main users query');
