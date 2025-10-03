const { Sequelize } = require("sequelize");
const Salida = require("../dist/models/Salida").default;

async function debugValidacionFecha() {
  try {
    console.log("🔍 Debugging validación de fecha...\n");

    // Datos exactos que envías
    const embarcacionId = "c6790ee5-530f-4605-9035-3ba12acede3e";
    const fecha = "2025-10-09";

    console.log(`📋 Datos de entrada:`);
    console.log(`   Embarcación ID: ${embarcacionId}`);
    console.log(`   Fecha: ${fecha}\n`);

    // 1. Crear la fecha como lo hace el controlador
    const fechaControlador = new Date(fecha);
    console.log(
      `1️⃣ Fecha creada por el controlador: ${fechaControlador.toISOString()}`
    );
    console.log(`   Fecha local: ${fechaControlador.toString()}\n`);

    // 2. Buscar conflictos exactamente como lo hace el controlador
    console.log("2️⃣ Buscando conflictos (misma lógica del controlador)...");
    const conflictoExistente = await Salida.findOne({
      where: {
        embarcacion_id: embarcacionId,
        fecha: fechaControlador,
        estado: {
          [Sequelize.Op.notIn]: [
            "cancelada",
            "cancelada_por_clima",
            "cancelada_capitaria",
          ],
        },
      },
    });

    console.log(`📊 Conflicto encontrado: ${conflictoExistente ? "SÍ" : "NO"}`);
    if (conflictoExistente) {
      console.log(`   ID: ${conflictoExistente.id}`);
      console.log(`   Fecha: ${conflictoExistente.fecha}`);
      console.log(`   Estado: ${conflictoExistente.estado}`);
      console.log(`   Destino: ${conflictoExistente.destino}\n`);
    }

    // 3. Buscar con rango de fechas (por si hay problema de timezone)
    console.log("3️⃣ Buscando con rango de fechas...");
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    console.log(
      `   Rango: ${inicioDia.toISOString()} - ${finDia.toISOString()}`
    );

    const conflictosRango = await Salida.findAll({
      where: {
        embarcacion_id: embarcacionId,
        fecha: {
          [Sequelize.Op.between]: [inicioDia, finDia],
        },
        estado: {
          [Sequelize.Op.notIn]: [
            "cancelada",
            "cancelada_por_clima",
            "cancelada_capitaria",
          ],
        },
      },
    });

    console.log(`📊 Conflictos en rango: ${conflictosRango.length}`);
    if (conflictosRango.length > 0) {
      conflictosRango.forEach((conflicto, index) => {
        console.log(`   ${index + 1}. ID: ${conflicto.id}`);
        console.log(`      Fecha: ${conflicto.fecha}`);
        console.log(`      Estado: ${conflicto.estado}`);
        console.log(`      Destino: ${conflicto.destino}`);
      });
    }

    // 4. Verificar todas las salidas de esta embarcación
    console.log("\n4️⃣ Todas las salidas de esta embarcación:");
    const todasLasSalidas = await Salida.findAll({
      where: {
        embarcacion_id: embarcacionId,
      },
      order: [["fecha", "ASC"]],
    });

    console.log(`📊 Total de salidas: ${todasLasSalidas.length}`);
    todasLasSalidas.forEach((salida, index) => {
      console.log(
        `   ${index + 1}. Fecha: ${salida.fecha} - Estado: ${
          salida.estado
        } - Destino: ${salida.destino}`
      );
    });

    // 5. Probar con diferentes formatos de fecha
    console.log("\n5️⃣ Probando diferentes formatos de fecha...");

    // Formato 1: Como viene del frontend
    const fecha1 = new Date("2025-10-09");
    console.log(`   Formato 1 (2025-10-09): ${fecha1.toISOString()}`);

    // Formato 2: Con hora específica
    const fecha2 = new Date("2025-10-09T00:00:00");
    console.log(`   Formato 2 (2025-10-09T00:00:00): ${fecha2.toISOString()}`);

    // Formato 3: Con timezone
    const fecha3 = new Date("2025-10-09T00:00:00-06:00");
    console.log(
      `   Formato 3 (2025-10-09T00:00:00-06:00): ${fecha3.toISOString()}`
    );

    console.log("\n🎯 Conclusión:");
    if (conflictoExistente) {
      console.log(
        "❌ HAY CONFLICTO - La validación está funcionando correctamente"
      );
      console.log(
        "💡 La embarcación ya tiene una salida programada para esa fecha"
      );
    } else if (conflictosRango.length > 0) {
      console.log("⚠️ HAY CONFLICTO EN RANGO - Problema de timezone");
      console.log(
        "💡 La validación exacta falla pero el rango detecta el conflicto"
      );
    } else {
      console.log(
        "✅ NO HAY CONFLICTO - La validación debería permitir la creación"
      );
    }
  } catch (error) {
    console.error("❌ Error en el debugging:", error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  debugValidacionFecha().catch(console.error);
}

module.exports = { debugValidacionFecha };
