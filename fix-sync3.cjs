const fs = require('fs');
let code = fs.readFileSync('src/pages/SaaSHome.tsx', 'utf-8');

const replacement = `
    const dbInvoices = invoices.filter(inv => inv.tenantId === activeWorkspace.id);
    const generatedInvoices = invoicesList; // we'll rename local 'invoices' to 'invoicesList'
    
    const merged = generatedInvoices.map(genInv => {
       const found = dbInvoices.find(dbInv => dbInv.no === genInv.no);
       return found || genInv;
    });
    
    dbInvoices.forEach(dbInv => {
       if (!merged.find(m => m.no === dbInv.no)) {
           merged.push(dbInv);
       }
    });
    
    return merged.sort((a,b) => new Date(b.rawInvoiceDate || b.createdAt || b.invoiceDate).getTime() - new Date(a.rawInvoiceDate || a.createdAt || a.invoiceDate).getTime());
  }, [activeWorkspace, plans, invoices]);
`;

code = code.replace(/return invoices\.reverse\(\);\s*\}(?![\s\S]*return invoices\.reverse\(\);\s*\})/, "return invoices.reverse();\n    } // End of if (isTrial)");

// I will just use sed to do the replacement manually instead of regex.
