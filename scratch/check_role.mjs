const API_BASE_URL = "http://tejco.digitaledgetech.in/api";

async function inspectRoleAndUsers() {
  const loginRes = await fetch(`${API_BASE_URL}/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      username: "prathamesh.work.det@gmail.com",
      password: "123456"
    })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const authHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${token}`
  };

  console.log("=== Checking permissions for Role 5 (Account Team) ===");
  // Test various possible endpoints for role permissions
  const endpoints = [
    "/Roles/5/permissions",
    "/Roles/GetPermissions/5",
    "/Roles/GetRolePermissions/5",
    "/Roles/GetById/5"
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${API_BASE_URL}${ep}`, { headers: authHeaders });
      console.log(`Endpoint ${ep} status:`, res.status);
      if (res.ok) {
        const data = await res.json();
        console.log(`Data from ${ep}:`, JSON.stringify(data, null, 2));
      }
    } catch (e) {
      console.log(`Endpoint ${ep} error:`, e.message);
    }
  }

  console.log("=== Checking all existing users ===");
  const usersRes = await fetch(`${API_BASE_URL}/User/GetAll`, { headers: authHeaders });
  const users = await usersRes.json();
  console.log("Users:", users.map(u => ({
    id: u.userId,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    roleId: u.roleId,
    role: u.role,
    departmentId: u.departmentId
  })));
}

inspectRoleAndUsers().catch(console.error);
