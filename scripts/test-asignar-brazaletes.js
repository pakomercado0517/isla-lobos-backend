const axios = require("axios");

const BASE_URL = "http://localhost:3001/api";
const PRESTADOR_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzNTJiMTIzLWFkNmQtNGM4OS1hNmQ1LWRlNTMyMjBmMTIzMyIsImVtYWlsIjoianVhbi5wZXJlekBlamVtcGxvLmNvbSIsInJvbCI6InByZXN0YWRvciIsIm5vbWJyZSI6Ikp1YW4gUMOpcmV6IiwiaWF0IjoxNzU5NDcxMDI0LCJleHAiOjE3NTk1NTc0MjR9.GGDMZiOj1kd79U8SEo6P-tY-zs8MyZaUMyTdGTRTbZQ";

async function testAsignarBrazaletes() {
  try {
    console.log("🔍 Probando asignación de brazaletes...\n");

    const data = {
      salida_id: "69813d78-ddc7-4ed2-bbbd-49b574c65e26",
      cantidad: 5,
      fecha_asignacion: "2025-10-09",
    };

    console.log("📝 Datos a enviar:", JSON.stringify(data, null, 2));

    const response = await axios.post(`${BASE_URL}/brazaletes/asignar`, data, {
      headers: {
        Authorization: `Bearer ${PRESTADOR_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Respuesta exitosa:");
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Error en la prueba:");
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("Error:", error.message);
    }
  }
}

testAsignarBrazaletes();
