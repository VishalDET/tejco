const API_BASE_URL = "http://tejco.digitaledgetech.in/api";

async function updateRolePermissions() {
  console.log("=== 1. Login as Super Admin ===");
  const loginRes = await fetch(`${API_BASE_URL}/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      username: "prathamesh.work.det@gmail.com",
      password: "123456"
    })
  });
  const { token } = await loginRes.json();
  const adminHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${token}`
  };

  const viewOnlyPermissionIds = [1, 31, 36, 41, 68, 74, 82, 83, 86];
  console.log("Assigning view-only permission IDs to Role 5:", viewOnlyPermissionIds);

  const assignRes = await fetch(`${API_BASE_URL}/Roles/5/AssignPermissions`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify(viewOnlyPermissionIds)
  });

  console.log("Assign response status:", assignRes.status);
  const assignData = await assignRes.text();
  console.log("Assign response body:", assignData);

  console.log("\n=== 2. Verify Role 5 Permissions ===");
  const verifyRes = await fetch(`${API_BASE_URL}/Roles/5/permissions`, { headers: adminHeaders });
  const verifyData = await verifyRes.json();
  console.log("New Role 5 permissions:", verifyData);

  console.log("\n=== 3. Login as Accounts User and verify returned permissions ===");
  const accLoginRes = await fetch(`${API_BASE_URL}/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      username: "accounts.dept@tejcovision.com",
      password: "123456"
    })
  });
  const accData = await accLoginRes.json();
  console.log("Accounts Login Status:", accLoginRes.status);
  console.log("Accounts User Permissions in token/response:", accData.permissions?.map(p => p.permissionName || p));
}

updateRolePermissions().catch(console.error);
