const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf-8');

code = code.replace(
  `getUserData().role == 'admin'`,
  `getUserData().get('role', '') == 'admin'`
);

code = code.replace(
  `getUserData().role == 'supplier'`,
  `getUserData().get('role', '') == 'supplier'`
);

code = code.replace(
  `getUserData().role == 'agent'`,
  `getUserData().get('role', '') == 'agent'`
);

fs.writeFileSync('firestore.rules', code);
console.log("Fixed role access in rules");
