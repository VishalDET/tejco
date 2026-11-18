import { checkPermission } from "../src/lib/rbac.ts";

const accountPerms = [
  'Dashboard.View',
  'SalesOrders.View',
  'Quotations.View',
  'ProformaInvoices.View',
  'Reports.View',
  'CreditNotes.View',
  'Inventory.Lots.View',
  'Accounts.Dashboard.View',
  'Returns.View'
];

const tests = [
  // VIEW permissions (should be TRUE)
  { perm: "Dashboard.View", expected: true },
  { perm: "SalesOrders.View", expected: true },
  { perm: "Quotations.View", expected: true },
  { perm: "ProformaInvoices.View", expected: true },
  { perm: "Reports.View", expected: true },
  { perm: "CreditNotes.View", expected: true },
  { perm: "Returns.View", expected: true },

  // CREATE / EDIT / DELETE / APPROVE permissions (MUST ALL BE FALSE)
  { perm: "SalesOrders.Create", expected: false },
  { perm: "SalesOrders.Edit", expected: false },
  { perm: "SalesOrders.Delete", expected: false },
  { perm: "SalesOrders.Approve", expected: false },
  { perm: "ProformaInvoices.Create", expected: false },
  { perm: "ProformaInvoices.Edit", expected: false },
  { perm: "ProformaInvoices.Delete", expected: false },
  { perm: "Quotations.Create", expected: false },
  { perm: "Quotations.Edit", expected: false },
  { perm: "CreditNotes.Create", expected: false },
  { perm: "CreditNotes.Edit", expected: false },
  { perm: "CreditNotes.Delete", expected: false },
  { perm: "Sales.Invoice.Generate", expected: false },
  { perm: "Sales.Commercial.Edit", expected: false },
  { perm: "Returns.Approve", expected: false },
  { perm: "Returns.Create", expected: false },
  { perm: "Returns.Edit", expected: false },
  { perm: "Users.Create", expected: false },
  { perm: "Users.Edit", expected: false }
];

let allPassed = true;
for (const t of tests) {
  const result = checkPermission(accountPerms, t.perm);
  const pass = result === t.expected;
  if (!pass) allPassed = false;
  console.log(`${pass ? "✓ PASS" : "✗ FAIL"}: checkPermission(${t.perm}) = ${result} (expected ${t.expected})`);
}

console.log("\nALL RBAC PERMISSION CHECKS PASSED:", allPassed);
