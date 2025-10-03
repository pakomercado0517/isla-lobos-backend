const axios = require("axios");

// Configuración
const BASE_URL = "http://localhost:3001/api";
const PRESTADOR_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzNTJiMTIzLWFkNmQtNGM4OS1hNmQ1LWRlNTMyMjBmMTIzMyIsImVtYWlsIjoianVhbi5wZXJlekBlamVtcGxvLmNvbSIsInJvbCI6InByZXN0YWRvciIsIm5vbWJyZSI6Ikp1YW4gUMOpcmV6IiwiaWF0IjoxNzU5NDY4OTc1LCJleHAiOjE3NTk1NTUzNzV9.uI3T68IdSKfPlQskMPVLD9StZVanZrKtuid1RjAzf6A";

async function testFechaUsoPersonalizada() {
  console.log("📅 Probando fecha de uso personalizada...\n");

  try {
    // Paso 1: Obtener brazaletes asignados
    console.log("📋 Paso 1: Obteniendo brazaletes asignados...");
    const responseBrazaletes = await axios.get(
      `${BASE_URL}/brazaletes/mis-brazaletes`,
      {
        headers: {
          Authorization: `Bearer ${PRESTADOR_TOKEN}`,
        },
      }
    );

    const brazaletesAsignados = responseBrazaletes.data.data.detalle.filter(
      (b) => b.estado === "asignado"
    );

    if (brazaletesAsignados.length === 0) {
      console.log("❌ No hay brazaletes asignados disponibles");
      return;
    }

    console.log(
      `✅ Encontrados ${brazaletesAsignados.length} brazaletes asignados`
    );

    // Paso 2: Crear fechas de prueba
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const haceUnaSemana = new Date(hoy);
    haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);

    // Paso 3: Probar con fecha de ayer (válida)
    console.log("\n📋 Paso 3: Probando con fecha de ayer...");

    const dataAyer = {
      salida_id: "cb6afa92-e6bc-451c-9460-e497eda1cc1b",
      brazaletes: [
        {
          codigo: brazaletesAsignados[0].codigo,
          turista_nacionalidad: "nacional",
          turista_edad: 30,
          fecha_uso: ayer.toISOString().split("T")[0], // Formato YYYY-MM-DD
        },
      ],
    };

    console.log(
      "📤 Enviando data con fecha de ayer:",
      JSON.stringify(dataAyer, null, 2)
    );

    const responseAyer = await axios.post(
      `${BASE_URL}/brazaletes/uso`,
      dataAyer,
      {
        headers: {
          Authorization: `Bearer ${PRESTADOR_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Respuesta con fecha de ayer:");
    console.log(
      "📊 Brazaletes utilizados:",
      responseAyer.data.data.brazaletes_utilizados
    );
    console.log("📊 Errores:", responseAyer.data.data.errores || "Ninguno");

    // Paso 4: Probar con fecha de hace una semana (válida)
    console.log("\n📋 Paso 4: Probando con fecha de hace una semana...");

    const dataSemana = {
      salida_id: "cb6afa92-e6bc-451c-9460-e497eda1cc1b",
      brazaletes: [
        {
          codigo: brazaletesAsignados[1].codigo,
          turista_nacionalidad: "nacional",
          turista_edad: 30,
          fecha_uso: haceUnaSemana.toISOString().split("T")[0], // Formato YYYY-MM-DD
        },
      ],
    };

    console.log(
      "📤 Enviando data con fecha de hace una semana:",
      JSON.stringify(dataSemana, null, 2)
    );

    const responseSemana = await axios.post(
      `${BASE_URL}/brazaletes/uso`,
      dataSemana,
      {
        headers: {
          Authorization: `Bearer ${PRESTADOR_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Respuesta con fecha de hace una semana:");
    console.log(
      "📊 Brazaletes utilizados:",
      responseSemana.data.data.brazaletes_utilizados
    );
    console.log("📊 Errores:", responseSemana.data.data.errores || "Ninguno");

    // Paso 5: Verificar los brazaletes utilizados
    console.log("\n📋 Paso 5: Verificando brazaletes utilizados...");
    const responseFinal = await axios.get(
      `${BASE_URL}/brazaletes/mis-brazaletes`,
      {
        headers: {
          Authorization: `Bearer ${PRESTADOR_TOKEN}`,
        },
      }
    );

    const brazaletesUtilizados = responseFinal.data.data.detalle.filter(
      (b) =>
        b.estado === "utilizado" &&
        (b.codigo === brazaletesAsignados[0].codigo ||
          b.codigo === brazaletesAsignados[1].codigo)
    );

    console.log("📋 Brazaletes utilizados con fechas personalizadas:");
    brazaletesUtilizados.forEach((b) => {
      console.log(`  - ${b.codigo}: ${b.estado} (fecha_uso: ${b.fecha_uso})`);
    });

    console.log("\n🎉 ¡Pruebas de fecha personalizada completadas!");
  } catch (error) {
    console.log("❌ Error en las pruebas:");
    if (error.response) {
      console.log("📊 Status:", error.response.status);
      console.log(
        "📝 Response data:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.log("💥 Error de conexión:", error.message);
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testFechaUsoPersonalizada().catch(console.error);
}

module.exports = { testFechaUsoPersonalizada };
