const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

const target = `
      try {
        if (editingPost.id) {
          await updateDoc(doc(db, 'posts', editingPost.id), postData);
        } else {
          await addDoc(collection(db, 'posts'), postData);
        }
        setIsModalOpen(false);
        setEditingPost(null);
      } catch (err) {
        console.error("Error saving post:", err);
      }
`;

const replacement = `
      const cleanUndefined = (obj) => {
        if (obj === undefined) return null;
        if (typeof obj !== 'object' || obj === null) return obj;
        if (obj.toDate || obj._methodName) return obj; // Firebase timestamp or FieldValue
        if (Array.isArray(obj)) return obj.map(cleanUndefined).filter(v => v !== null);
        const result = {};
        for (const [k, v] of Object.entries(obj)) {
          if (v !== undefined) {
            result[k] = cleanUndefined(v);
          }
        }
        return result;
      };
      const cleanPostData = cleanUndefined(postData);

      try {
        if (editingPost.id) {
          await updateDoc(doc(db, 'posts', editingPost.id), cleanPostData);
        } else {
          await addDoc(collection(db, 'posts'), cleanPostData);
        }
        setIsModalOpen(false);
        setEditingPost(null);
        alert("Success: Blog post saved!");
      } catch (err) {
        console.error("Error saving post:", err);
        alert("Failed to save post: " + err.message);
      }
`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/pages/Admin.tsx', code);
  console.log('Fixed handleSavePost with cleanUndefined and alerts');
} else {
  console.log('Target not found');
}
