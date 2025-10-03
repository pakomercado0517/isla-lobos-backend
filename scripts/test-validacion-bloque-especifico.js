const { Sequelize } = require("sequelize");
const Salida = require("../dist/models/Salida").default;

async function testValidacionBloqueEspecifico() {
  try {
    console.log("🔍 Probando validación corregida (bloque específico)...\n");

    // Datos exactos del frontend
    const embarcacionId = "c6790ee5-530f-4605-9035-3ba12acede3e";
    const fecha = "2025-10-09";
    const bloqueId = "e9b0b483-b983-47d8-af0c-6d81a962950b";

    console.log(`📋 Datos del frontend:`);
    console.log(`   Embarcación ID: ${embarcacionId}`);
    console.log(`   Fecha: ${fecha}`);
    console.log(`   Bloque ID: ${bloqueId}\n`);

    // Aplicar la lógica corregida del controlador
    const fechaBusqueda = new Date(fecha + "T00:00:00.000Z");
    const inicioDia = new Date(fechaBusqueda);
    const finDia = new Date(fechaBusqueda);
    finDia.setUTCHours(23, 59, 59, 999);

    console.log(`📅 Rango de búsqueda:`);
    console.log(`   Inicio: ${inicioDia.toISOString()}`);
    console.log(`   Fin: ${finDia.toISOString()}\n`);

    // Buscar conflictos con la lógica corregida (bloque específico)
    const conflictoExistente = await Salida.findOne({
      where: {
        embarcacion_id: embarcacionId,
        bloque_id: bloqueId, // Validación de bloque específico
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
      console.log(`   Bloque ID: ${conflictoExistente.bloque_id}`);
      console.log(
        "\n❌ La validación detecta un conflicto - NO se puede crear la salida"
      );
      console.log(
        "💡 La embarcación ya tiene una salida programada para este bloque y fecha"
      );
    } else {
      console.log("\n✅ No hay conflictos - SE PUEDE crear la salida");
      console.log(
        "💡 La embarcación no tiene salida en este bloque específico"
      );
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
      const fechaLocal = fechaSalida.toLocaleDateString();
      const fechaISO = fechaSalida.toISOString();

      console.log(`   ${index + 1}. Fecha: ${fechaLocal} (${fechaISO})`);
      console.log(
        `      Estado: ${salida.estado} - Destino: ${salida.destino}`
      );
      console.log(`      Bloque ID: ${salida.bloque_id}`);
      console.log(`      ID: ${salida.id}`);
      console.log("");
    });

    // Verificar si hay salidas en el mismo bloque
    console.log("🔍 Verificando salidas en el mismo bloque...");
    const salidasEnMismoBloque = await Salida.findAll({
      where: {
        bloque_id: bloqueId,
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

    console.log(
      `📊 Salidas en el mismo bloque: ${salidasEnMismoBloque.length}`
    );
    if (salidasEnMismoBloque.length > 0) {
      console.log("🚨 SALIDAS EN EL MISMO BLOQUE:");
      salidasEnMismoBloque.forEach((salida, index) => {
        console.log(`   ${index + 1}. ID: ${salida.id}`);
        console.log(`      Embarcación ID: ${salida.embarcacion_id}`);
        console.log(`      Estado: ${salida.estado}`);
        console.log(`      Destino: ${salida.destino}`);
        console.log(`      Pasajeros: ${salida.numero_pasajeros}`);
        console.log("");
      });
    } else {
      console.log("✅ No hay salidas en el mismo bloque");
    }
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testValidacionBloqueEspecifico().catch(console.error);
}

module.exports = { testValidacionBloqueEspecifico };
