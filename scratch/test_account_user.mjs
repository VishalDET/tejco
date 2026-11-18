const API_BASE_URL = "http://tejco.digitaledgetech.in/api";

async function testApi() {
  console.log("=== 1. Logging in as Super Admin ===");
  const loginRes = await fetch(`${API_BASE_URL}/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      username: "prathamesh.work.det@gmail.com",
      password: "123456"
    })
  });
  
  console.log("Login HTTP Status:", loginRes.status);
  const loginData = await loginRes.json();
  console.log("Login Response:", JSON.stringify(loginData, null, 2));

  const token = loginData.token || loginData.data?.token || loginData.accessToken;
  if (!token) {
    console.error("No token received!");
    return;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${token}`
  };

  console.log("\n=== 2. Fetching Roles ===");
  try {
    const rolesRes = await fetch(`${API_BASE_URL}/Roles/GetAll`, { headers: authHeaders });
    const rolesData = await rolesRes.json();
    console.log("Roles count:", Array.isArray(rolesData) ? rolesData.length : "Not array", rolesData);
  } catch (e) {
    console.error("Roles fetch error:", e.message);
  }

  console.log("\n=== 3. Fetching Departments ===");
  try {
    const deptsRes = await fetch(`${API_BASE_URL}/SystemMasters/departments`, { headers: authHeaders });
    const deptsData = await deptsRes.json();
    console.log("Departments count:", Array.isArray(deptsData) ? deptsData.length : "Not array", deptsData);
  } catch (e) {
    console.error("Depts fetch error:", e.message);
  }

  console.log("\n=== 4. Fetching Existing Users ===");
  try {
    const usersRes = await fetch(`${API_BASE_URL}/User/GetAll`, { headers: authHeaders });
    const usersData = await usersRes.json();
    console.log("Existing users count:", Array.isArray(usersData) ? usersData.length : "Not array");
    if (Array.isArray(usersData)) {
      console.log("Sample users:", usersData.slice(0, 5).map(u => ({ id: u.userId, email: u.email, role: u.role, roleId: u.roleId })));
    }
  } catch (e) {
    console.error("Users fetch error:", e.message);
  }
}

testApi().catch(console.error);
