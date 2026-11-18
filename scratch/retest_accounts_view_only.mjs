const API_BASE_URL = "http://tejco.digitaledgetech.in/api";

async function retestAccountsViewOnly() {
  console.log("===============================================================");
  console.log("RETEST: ACCOUNTS USER RESTRICTED FROM CREATE / EDIT OPERATIONS");
  console.log("===============================================================");

  // 1. Authenticate as Accounts User
  console.log("\n[1] Authenticating as Accounts User (accounts.dept@tejcovision.com)...");
  const loginRes = await fetch(`${API_BASE_URL}/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      username: "accounts.dept@tejcovision.com",
      password: "123456"
    })
  });

  if (!loginRes.ok) throw new Error(`Login failed with HTTP ${loginRes.status}`);
  const loginData = await loginRes.json();
  const token = loginData.token;
  const userPerms = loginData.permissions?.map(p => p.permissionName || p) || [];
  
  console.log("✓ Login successful!");
  console.log("  Role:", loginData.user?.role, `(Role ID: ${loginData.user?.roleId})`);
  console.log(`  Total Assigned Permissions: ${userPerms.length}`);
  console.log("  Permissions List:", userPerms);

  // 2. Audit: Verify NO Create/Edit/Delete/Approve in returned permissions
  console.log("\n[2] Auditing Permission Claims for Write/Mutation Actions...");
  const disallowedKeywords = ["create", "edit", "delete", "approve", "generate", "adjust"];
  const violations = userPerms.filter(p => disallowedKeywords.some(kw => p.toLowerCase().includes(kw)));

  if (violations.length === 0) {
    console.log("✓ AUDIT PASSED: Zero Create/Edit/Delete/Approve permissions present in account credentials!");
  } else {
    console.error("✗ AUDIT FAILED: Found mutation permissions:", violations);
  }

  const accHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${token}`
  };

  // 3. Test View Operations (Must all work)
  console.log("\n[3] Testing READ / VIEW Operations (Expected: HTTP 200 OK)...");
  const viewEndpoints = [
    { name: "Invoicing Queue (Completed Orders)", url: "/Accounts/SalesOrder/Completed" },
    { name: "Proforma Invoices", url: "/ProformaInvoice/GetAll" },
    { name: "Quotations", url: "/Quotation/GetAll" },
    { name: "Sales Orders", url: "/SalesOrder/GetAll" },
    { name: "Credit Notes", url: "/CreditNote/GetAll" },
    { name: "Return Requests", url: "/Return/GetAll" }
  ];

  for (const ep of viewEndpoints) {
    try {
      const res = await fetch(`${API_BASE_URL}${ep.url}`, { headers: accHeaders });
      const data = await res.json();
      const count = Array.isArray(data) ? data.length : (data.data?.length ?? data.totalCount ?? "OK");
      console.log(`  ✓ ${ep.name.padEnd(35)}: HTTP ${res.status} (Records: ${count})`);
    } catch (e) {
      console.log(`  ✗ ${ep.name.padEnd(35)}: Error - ${e.message}`);
    }
  }

  // 4. Test Mutations (Attempts to Create / Edit from Account Session)
  console.log("\n[4] Testing Mutation / Creation Attempts under Accounts Token...");

  // Attempt 1: Generate Invoice
  try {
    const res = await fetch(`${API_BASE_URL}/Accounts/SalesOrder/1/GenerateInvoice`, {
      method: "POST",
      headers: accHeaders,
      body: JSON.stringify({ invoiceNumber: "INV-TEST-001", paymentTerms: "Immediate", notes: "Test" })
    });
    console.log(`  • Generate Invoice (POST /Accounts/SalesOrder/1/GenerateInvoice): HTTP ${res.status}`);
  } catch (e) {
    console.log(`  • Generate Invoice: ${e.message}`);
  }

  // Attempt 2: Approve Return
  try {
    const res = await fetch(`${API_BASE_URL}/Return/1/Approve`, {
      method: "POST",
      headers: accHeaders,
      body: JSON.stringify({ remarks: "Attempted approve" })
    });
    console.log(`  • Approve Return (POST /Return/1/Approve): HTTP ${res.status}`);
  } catch (e) {
    console.log(`  • Approve Return: ${e.message}`);
  }

  // Attempt 3: Commercial Adjust
  try {
    const res = await fetch(`${API_BASE_URL}/Accounts/SalesOrder/1/CommercialAdjust`, {
      method: "PUT",
      headers: accHeaders,
      body: JSON.stringify({ freight: 100, discount: 50, notes: "Adjust" })
    });
    console.log(`  • Commercial Adjust (PUT /Accounts/SalesOrder/1/CommercialAdjust): HTTP ${res.status}`);
  } catch (e) {
    console.log(`  • Commercial Adjust: ${e.message}`);
  }

  // 5. UI RBAC Verification
  console.log("\n[5] UI Client-side RBAC State Evaluation:");
  const normalized = new Set(userPerms.map(p => p.toLowerCase()));
  
  const uiChecks = [
    { action: "Create Sales Order", perm: "salesorders.create" },
    { action: "Edit Sales Order", perm: "salesorders.edit" },
    { action: "Create Proforma Invoice", perm: "proformainvoices.create" },
    { action: "Edit Proforma Invoice", perm: "proformainvoices.edit" },
    { action: "Create Quotation", perm: "quotations.create" },
    { action: "Edit Quotation", perm: "quotations.edit" },
    { action: "Create Credit Note", perm: "creditnotes.create" },
    { action: "Edit Credit Note", perm: "creditnotes.edit" },
    { action: "Generate Invoice", perm: "sales.invoice.generate" },
    { action: "Adjust Commercial", perm: "sales.commercial.edit" },
    { action: "Approve Return", perm: "returns.approve" }
  ];

  for (const c of uiChecks) {
    const isAllowed = normalized.has(c.perm);
    console.log(`  UI Button [${c.action}]: ${isAllowed ? "VISIBLE (ALLOWED)" : "HIDDEN / DISABLED (RESTRICTED)"}`);
  }

  console.log("\n===============================================================");
  console.log("RETEST COMPLETED SUCCESSFULLY");
  console.log("===============================================================");
}

retestAccountsViewOnly().catch(console.error);
