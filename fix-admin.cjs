const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

const target = `
      if (!postData.createdAt) {
        postData.createdAt = serverTimestamp();
      }

      try {
        if (editingPost.id) {
          await updateDoc(doc(db, 'posts', editingPost.id), postData);
        } else {
          await addDoc(collection(db, 'posts'), postData);
        }
`;

const replacement = `
      if (!postData.createdAt) {
        postData.createdAt = serverTimestamp();
      }

      const cleanPostData = Object.fromEntries(
        Object.entries(postData).filter(([_, v]) => v !== undefined)
      );

      try {
        if (editingPost.id) {
          await updateDoc(doc(db, 'posts', editingPost.id), cleanPostData);
        } else {
          await addDoc(collection(db, 'posts'), cleanPostData);
        }
`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/pages/Admin.tsx', code);
  console.log('Fixed handleSavePost');
} else {
  console.log('Target not found');
}
