import { serverTimestamp } from 'firebase/firestore';

const fv = serverTimestamp();
console.log("fv:", fv);
console.log("fv is object:", typeof fv === 'object');
console.log("fv has toDate:", !!(fv as any).toDate);
console.log("fv constructor:", fv.constructor.name);

const cloned = { ...fv };
console.log("cloned:", cloned);
