const { Sequelize } = require("sequelize");
const Bloque = require("../dist/models/Bloque").default;
const Salida = require("../dist/models/Salida").default;

async function limpiarDatosPrueba() {
  try {
    console.log("🧹 Limpiando datos de prueba...\n");

    // 1. Eliminar todas las salidas
    console.log("🗑️ Eliminando todas las salidas...");
    const salidasEliminadas = await Salida.destroy({
      where: {},
    });
    console.log(`✅ ${salidasEliminadas} salidas eliminadas\n`);

    // 2. Eliminar bloques que NO son plantillas (que tienen fecha)
    console.log("🗑️ Eliminando bloques con fecha específica...");
    const bloquesEliminados = await Bloque.destroy({
      where: {
        fecha: { [Sequelize.Op.ne]: null },
      },
    });
    console.log(`✅ ${bloquesEliminados} bloques eliminados\n`);

    // 3. Verificar que solo quedan las plantillas
    const plantillas = await Bloque.findAll({
      where: { fecha: null },
      order: [["hora_inicio", "ASC"]],
    });

    console.log(`📋 Plantillas restantes: ${plantillas.length}\n`);

    plantillas.forEach((plantilla, index) => {
      console.log(`--- Plantilla ${index + 1} ---`);
      console.log(`ID: ${plantilla.id}`);
      console.log(`Nombre: ${plantilla.nombre}`);
      console.log(`Hora: ${plantilla.hora_inicio} - ${plantilla.hora_fin}`);
      console.log(`Capacidad: ${plantilla.capacidad_total}`);
      console.log(`Estado: ${plantilla.estado}`);
      console.log(`Fecha: ${plantilla.fecha}`);
      console.log("");
    });

    // 4. Verificar que no hay salidas
    const salidasRestantes = await Salida.count();
    console.log(`📊 Salidas restantes: ${salidasRestantes}`);

    // 5. Verificar que no hay bloques con fecha
    const bloquesConFecha = await Bloque.count({
      where: {
        fecha: { [Sequelize.Op.ne]: null },
      },
    });
    console.log(`📊 Bloques con fecha restantes: ${bloquesConFecha}`);

    console.log("\n🎉 Limpieza completada exitosamente!");
    console.log("💡 Base de datos lista para nuevas pruebas");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

limpiarDatosPrueba();
