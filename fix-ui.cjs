const fs = require('fs');
let code = fs.readFileSync('src/pages/SaaSHome.tsx', 'utf-8');

// Fix the plan names
code = code.replace(
  /name: monthlyPlan\.name\.replace\('Plan', 'Annual Plan'\)/g,
  "name: (monthlyPlan.name || '').replace(/Monthly|Plan/gi, '').trim() + ' Annual'"
);
code = code.replace(
  /name: monthlyPlan\.name\.replace\('Plan', 'Lifetime Plan'\)/g,
  "name: (monthlyPlan.name || '').replace(/Monthly|Plan/gi, '').trim() + ' Lifetime'"
);

fs.writeFileSync('src/pages/SaaSHome.tsx', code);
console.log('Fixed plan names');
