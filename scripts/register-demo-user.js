async function registerUser() {
  console.log("Registering demo user via HTTP API...");
  try {
    const res = await fetch("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000",
      },
      body: JSON.stringify({
        email: "seller@vaultly.io",
        password: "Password123!",
        name: "Demo Seller",
      }),
    });

    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

registerUser();
