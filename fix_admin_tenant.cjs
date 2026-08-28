const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

code = code.replace(
  "    let unsubscribeUsers = () => {};\n    if (!isSupplier && !isAgent) {\n      const userQ = tenantId ",
  "    let unsubscribeUsers = () => {};\n    const tenantIdForUsers = getActiveTenantId();\n    if (!isSupplier && !isAgent) {\n      const userQ = tenantIdForUsers "
);

code = code.replace(
  "          ? query(collection(db, 'users'), where('tenantId', '==', tenantId))\n          : collection(db, 'users');",
  "          ? query(collection(db, 'users'), where('tenantId', '==', tenantIdForUsers))\n          : collection(db, 'users');"
);

fs.writeFileSync('src/pages/Admin.tsx', code);
