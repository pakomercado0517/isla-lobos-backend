const axios = require("axios");

const BASE_URL = "http://localhost:3001/api";

// Token de CONANP (necesitas obtenerlo)
const CONANP_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzNTJiMTIzLWFkNmQtNGM4OS1hNmQ1LWRlNTMyMjBmMTIzMyIsImVtYWlsIjoiY29uYW5wQGVqZW1wbG8uY29tIiwicm9sIjoiY29uYW5wIiwibm9tYnJlIjoiQ09OQU5QIiwiaWF0IjoxNzU5NDcxMDI0LCJleHAiOjE3NTk1NTc0MjR9.example";

// ID del prestador Juan Pérez
const PRESTADOR_ID = "6352b123-ad6d-4c89-a6d5-de53220f1233";

async function crearYVenderBrazaletes() {
  try {
    console.log("🔍 Creando y vendiendo brazaletes...\n");

    // 1. Crear un lote de brazaletes
    console.log("1️⃣ Creando lote de brazaletes...");
    const loteData = {
      numero_lote: "LOTE-TEST-" + Date.now(),
      cantidad_total: 50,
      precio_venta: 100.0,
      descripcion: "Lote de prueba para asignación",
    };

    console.log("📝 Datos del lote:", JSON.stringify(loteData, null, 2));

    const loteResponse = await axios.post(
      `${BASE_URL}/brazaletes/lotes`,
      loteData,
      {
        headers: {
          Authorization: `Bearer ${CONANP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Lote creado exitosamente:");
    console.log("Status:", loteResponse.status);
    console.log("Data:", JSON.stringify(loteResponse.data, null, 2));

    // 2. Vender brazaletes al prestador
    console.log("\n2️⃣ Vendiendo brazaletes al prestador...");
    const ventaData = {
      prestador_id: PRESTADOR_ID,
      cantidad: 20,
      precio_unitario: 100.0,
      metodo_pago: "transferencia",
      observaciones: "Venta de prueba para asignación",
    };

    console.log("📝 Datos de venta:", JSON.stringify(ventaData, null, 2));

    const ventaResponse = await axios.post(
      `${BASE_URL}/brazaletes/venta`,
      ventaData,
      {
        headers: {
          Authorization: `Bearer ${CONANP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Venta realizada exitosamente:");
    console.log("Status:", ventaResponse.status);
    console.log("Data:", JSON.stringify(ventaResponse.data, null, 2));

    console.log("\n🎉 ¡Brazaletes creados y vendidos exitosamente!");
    console.log("💡 Ahora el prestador puede asignar brazaletes a sus salidas");
  } catch (error) {
    console.error("❌ Error en la operación:");
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("Error:", error.message);
    }
  }
}

crearYVenderBrazaletes();
