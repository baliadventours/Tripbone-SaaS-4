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

const postData = {
  title: "Test",
  seo: { title: "seo test", description: undefined },
  tags: ["a", undefined, "b"],
  createdAt: { _methodName: "serverTimestamp" }
};

console.log(cleanUndefined(postData));
