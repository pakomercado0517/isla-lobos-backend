const Bloque = require("../dist/models/Bloque").default;

async function corregirPlantillas() {
  try {
    console.log("🔧 Corrigiendo plantillas de bloques...\n");

    // Buscar bloques con los IDs de plantilla
    const idsPlantilla = [
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
      "33333333-3333-3333-3333-333333333333",
    ];

    for (const id of idsPlantilla) {
      const bloque = await Bloque.findByPk(id);

      if (bloque) {
        console.log(`🔧 Corrigiendo bloque: ${bloque.nombre} (${id})`);
        console.log(`  Estado actual: ${bloque.estado}`);
        console.log(`  Fecha actual: ${bloque.fecha}`);

        // Actualizar para que sea una plantilla
        await bloque.update({
          estado: "plantilla",
          fecha: null,
          capacidad_registrada: 0,
        });

        console.log(`  ✅ Corregido: estado=plantilla, fecha=null`);
      } else {
        console.log(`❌ No se encontró bloque con ID: ${id}`);
      }
      console.log("");
    }

    // Verificar el resultado
    const plantillas = await Bloque.findAll({
      where: { fecha: null },
      order: [["hora_inicio", "ASC"]],
    });

    console.log(`📋 Plantillas corregidas: ${plantillas.length}\n`);

    plantillas.forEach((plantilla, index) => {
      console.log(`--- Plantilla ${index + 1} ---`);
      console.log(`ID: ${plantilla.id}`);
      console.log(`Nombre: ${plantilla.nombre}`);
      console.log(`Estado: ${plantilla.estado}`);
      console.log(`Fecha: ${plantilla.fecha}`);
      console.log("");
    });

    console.log("🎉 Plantillas corregidas exitosamente!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

corregirPlantillas();
