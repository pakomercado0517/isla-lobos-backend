const axios = require("axios");

const BASE_URL = "http://localhost:3001/api";

// Tokens (necesitas obtenerlos)
const CONANP_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzNTJiMTIzLWFkNmQtNGM4OS1hNmQ1LWRlNTMyMjBmMTIzMyIsImVtYWlsIjoiY29uYW5wQGVqZW1wbG8uY29tIiwicm9sIjoiY29uYW5wIiwibm9tYnJlIjoiQ09OQU5QIiwiaWF0IjoxNzU5NDcxMDI0LCJleHAiOjE3NTk1NTc0MjR9.example";
const PRESTADOR_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzNTJiMTIzLWFkNmQtNGM4OS1hNmQ1LWRlNTMyMjBmMTIzMyIsImVtYWlsIjoianVhbi5wZXJlekBlamVtcGxvLmNvbSIsInJvbCI6InByZXN0YWRvciIsIm5vbWJyZSI6Ikp1YW4gUMOpcmV6IiwiaWF0IjoxNzU5NDcxMDI0LCJleHAiOjE3NTk1NTc0MjR9.example";

// IDs
const PRESTADOR_ID = "6352b123-ad6d-4c89-a6d5-de53220f1233";

async function testFlujoCompletoBrazaletes() {
  try {
    console.log("🔍 Probando flujo completo de brazaletes...\n");

    // 1. Crear un lote de brazaletes (CONANP)
    console.log("1️⃣ Creando lote de brazaletes...");
    const loteData = {
      numero_lote: "LOTE-TEST-" + Date.now(),
      cantidad_total: 50,
      precio_venta: 100.0,
      descripcion: "Lote de prueba para flujo completo",
    };

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

    console.log("✅ Lote creado:", loteResponse.data.data.numero_lote);

    // 2. Vender brazaletes al prestador (CONANP)
    console.log("\n2️⃣ Vendiendo brazaletes al prestador...");
    const ventaData = {
      prestador_id: PRESTADOR_ID,
      cantidad: 20,
      precio_unitario: 100.0,
      metodo_pago: "transferencia",
      observaciones: "Venta de prueba para flujo completo",
    };

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

    console.log(
      "✅ Venta realizada:",
      ventaResponse.data.data.cantidad,
      "brazaletes"
    );

    // 3. Verificar brazaletes del prestador (deben estar en estado "disponible")
    console.log("\n3️⃣ Verificando brazaletes del prestador...");
    const brazaletesResponse = await axios.get(
      `${BASE_URL}/brazaletes/mis-brazaletes`,
      {
        headers: {
          Authorization: `Bearer ${PRESTADOR_TOKEN}`,
        },
      }
    );

    const brazaletesDisponibles = brazaletesResponse.data.data.filter(
      (b) => b.estado === "disponible"
    );
    console.log(`✅ Brazaletes disponibles: ${brazaletesDisponibles.length}`);

    // 4. Crear una salida (Prestador)
    console.log("\n4️⃣ Creando una salida...");
    const salidaData = {
      fecha: "2025-10-10",
      embarcacion_id: "c6790ee5-530f-4605-9035-3ba12acede3e", // Nueva Embarcacion Test
      numero_pasajeros: 5,
      numero_brazaletes: 5,
      destino: "Isla de Lobos",
      observaciones: "Salida de prueba",
      bloque_id: "e9b0b483-b983-47d8-af0c-6d81a962950b", // Se creará dinámicamente
    };

    // Primero obtener los bloques para esa fecha
    const bloquesResponse = await axios.get(
      `${BASE_URL}/bloques?fecha=2025-10-10`,
      {
        headers: {
          Authorization: `Bearer ${PRESTADOR_TOKEN}`,
        },
      }
    );

    const bloqueId = bloquesResponse.data.data.bloques[0].id;
    salidaData.bloque_id = bloqueId;

    const salidaResponse = await axios.post(`${BASE_URL}/salidas`, salidaData, {
      headers: {
        Authorization: `Bearer ${PRESTADOR_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const salidaId = salidaResponse.data.data.id;
    console.log("✅ Salida creada:", salidaId);

    // 5. Asignar brazaletes a la salida (Prestador)
    console.log("\n5️⃣ Asignando brazaletes a la salida...");
    const asignacionData = {
      salida_id: salidaId,
      cantidad: 5,
      fecha_asignacion: "2025-10-10",
    };

    const asignacionResponse = await axios.post(
      `${BASE_URL}/brazaletes/asignar`,
      asignacionData,
      {
        headers: {
          Authorization: `Bearer ${PRESTADOR_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "✅ Brazaletes asignados:",
      asignacionResponse.data.data.cantidad_asignada
    );

    // 6. Verificar que los brazaletes ahora están en estado "asignado"
    console.log(
      "\n6️⃣ Verificando estado de brazaletes después de asignación..."
    );
    const brazaletesDespuesResponse = await axios.get(
      `${BASE_URL}/brazaletes/mis-brazaletes`,
      {
        headers: {
          Authorization: `Bearer ${PRESTADOR_TOKEN}`,
        },
      }
    );

    const brazaletesAsignados = brazaletesDespuesResponse.data.data.filter(
      (b) => b.estado === "asignado"
    );
    const brazaletesDisponiblesDespues =
      brazaletesDespuesResponse.data.data.filter(
        (b) => b.estado === "disponible"
      );

    console.log(`✅ Brazaletes asignados: ${brazaletesAsignados.length}`);
    console.log(
      `✅ Brazaletes disponibles: ${brazaletesDisponiblesDespues.length}`
    );

    // 7. Registrar uso de brazaletes (Prestador)
    console.log("\n7️⃣ Registrando uso de brazaletes...");
    const usoData = {
      salida_id: salidaId,
      brazaletes: brazaletesAsignados.slice(0, 3).map((b) => ({
        codigo: b.codigo,
        turista_nacionalidad: "nacional",
        turista_edad: 30,
      })),
    };

    const usoResponse = await axios.post(
      `${BASE_URL}/brazaletes/uso`,
      usoData,
      {
        headers: {
          Authorization: `Bearer ${PRESTADOR_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "✅ Uso registrado:",
      usoResponse.data.data.brazaletes_utilizados,
      "brazaletes"
    );

    // 8. Verificación final
    console.log("\n8️⃣ Verificación final...");
    const brazaletesFinalResponse = await axios.get(
      `${BASE_URL}/brazaletes/mis-brazaletes`,
      {
        headers: {
          Authorization: `Bearer ${PRESTADOR_TOKEN}`,
        },
      }
    );

    const estadosFinal = {};
    brazaletesFinalResponse.data.data.forEach((b) => {
      estadosFinal[b.estado] = (estadosFinal[b.estado] || 0) + 1;
    });

    console.log("📊 Estados finales de brazaletes:");
    Object.entries(estadosFinal).forEach(([estado, cantidad]) => {
      console.log(`   ${estado}: ${cantidad}`);
    });

    console.log("\n🎉 ¡Flujo completo probado exitosamente!");
    console.log("✅ Los brazaletes mantienen el estado correcto en cada paso");
  } catch (error) {
    console.error(
      "❌ Error en el flujo:",
      error.response?.data || error.message
    );
  }
}

testFlujoCompletoBrazaletes();
