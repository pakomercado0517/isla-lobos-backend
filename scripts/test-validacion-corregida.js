const { Sequelize } = require("sequelize");
const Salida = require("../dist/models/Salida").default;

async function testValidacionCorregida() {
  try {
    console.log("🔍 Probando validación corregida...\n");

    // Datos exactos que envías
    const embarcacionId = "c6790ee5-530f-4605-9035-3ba12acede3e";
    const fecha = "2025-10-09";

    console.log(`📋 Datos de entrada:`);
    console.log(`   Embarcación ID: ${embarcacionId}`);
    console.log(`   Fecha: ${fecha}\n`);

    // Aplicar la misma lógica corregida del controlador
    const fechaBusqueda = new Date(fecha + "T00:00:00.000Z");
    const inicioDia = new Date(fechaBusqueda);
    const finDia = new Date(fechaBusqueda);
    finDia.setUTCHours(23, 59, 59, 999);

    console.log(`📅 Rango de búsqueda:`);
    console.log(`   Inicio: ${inicioDia.toISOString()}`);
    console.log(`   Fin: ${finDia.toISOString()}`);
    console.log(`   Inicio local: ${inicioDia.toString()}`);
    console.log(`   Fin local: ${finDia.toString()}\n`);

    // Buscar conflictos con la lógica corregida
    const conflictoExistente = await Salida.findOne({
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

    console.log(`📊 Resultado de la validación:`);
    console.log(`   Conflicto encontrado: ${conflictoExistente ? "SÍ" : "NO"}`);

    if (conflictoExistente) {
      console.log(`   ID: ${conflictoExistente.id}`);
      console.log(`   Fecha: ${conflictoExistente.fecha}`);
      console.log(`   Estado: ${conflictoExistente.estado}`);
      console.log(`   Destino: ${conflictoExistente.destino}`);
      console.log(
        "\n❌ La validación detecta un conflicto - NO se puede crear la salida"
      );
    } else {
      console.log("\n✅ No hay conflictos - SE PUEDE crear la salida");
    }

    // Mostrar todas las salidas de esta embarcación para contexto
    console.log("\n📋 Todas las salidas de esta embarcación:");
    const todasLasSalidas = await Salida.findAll({
      where: {
        embarcacion_id: embarcacionId,
      },
      order: [["fecha", "ASC"]],
    });

    todasLasSalidas.forEach((salida, index) => {
      const fechaSalida = new Date(salida.fecha);
      const fechaSalidaLocal = fechaSalida.toLocaleDateString();
      const fechaSalidaISO = fechaSalida.toISOString();

      console.log(
        `   ${index + 1}. Fecha: ${fechaSalidaLocal} (${fechaSalidaISO})`
      );
      console.log(
        `      Estado: ${salida.estado} - Destino: ${salida.destino}`
      );
      console.log(`      ID: ${salida.id}`);
    });
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testValidacionCorregida().catch(console.error);
}

module.exports = { testValidacionCorregida };
