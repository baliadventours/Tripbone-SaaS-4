const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

const target = `
      const cleanUndefined = (obj) => {
        const cleaned = { ...obj };
        Object.keys(cleaned).forEach(key => {
          if (cleaned[key] === undefined) {
            delete cleaned[key];
          } else if (typeof cleaned[key] === 'object' && cleaned[key] !== null && !cleaned[key].toDate) {
             // Basic check for nested objects, skip arrays or Firebase timestamps for safety
             if (!Array.isArray(cleaned[key])) {
               cleaned[key] = cleanUndefined(cleaned[key]);
             }
          }
        });
        return cleaned;
      };
      const cleanPostData = cleanUndefined(postData);

      try {
        if (editingPost.id) {
          await updateDoc(doc(db, 'posts', editingPost.id), cleanPostData);
        } else {
          await addDoc(collection(db, 'posts'), cleanPostData);
        }
`;

const replacement = `
      try {
        if (editingPost.id) {
          await updateDoc(doc(db, 'posts', editingPost.id), postData);
        } else {
          await addDoc(collection(db, 'posts'), postData);
        }
`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/pages/Admin.tsx', code);
  console.log('Reverted cleanUndefined');
} else {
  console.log('Target not found');
}
