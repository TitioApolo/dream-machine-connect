// Test script to validate authentication flow
// Run with: node test-auth-flow.js

const API_BASE = "https://dreams-machine-7e6a3c0a6e6e.herokuapp.com";

// Test credentials (replace with actual credentials for testing)
const TEST_CREDENCIAIS = {
  cliente: { email: "client@example.com", senha: "password" },
  admin: { email: "admin@example.com", senha: "password" }
};

async function testLogin(tipo = "cliente") {
  console.log(`\n🔐 Testing ${tipo.toUpperCase()} login...`);
  
  const endpoint = tipo === "cliente" ? "/login-cliente" : "/login-pessoa";
  const url = `${API_BASE}${endpoint}`;
  const credentials = TEST_CREDENCIAIS[tipo];
  
  console.log(`📍 Endpoint: POST ${url}`);
  console.log(`📦 Body: { email: "${credentials.email}", senha: "***" }`);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    
    const data = await response.json();
    
    console.log(`\n📊 Response Status: ${response.status}`);
    console.log(`📋 Response Data:`, JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error(`❌ Login failed: ${data.error || data.message}`);
      return null;
    }
    
    // Check for required fields
    const { token, id, key } = data;
    console.log(`\n✅ Login successful!`);
    console.log(`  • Token: ${token ? `${token.slice(0, 24)}...` : "❌ MISSING"}`);
    console.log(`  • User ID: ${id || "❌ MISSING"}`);
    console.log(`  • User Type: ${key || "❌ MISSING"}`);
    
    return data;
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return null;
  }
}

async function testApiCall(token, userId) {
  console.log(`\n📡 Testing API call with authentication...`);
  
  const url = `${API_BASE}/estatisticas-gerais/${userId}`;
  console.log(`📍 Endpoint: GET ${url}`);
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    });
    
    console.log(`\n📊 Response Status: ${response.status}`);
    
    if (!response.ok) {
      const data = await response.json();
      console.error(`❌ API call failed: ${data.error || data.message}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ API call successful!`);
    console.log(`📊 Data received:`, JSON.stringify(data, null, 2).slice(0, 200) + "...");
    return true;
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Authentication Flow Test Suite");
  console.log("===================================");
  console.log(`\n⚠️  DISCLAIMER: Update TEST_CREDENCIAIS in script with actual valid credentials`);
  console.log(`📝 Current test credentials are placeholders and will fail unless you have actual creds.`);
  
  // Test client login
  const clientData = await testLogin("cliente");
  
  // Test admin login
  const adminData = await testLogin("pessoa");
  
  // Try API call if login succeeded
  if (clientData?.token && clientData?.id) {
    const success = await testApiCall(clientData.token, clientData.id);
    if (success) {
      console.log(`\n✅ Full authentication flow validated!`);
    } else {
      console.log(`\n❌ Authentication successful but API call failed (possible 401)`);
    }
  } else {
    console.log(`\n⛔ Login failed, skipping API test`);
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("📋 Test Summary:");
  console.log("=".repeat(50));
  console.log("✨ Test suite completed!");
  console.log("\n💡 Tips:");
  console.log("  1. Update TEST_CREDENCIAIS with real credentials");
  console.log("  2. Run: node test-auth-flow.js");
  console.log("  3. Check console logs for [AUTH] and [API] messages");
  console.log("  4. Verify localStorage after login via browser DevTools");
}

runTests().catch(console.error);
