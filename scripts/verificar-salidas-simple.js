const { Sequelize } = require("sequelize");
const Salida = require("../dist/models/Salida").default;
const Embarcacion = require("../dist/models/Embarcacion").default;

async function verificarSalidasSimple() {
  try {
    console.log("🔍 Verificando salidas existentes...\n");

    // Obtener todas las salidas
    const salidas = await Salida.findAll({
      order: [["fecha", "DESC"]],
    });

    console.log(`📊 Total de salidas: ${salidas.length}\n`);

    if (salidas.length > 0) {
      console.log("📋 Salidas existentes:");
      salidas.forEach((salida, index) => {
        console.log(`   ${index + 1}. ID: ${salida.id}`);
        console.log(`      Fecha: ${salida.fecha}`);
        console.log(`      Destino: ${salida.destino}`);
        console.log(`      Estado: ${salida.estado}`);
        console.log(`      Embarcación ID: ${salida.embarcacion_id}`);
        console.log(`      Bloque ID: ${salida.bloque_id || "N/A"}`);
        console.log(`      Pasajeros: ${salida.numero_pasajeros}`);
        console.log("");
      });
    } else {
      console.log("✅ No hay salidas en la base de datos");
    }

    // Buscar salidas activas (no canceladas)
    console.log("🔍 Buscando salidas activas...");
    const salidasActivas = await Salida.findAll({
      where: {
        estado: {
          [Sequelize.Op.notIn]: [
            "cancelada",
            "cancelada_por_clima",
            "cancelada_capitaria",
          ],
        },
      },
      order: [["fecha", "DESC"]],
    });

    console.log(`📊 Salidas activas: ${salidasActivas.length}\n`);

    if (salidasActivas.length > 0) {
      console.log("📋 Salidas activas:");
      salidasActivas.forEach((salida, index) => {
        console.log(`   ${index + 1}. ID: ${salida.id}`);
        console.log(`      Fecha: ${salida.fecha}`);
        console.log(`      Destino: ${salida.destino}`);
        console.log(`      Estado: ${salida.estado}`);
        console.log(`      Embarcación ID: ${salida.embarcacion_id}`);
        console.log(`      Bloque ID: ${salida.bloque_id || "N/A"}`);
        console.log("");
      });
    }

    // Obtener embarcaciones
    console.log("🚢 Verificando embarcaciones...");
    const embarcaciones = await Embarcacion.findAll({
      order: [["nombre", "ASC"]],
    });

    console.log(`📊 Total de embarcaciones: ${embarcaciones.length}\n`);

    if (embarcaciones.length > 0) {
      console.log("📋 Embarcaciones:");
      embarcaciones.forEach((embarcacion, index) => {
        console.log(`   ${index + 1}. ID: ${embarcacion.id}`);
        console.log(`      Nombre: ${embarcacion.nombre}`);
        console.log(`      Matrícula: ${embarcacion.matricula}`);
        console.log(`      Estado: ${embarcacion.estado}`);
        console.log(`      Capacidad: ${embarcacion.capacidad}`);
        console.log(`      Prestador ID: ${embarcacion.prestador_id}`);
        console.log("");
      });
    }

  } catch (error) {
    console.error("❌ Error al verificar salidas:", error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verificarSalidasSimple().catch(console.error);
}

module.exports = { verificarSalidasSimple };
