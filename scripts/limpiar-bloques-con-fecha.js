const { Sequelize } = require("sequelize");
const Bloque = require("../dist/models/Bloque").default;

async function limpiarBloquesConFecha() {
  try {
    console.log("🧹 Limpiando bloques que tienen fecha específica...\n");

    // Buscar bloques que tienen fecha (no son plantillas)
    const bloquesConFecha = await Bloque.findAll({
      where: {
        fecha: { [Sequelize.Op.ne]: null },
      },
    });

    console.log(
      `📊 Bloques con fecha encontrados: ${bloquesConFecha.length}\n`
    );

    if (bloquesConFecha.length > 0) {
      bloquesConFecha.forEach((bloque, index) => {
        console.log(`--- Bloque ${index + 1} ---`);
        console.log(`ID: ${bloque.id}`);
        console.log(`Nombre: ${bloque.nombre}`);
        console.log(`Fecha: ${bloque.fecha}`);
        console.log("");
      });

      // Eliminar bloques con fecha
      await Bloque.destroy({
        where: {
          fecha: { [Sequelize.Op.ne]: null },
        },
      });

      console.log("✅ Bloques con fecha eliminados exitosamente\n");
    } else {
      console.log("ℹ️ No hay bloques con fecha para eliminar\n");
    }

    // Verificar plantillas
    const plantillas = await Bloque.findAll({
      where: {
        fecha: null,
      },
      order: [["hora_inicio", "ASC"]],
    });

    console.log(`📋 Plantillas disponibles: ${plantillas.length}\n`);

    plantillas.forEach((plantilla, index) => {
      console.log(`--- Plantilla ${index + 1} ---`);
      console.log(`ID: ${plantilla.id}`);
      console.log(`Nombre: ${plantilla.nombre}`);
      console.log(`Hora: ${plantilla.hora_inicio} - ${plantilla.hora_fin}`);
      console.log(`Capacidad: ${plantilla.capacidad_total}`);
      console.log("");
    });

    console.log("🎯 Base de datos lista para usar el nuevo sistema de bloques");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

limpiarBloquesConFecha();
