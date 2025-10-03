const { Sequelize } = require("sequelize");
const Bloque = require("../dist/models/Bloque").default;

async function resetBloques() {
  try {
    console.log("🔄 Reseteando sistema de bloques...\n");

    // 1. Eliminar solo bloques que NO son plantillas
    console.log("🗑️ Eliminando bloques que no son plantillas...");
    const bloquesEliminados = await Bloque.destroy({
      where: {
        fecha: { [Sequelize.Op.ne]: null },
      },
    });
    console.log(`✅ ${bloquesEliminados} bloques eliminados\n`);

    // 2. Verificar si ya existen plantillas
    const plantillasExistentes = await Bloque.count({
      where: { fecha: null },
    });

    if (plantillasExistentes === 0) {
      console.log("🏗️ Creando plantillas de bloques...");

      const plantillas = [
        {
          nombre: "Bloque Matutino",
          hora_inicio: "08:00:00",
          hora_fin: "10:00:00",
          capacidad_total: 65,
          capacidad_registrada: 0,
          estado: "plantilla",
          fecha: null,
        },
        {
          nombre: "Bloque Mediodía",
          hora_inicio: "11:00:00",
          hora_fin: "13:00:00",
          capacidad_total: 65,
          capacidad_registrada: 0,
          estado: "plantilla",
          fecha: null,
        },
        {
          nombre: "Bloque Vespertino",
          hora_inicio: "14:00:00",
          hora_fin: "16:00:00",
          capacidad_total: 65,
          capacidad_registrada: 0,
          estado: "plantilla",
          fecha: null,
        },
      ];

      for (const plantilla of plantillas) {
        await Bloque.create(plantilla);
        console.log(`✅ Creada plantilla: ${plantilla.nombre}`);
      }
    } else {
      console.log(`ℹ️ Ya existen ${plantillasExistentes} plantillas`);
    }

    // 3. Verificar resultado
    const plantillasCreadas = await Bloque.findAll({
      where: { fecha: null },
      order: [["hora_inicio", "ASC"]],
    });

    console.log(`\n📊 Plantillas creadas: ${plantillasCreadas.length}`);
    plantillasCreadas.forEach((plantilla) => {
      console.log(`  - ${plantilla.nombre}: ${plantilla.id}`);
    });

    console.log("\n🎉 Sistema de bloques reseteado correctamente!");
    console.log(
      "💡 Ahora cada fecha tendrá bloques con IDs únicos generados automáticamente"
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

resetBloques();
