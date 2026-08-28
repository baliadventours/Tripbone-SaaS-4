const fs = require('fs');
let code = fs.readFileSync('src/pages/SaaSHome.tsx', 'utf-8');

const regex = /<button\s*onClick=\{async \(\) => \{\s*try \{\s*await setDoc\(doc\(db, 'tenants'[^<]*\} catch \(err\) \{[^}]*\}\s*\}\}\s*className="[^"]*"\s*>\s*Simulate Email Click\s*<\/button>/m;
code = code.replace(regex, '');

fs.writeFileSync('src/pages/SaaSHome.tsx', code);
console.log('Removed Simulate Email Click button');
