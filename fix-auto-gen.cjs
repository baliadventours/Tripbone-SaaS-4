const fs = require('fs');
let code = fs.readFileSync('src/pages/SaaSHome.tsx', 'utf-8');

// Remove the auto-generation block
const startIndex = code.indexOf('// Ensure we have annual and lifetime variants');
const endIndex = code.indexOf('setPlans(plansList);');

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + code.substring(endIndex);
  fs.writeFileSync('src/pages/SaaSHome.tsx', code);
  console.log('Removed auto-generation block from SaaSHome.tsx');
} else {
  console.log('Could not find auto-generation block in SaaSHome.tsx');
}
