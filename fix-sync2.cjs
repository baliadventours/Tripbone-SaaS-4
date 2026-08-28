const fs = require('fs');
let code = fs.readFileSync('src/pages/SaaSHome.tsx', 'utf-8');

const regex = /return invoices\.reverse\(\);\s*\}([\s\S]*?)return invoices\.reverse\(\);\s*\}/m;

// Let's first just check what's there
console.log(code.includes("return invoices.reverse();"));

