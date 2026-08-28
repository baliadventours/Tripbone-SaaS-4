const fs = require('fs');
let code = fs.readFileSync('src/pages/SaaSHome.tsx', 'utf-8');

const startIndex = code.indexOf('const getDynamicInvoices = useMemo(() => {');
const endIndex = code.indexOf('}, [activeWorkspace]);', startIndex) + '}, [activeWorkspace]);'.length;

const newCode = `const getDynamicInvoices = useMemo(() => {
    if (!activeWorkspace) return [];
    
    let createdAtStr = activeWorkspace.createdAt;
    if (!createdAtStr) {
      const fallbackDate = new Date();
      fallbackDate.setMonth(fallbackDate.getMonth() - 2);
      createdAtStr = fallbackDate.toISOString();
    }
    
    const createdDate = new Date(createdAtStr);
    if (isNaN(createdDate.getTime())) {
      const fallbackDate = new Date();
      fallbackDate.setMonth(fallbackDate.getMonth() - 2);
      createdDate.setTime(fallbackDate.getTime());
    }
    
    const planSlug = activeWorkspace.plan || 'starter';
    const billingInterval = activeWorkspace.billingInterval || 'monthly';
    
    const matchedPlan = plans.find(p => 
      p.slug?.toLowerCase() === planSlug.toLowerCase() && 
      (p.interval || 'monthly') === billingInterval
    ) || plans.find(p => p.slug?.toLowerCase() === planSlug.toLowerCase());
    
    let defaultPrice = 49;
    if (planSlug === 'business') {
      defaultPrice = billingInterval === 'lifetime' ? 999 : billingInterval === 'annual' ? 1990 : 199;
    } else if (planSlug === 'professional') {
      defaultPrice = billingInterval === 'lifetime' ? 499 : billingInterval === 'annual' ? 990 : 99;
    } else if (planSlug === 'enterprise') {
      defaultPrice = billingInterval === 'lifetime' ? 2499 : billingInterval === 'annual' ? 4990 : 499;
    } else { // starter
      defaultPrice = billingInterval === 'lifetime' ? 249 : billingInterval === 'annual' ? 490 : 49;
    }
    const price = matchedPlan 
      ? (matchedPlan.price !== undefined ? matchedPlan.price : defaultPrice)
      : defaultPrice;
      
    const amountStr = \`$\${price}.00\`;
    const genInvoices = [];
    const now = new Date();
    
    const isTrial = activeWorkspace.status === 'trial' || activeWorkspace.trialEnds;
    const trialEndsDate = activeWorkspace.trialEnds ? new Date(activeWorkspace.trialEnds) : new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    if (isTrial) {
      // 1. Trial Activation Invoice (0 payment)
      genInvoices.push({
        no: "T-101",
        invoiceDate: createdDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        dueDate: createdDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        rawInvoiceDate: createdDate,
        rawDueDate: createdDate,
        amount: "$0.00",
        status: "PAID"
      });
      
      // 2. Subscription Invoice based on package chosen (UNPAID)
      genInvoices.push({
        no: "INV-121",
        invoiceDate: createdDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        dueDate: trialEndsDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        rawInvoiceDate: createdDate,
        rawDueDate: trialEndsDate,
        amount: amountStr,
        status: "UNPAID"
      });
    } else {
      let currentInvoiceDate = new Date(createdDate);
      let invoiceIndex = 121;
      let safetyCounter = 0;

      while (currentInvoiceDate <= now && safetyCounter < 100) {
        let dueDate = new Date(currentInvoiceDate);
        dueDate.setDate(dueDate.getDate() + 7); // Due 7 days after invoice
        
        let status = 'PAID';
        
        // If this is the most recent invoice and it's past due and workspace is not active
        if (currentInvoiceDate.getMonth() === now.getMonth() && currentInvoiceDate.getFullYear() === now.getFullYear()) {
           if (activeWorkspace.status !== 'active') {
             status = 'UNPAID';
           }
        }

        genInvoices.push({
          no: \`INV-\${invoiceIndex}\`,
          invoiceDate: currentInvoiceDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
          dueDate: dueDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
          rawInvoiceDate: new Date(currentInvoiceDate),
          rawDueDate: new Date(dueDate),
          amount: amountStr,
          status: status
        });
        
        if (billingInterval === 'annual') {
          currentInvoiceDate.setFullYear(currentInvoiceDate.getFullYear() + 1);
        } else if (billingInterval === 'lifetime') {
          break;
        } else {
          currentInvoiceDate.setMonth(currentInvoiceDate.getMonth() + 1);
        }
        invoiceIndex++;
        safetyCounter++;
      }
    }
    
    const dbInvoices = invoices.filter(inv => inv.tenantId === activeWorkspace.id);
    const merged = genInvoices.map(genInv => {
       const found = dbInvoices.find(dbInv => dbInv.no === genInv.no);
       return found || genInv;
    });
    
    dbInvoices.forEach(dbInv => {
       if (!merged.find(m => m.no === dbInv.no)) {
           merged.push(dbInv);
       }
    });
    
    return merged.sort((a,b) => new Date(b.rawInvoiceDate || b.createdAt || b.invoiceDate).getTime() - new Date(a.rawInvoiceDate || a.createdAt || a.invoiceDate).getTime());
  }, [activeWorkspace, plans, invoices]);`

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newCode + code.substring(endIndex);
  fs.writeFileSync('src/pages/SaaSHome.tsx', code);
  console.log('Replaced getDynamicInvoices successfully.');
} else {
  console.log('Could not find getDynamicInvoices');
}
