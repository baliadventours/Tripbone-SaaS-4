const fs = require('fs');
let code = fs.readFileSync('src/pages/SaaSHome.tsx', 'utf-8');

// 1. Add invoices state
code = code.replace(
  /const \[closedAnnouncements, setClosedAnnouncements\] = useState<string\[\]>\(\[\]\);/,
  `const [closedAnnouncements, setClosedAnnouncements] = useState<string[]>([]);\n  const [invoices, setInvoices] = useState<any[]>([]);`
);

// 2. Fetch invoices in loadTenants
code = code.replace(
  /const plansSnapshot = await getDocs\(collection\(db, 'billingPlans'\)\);/,
  `const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
        const invList: any[] = [];
        invoicesSnapshot.forEach(snap => invList.push({ id: snap.id, ...snap.data() }));
        setInvoices(invList);
        
        const plansSnapshot = await getDocs(collection(db, 'billingPlans'));`
);

fs.writeFileSync('src/pages/SaaSHome.tsx', code);
console.log('Added invoices state');
