const { Sequelize } = require("sequelize");
const Salida = require("../dist/models/Salida").default;
const Embarcacion = require("../dist/models/Embarcacion").default;

async function verificarSalidasEmbarcacion() {
  try {
    console.log("🔍 Verificando salidas de embarcaciones...\n");

    // Obtener todas las embarcaciones
    const embarcaciones = await Embarcacion.findAll({
      include: [
        {
          model: Salida,
          as: "salidas",
          attributes: ["id", "fecha", "destino", "estado", "numero_pasajeros"],
          order: [["fecha", "DESC"]],
        },
      ],
    });

    console.log(`📊 Total de embarcaciones: ${embarcaciones.length}\n`);

    embarcaciones.forEach((embarcacion, index) => {
      console.log(`🚢 Embarcación ${index + 1}:`);
      console.log(`   - ID: ${embarcacion.id}`);
      console.log(`   - Nombre: ${embarcacion.nombre}`);
      console.log(`   - Matrícula: ${embarcacion.matricula}`);
      console.log(`   - Estado: ${embarcacion.estado}`);
      console.log(`   - Salidas: ${embarcacion.salidas.length}`);
      
      if (embarcacion.salidas.length > 0) {
        console.log("   📋 Salidas:");
        embarcacion.salidas.forEach((salida, salidaIndex) => {
          console.log(`      ${salidaIndex + 1}. ${salida.fecha} - ${salida.destino} (${salida.estado}) - ${salida.numero_pasajeros} pasajeros`);
        });
      }
      console.log("");
    });

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
      include: [
        {
          model: Embarcacion,
          as: "embarcacion",
          attributes: ["id", "nombre", "matricula"],
        },
      ],
      order: [["fecha", "DESC"]],
    });

    console.log(`📊 Total de salidas activas: ${salidasActivas.length}\n`);

    if (salidasActivas.length > 0) {
      console.log("📋 Salidas activas:");
      salidasActivas.forEach((salida, index) => {
        console.log(`   ${index + 1}. ID: ${salida.id}`);
        console.log(`      Fecha: ${salida.fecha}`);
        console.log(`      Destino: ${salida.destino}`);
        console.log(`      Estado: ${salida.estado}`);
        console.log(`      Embarcación: ${salida.embarcacion?.nombre} (${salida.embarcacion?.matricula})`);
        console.log(`      Pasajeros: ${salida.numero_pasajeros}`);
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
  verificarSalidasEmbarcacion().catch(console.error);
}

module.exports = { verificarSalidasEmbarcacion };
