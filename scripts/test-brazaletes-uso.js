const axios = require("axios");

// Configuración
const BASE_URL = "http://localhost:3001/api";
const PRESTADOR_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzNTJiMTIzLWFkNmQtNGM4OS1hNmQ1LWRlNTMyMjBmMTIzMyIsImVtYWlsIjoianVhbi5wZXJlekBlamVtcGxvLmNvbSIsInJvbCI6InByZXN0YWRvciIsIm5vbWJyZSI6Ikp1YW4gUMOpcmV6IiwiaWF0IjoxNzU5NDY4OTc1LCJleHAiOjE3NTk1NTUzNzV9.uI3T68IdSKfPlQskMPVLD9StZVanZrKtuid1RjAzf6A";

// Data de prueba con la estructura que mencionaste
const testData = {
  salida_id: "cb6afa92-e6bc-451c-9460-e497eda1cc1b",
  fecha_uso: "2025-10-07",
  brazaletes: [
    {
      codigo: "BRZ-2025-000037",
      turista_nacionalidad: "nacional",
      turista_edad: 30,
    },
    {
      codigo: "BRZ-2025-000036",
      turista_nacionalidad: "nacional",
      turista_edad: 30,
    },
    {
      codigo: "BRZ-2025-000035",
      turista_nacionalidad: "nacional",
      turista_edad: 30,
    },
  ],
};

// Data de prueba con la estructura correcta (fecha_uso dentro de cada brazalete)
const testDataCorrecta = {
  salida_id: "cb6afa92-e6bc-451c-9460-e497eda1cc1b",
  brazaletes: [
    {
      codigo: "BRZ-2025-000037",
      turista_nacionalidad: "nacional",
      turista_edad: 30,
      fecha_uso: "2025-10-07",
    },
    {
      codigo: "BRZ-2025-000036",
      turista_nacionalidad: "nacional",
      turista_edad: 30,
      fecha_uso: "2025-10-07",
    },
    {
      codigo: "BRZ-2025-000035",
      turista_nacionalidad: "nacional",
      turista_edad: 30,
      fecha_uso: "2025-10-07",
    },
  ],
};

async function testBrazaletesUso() {
  console.log("🧪 Probando endpoint de uso de brazaletes...\n");

  try {
    // Test 1: Con la estructura actual (fecha_uso en nivel raíz)
    console.log("📋 Test 1: Estructura actual (fecha_uso en nivel raíz)");
    console.log("📤 Enviando data:", JSON.stringify(testData, null, 2));

    const response1 = await axios.post(`${BASE_URL}/brazaletes/uso`, testData, {
      headers: {
        Authorization: `Bearer ${PRESTADOR_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Respuesta exitosa:", response1.data);
  } catch (error1) {
    console.log("❌ Error en Test 1:");
    if (error1.response) {
      console.log("📊 Status:", error1.response.status);
      console.log(
        "📝 Response data:",
        JSON.stringify(error1.response.data, null, 2)
      );
    } else {
      console.log("💥 Error de conexión:", error1.message);
    }
  }

  console.log("\n" + "=".repeat(80) + "\n");

  try {
    // Test 2: Con la estructura correcta (fecha_uso dentro de cada brazalete)
    console.log(
      "📋 Test 2: Estructura correcta (fecha_uso dentro de cada brazalete)"
    );
    console.log("📤 Enviando data:", JSON.stringify(testDataCorrecta, null, 2));

    const response2 = await axios.post(
      `${BASE_URL}/brazaletes/uso`,
      testDataCorrecta,
      {
        headers: {
          Authorization: `Bearer ${PRESTADOR_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Respuesta exitosa:", response2.data);
  } catch (error2) {
    console.log("❌ Error en Test 2:");
    if (error2.response) {
      console.log("📊 Status:", error2.response.status);
      console.log(
        "📝 Response data:",
        JSON.stringify(error2.response.data, null, 2)
      );
    } else {
      console.log("💥 Error de conexión:", error2.message);
    }
  }

  console.log("\n🎯 Resumen:");
  console.log(
    "- Si el Test 1 falla y el Test 2 funciona, el problema es la estructura de datos"
  );
  console.log("- Si ambos fallan, hay otro problema (token, salida_id, etc.)");
  console.log("- Revisa los logs del servidor para más detalles");
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testBrazaletesUso().catch(console.error);
}

module.exports = { testBrazaletesUso, testData, testDataCorrecta };
