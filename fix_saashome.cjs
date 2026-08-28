const fs = require('fs');
let code = fs.readFileSync('src/pages/SaaSHome.tsx', 'utf8');

code = code.replace(
  "  const [tenantActiveMenu, setTenantActiveMenu] = useState<string | null>('dashboard');",
  `  const [tenantActiveMenu, setTenantActiveMenu] = useState<string | null>('dashboard');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [operatorNameInput, setOperatorNameInput] = useState('');
  const [operatorPhoneInput, setOperatorPhoneInput] = useState('');
  const [operatorAddressInput, setOperatorAddressInput] = useState('');`
);

fs.writeFileSync('src/pages/SaaSHome.tsx', code);
