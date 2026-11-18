const API_BASE_URL = "http://tejco.digitaledgetech.in/api";

async function getMasters() {
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

  const comps = await (await fetch(`${API_BASE_URL}/SystemMasters/companies`, { headers })).json();
  const branches = await (await fetch(`${API_BASE_URL}/SystemMasters/branches`, { headers })).json();
  const depts = await (await fetch(`${API_BASE_URL}/SystemMasters/departments`, { headers })).json();
  const roles = await (await fetch(`${API_BASE_URL}/Roles/GetAll`, { headers })).json();

  console.log("Companies:", comps);
  console.log("Branches:", branches);
  console.log("Departments:", depts);
  console.log("Roles:", roles);
}

getMasters().catch(console.error);
