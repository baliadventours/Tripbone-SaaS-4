const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

// 1. Fix ClientManager query
code = code.replace(
  /const q = query\(collection\(db, 'users'\), orderBy\('createdAt', 'desc'\)\);/,
  `const tenantId = getActiveTenantId();
      const q = tenantId 
        ? query(collection(db, 'users'), where('tenantId', '==', tenantId))
        : query(collection(db, 'users'));`
);

// 2. Sort users in memory in ClientManager
code = code.replace(
  /setUsers\(snapshot\.docs\.map\(doc => \(\{ uid: doc\.id, \.\.\.doc\.data\(\) \} as UserProfile\)\)\);/,
  `let list = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        list.sort((a: any, b: any) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        setUsers(list);`
);

// 3. Add tenantId to handleCreatePartner
code = code.replace(
  /uid: tempId,\s*photoURL: `https:\/\/ui-avatars\.com\/api\/\?name=\$\{encodeURIComponent\(newPartner\.displayName \|\| ''\)\}&background=random`,/,
  `uid: tempId,
          photoURL: \`https://ui-avatars.com/api/?name=\${encodeURIComponent(newPartner.displayName || '')}&background=random\`,
          tenantId: getActiveTenantId(),`
);

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log('Fixed ClientManager');
