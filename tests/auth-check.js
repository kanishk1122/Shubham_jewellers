const fetch = require("node-fetch");
(async () => {
  const seed = await (
    await fetch("http://localhost:3000/api/auth/seed", { method: "POST" })
  ).json();
  const token =
    seed?.data?.token ||
    (
      await (
        await fetch("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: "admin@example.com",
            password: "Admin@123",
          }),
        })
      ).json()
    ).data?.token;
  console.log("token", !!token);
  let res = await fetch("http://localhost:3000/api/customers");
  console.log("/api/customers without token ->", res.status);
  res = await fetch("http://localhost:3000/api/customers", {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("/api/customers with token ->", res.status);
})();
