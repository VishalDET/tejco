import fs from 'fs';

const API_BASE_URL = "http://tejco.digitaledgetech.in/api";

const results = {
  superAdminLogin: false,
  userCreation: null,
  accountsLogin: false,
  permissionsResolved: [],
  operations: {},
  rbacRestrictions: {},
  summary: ""
};

async function run() {
  console.log("=================================================");
  console.log("TEJCO ERP: ACCOUNTS DEPARTMENT TESTING SUITE");
  console.log("=================================================");

  // 1. Super Admin Login
  console.log("\n[STEP 1] Logging in as Super Admin...");
  const adminRes = await fetch(`${API_BASE_URL}/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      username: "prathamesh.work.det@gmail.com",
      password: "123456"
    })
  });

  if (!adminRes.ok) {
    throw new Error(`Super admin login failed with status ${adminRes.status}`);
  }
  const adminData = await adminRes.json();
  const adminToken = adminData.token;
  results.superAdminLogin = true;
  console.log("✓ Super Admin Login Successful!");
  console.log(`  User: ${adminData.user.username} | Role: ${adminData.user.role}`);

  const adminHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${adminToken}`
  };

  // 2. Check if Accounts User already exists or create new
  console.log("\n[STEP 2] Checking / Creating Accounts Department User...");
  const targetEmail = "accounts.dept@tejcovision.com";
  let accountUser = null;

  try {
    const checkRes = await fetch(`${API_BASE_URL}/User/GetByEmail/${targetEmail}`, { headers: adminHeaders });
    if (checkRes.ok) {
      const data = await checkRes.json();
      accountUser = data.data || data;
      console.log(`✓ User ${targetEmail} already exists (UserId: ${accountUser.userId || accountUser.id}).`);
      results.userCreation = { status: "exists", userId: accountUser.userId || accountUser.id, email: targetEmail };
    }
  } catch (e) {
    console.log("User does not exist yet.");
  }

  if (!accountUser) {
    console.log(`Creating user: ${targetEmail}...`);
    const now = new Date().toISOString();
    const createPayload = {
      userId: 0,
      firstName: "Accounts",
      lastName: "Manager",
      gender: "Female",
      employeeId: "ACC007",
      email: targetEmail,
      phone: "9137642831",
      companyId: 1, // Tejco Vision
      branchId: 3,  // Amore Office, Khar
      departmentId: 2, // Accounts Department
      roleId: 5,       // Account Team
      role: "Account Team",
      handlerId: 0,
      status: "Active",
      lastLogin: now,
      imageUrl: "",
      passwordHash: "123456",
      createdAt: now,
      updatedAt: now
    };

    const createRes = await fetch(`${API_BASE_URL}/User/Create`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(createPayload)
    });

    console.log("User create status:", createRes.status);
    const createText = await createRes.text();
    let createData;
    try { createData = JSON.parse(createText); } catch { createData = createText; }
    console.log("User create response:", createData);

    results.userCreation = {
      status: createRes.ok ? "created" : "failed",
      statusCode: createRes.status,
      response: createData,
      email: targetEmail
    };
  }

  // 3. Log in as Accounts Department User
  console.log("\n[STEP 3] Authenticating as Accounts Department User...");
  const accLoginRes = await fetch(`${API_BASE_URL}/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      username: targetEmail,
      password: "123456"
    })
  });

  console.log("Accounts Login Status:", accLoginRes.status);
  const accLoginData = await accLoginRes.json();
  console.log("Accounts Login Response:", JSON.stringify(accLoginData, null, 2));

  if (!accLoginRes.ok || !accLoginData.token) {
    throw new Error(`Accounts user login failed! Status: ${accLoginRes.status}, Response: ${JSON.stringify(accLoginData)}`);
  }

  results.accountsLogin = true;
  const accToken = accLoginData.token;
  const accHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${accToken}`
  };

  console.log("✓ Accounts Department Login Succeeded!");

  // 4. Resolve Permissions
  console.log("\n[STEP 4] Fetching Role Permissions for RoleId:", accLoginData.user?.roleId || 5);
  const permRes = await fetch(`${API_BASE_URL}/Roles/5/permissions`, { headers: accHeaders });
  if (permRes.ok) {
    const permData = await permRes.json();
    const rawPerms = Array.isArray(permData) ? permData : (permData.data || []);
    results.permissionsResolved = rawPerms.map(p => p.permissionName);
    console.log(`✓ Resolved ${results.permissionsResolved.length} permissions:`);
    console.log(" ", results.permissionsResolved.join(", "));
  }

  // 5. Check Operations under Accounts Department Login
  console.log("\n[STEP 5] Testing Operations under Accounts Department Login...");

  // Operation A: Accounts Completed Orders (Invoicing Queue)
  try {
    const res = await fetch(`${API_BASE_URL}/Accounts/SalesOrder/Completed`, { headers: accHeaders });
    const data = await res.json();
    results.operations.completedOrdersQueue = {
      status: res.status,
      success: res.ok,
      recordCount: Array.isArray(data) ? data.length : (data.data?.length ?? data.totalCount ?? 0)
    };
    console.log(`  ✓ /Accounts/SalesOrder/Completed: HTTP ${res.status} (Records: ${results.operations.completedOrdersQueue.recordCount})`);
  } catch (e) {
    results.operations.completedOrdersQueue = { error: e.message };
    console.log(`  ✗ /Accounts/SalesOrder/Completed failed:`, e.message);
  }

  // Operation B: Proforma Invoices
  try {
    const res = await fetch(`${API_BASE_URL}/ProformaInvoice/GetAll`, { headers: accHeaders });
    const data = await res.json();
    results.operations.proformaInvoices = {
      status: res.status,
      success: res.ok,
      recordCount: Array.isArray(data) ? data.length : (data.data?.length ?? data.totalCount ?? 0)
    };
    console.log(`  ✓ /ProformaInvoice/GetAll: HTTP ${res.status} (Records: ${results.operations.proformaInvoices.recordCount})`);
  } catch (e) {
    results.operations.proformaInvoices = { error: e.message };
    console.log(`  ✗ /ProformaInvoice/GetAll failed:`, e.message);
  }

  // Operation C: Quotations
  try {
    const res = await fetch(`${API_BASE_URL}/Quotation/GetAll`, { headers: accHeaders });
    const data = await res.json();
    results.operations.quotations = {
      status: res.status,
      success: res.ok,
      recordCount: Array.isArray(data) ? data.length : (data.data?.length ?? data.totalCount ?? 0)
    };
    console.log(`  ✓ /Quotation/GetAll: HTTP ${res.status} (Records: ${results.operations.quotations.recordCount})`);
  } catch (e) {
    results.operations.quotations = { error: e.message };
    console.log(`  ✗ /Quotation/GetAll failed:`, e.message);
  }

  // Operation D: Sales Orders
  try {
    const res = await fetch(`${API_BASE_URL}/SalesOrder/GetAll`, { headers: accHeaders });
    const data = await res.json();
    results.operations.salesOrders = {
      status: res.status,
      success: res.ok,
      recordCount: Array.isArray(data) ? data.length : (data.data?.length ?? data.totalCount ?? 0)
    };
    console.log(`  ✓ /SalesOrder/GetAll: HTTP ${res.status} (Records: ${results.operations.salesOrders.recordCount})`);
  } catch (e) {
    results.operations.salesOrders = { error: e.message };
    console.log(`  ✗ /SalesOrder/GetAll failed:`, e.message);
  }

  // Operation E: Credit Notes
  try {
    const res = await fetch(`${API_BASE_URL}/CreditNote/GetAll`, { headers: accHeaders });
    const data = await res.json();
    results.operations.creditNotes = {
      status: res.status,
      success: res.ok,
      recordCount: Array.isArray(data) ? data.length : (data.data?.length ?? data.totalCount ?? 0)
    };
    console.log(`  ✓ /CreditNote/GetAll: HTTP ${res.status} (Records: ${results.operations.creditNotes.recordCount})`);
  } catch (e) {
    results.operations.creditNotes = { error: e.message };
    console.log(`  ✗ /CreditNote/GetAll failed:`, e.message);
  }

  // Operation F: Return Requests
  try {
    const res = await fetch(`${API_BASE_URL}/Return/GetAll`, { headers: accHeaders });
    const data = await res.json();
    results.operations.returnRequests = {
      status: res.status,
      success: res.ok,
      recordCount: Array.isArray(data) ? data.length : (data.data?.length ?? data.totalCount ?? 0)
    };
    console.log(`  ✓ /Return/GetAll: HTTP ${res.status} (Records: ${results.operations.returnRequests.recordCount})`);
  } catch (e) {
    results.operations.returnRequests = { error: e.message };
    console.log(`  ✗ /Return/GetAll failed:`, e.message);
  }

  // 6. Test RBAC Restrictions (Forbidden Modules)
  console.log("\n[STEP 6] Testing Security & RBAC Restrictions under Accounts User...");

  // Check 1: User Management (Should be restricted or require Users.View)
  try {
    const res = await fetch(`${API_BASE_URL}/User/GetAll`, { headers: accHeaders });
    results.rbacRestrictions.userManagement = {
      status: res.status,
      blockedOrAllowed: res.status === 403 || res.status === 401 ? "BLOCKED (Expected)" : `HTTP ${res.status}`
    };
    console.log(`  • /User/GetAll: HTTP ${res.status} -> ${results.rbacRestrictions.userManagement.blockedOrAllowed}`);
  } catch (e) {
    results.rbacRestrictions.userManagement = { error: e.message };
  }

  // Check 2: System Roles Management
  try {
    const res = await fetch(`${API_BASE_URL}/Roles/GetAll`, { headers: accHeaders });
    results.rbacRestrictions.rolesManagement = {
      status: res.status,
      blockedOrAllowed: res.status === 403 || res.status === 401 ? "BLOCKED (Expected)" : `HTTP ${res.status}`
    };
    console.log(`  • /Roles/GetAll: HTTP ${res.status} -> ${results.rbacRestrictions.rolesManagement.blockedOrAllowed}`);
  } catch (e) {
    results.rbacRestrictions.rolesManagement = { error: e.message };
  }

  // Check 3: Warehouses
  try {
    const res = await fetch(`${API_BASE_URL}/Warehouses/GetAll`, { headers: accHeaders });
    results.rbacRestrictions.warehouses = {
      status: res.status,
      blockedOrAllowed: res.status === 403 || res.status === 401 ? "BLOCKED (Expected)" : `HTTP ${res.status}`
    };
    console.log(`  • /Warehouses/GetAll: HTTP ${res.status} -> ${results.rbacRestrictions.warehouses.blockedOrAllowed}`);
  } catch (e) {
    results.rbacRestrictions.warehouses = { error: e.message };
  }

  fs.writeFileSync("scratch/test_summary.json", JSON.stringify(results, null, 2));
  console.log("\n✓ Full test report written to scratch/test_summary.json");
}

run().catch((err) => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
