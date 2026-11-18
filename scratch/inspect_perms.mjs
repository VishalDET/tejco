const API_BASE_URL = "http://tejco.digitaledgetech.in/api";

async function inspectAllPerms() {
  const loginRes = await fetch(`${API_BASE_URL}/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      username: "prathamesh.work.det@gmail.com",
      password: "123456"
    })
  });
  const { token } = await loginRes.json();
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${token}`
  };

  const permsRes = await fetch(`${API_BASE_URL}/Roles/Permissions`, { headers });
  console.log("All permissions endpoint status:", permsRes.status);
  const perms = await permsRes.json();
  const list = Array.isArray(perms) ? perms : (perms.data || []);
  console.log("Total system permissions count:", list.length);

  const role5Res = await fetch(`${API_BASE_URL}/Roles/5/permissions`, { headers });
  const role5Perms = (await role5Res.json()).data || [];
  console.log("Role 5 current permissions count:", role5Perms.length);
  console.log("Role 5 current permissions:", role5Perms.map(p => ({ id: p.permissionId, name: p.permissionName })));
}

inspectAllPerms().catch(console.error);
