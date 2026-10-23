async function test() {
  const url = "http://tejco.digitaledgetech.in/api/api/Inventory/GenerateLotNumber";
  const body = {
    vendorId: 26,
    vendorPrefix: "SBC",
    invoiceNumber: "BILL-55",
    productId: 140,
    variantId: 348,
    date: new Date().toISOString(),
    sequence: 1
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Result:", JSON.stringify(data, null, 2));
}

test().catch(console.error);
