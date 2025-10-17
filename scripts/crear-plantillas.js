const Bloque = require("../dist/models/Bloque").default;

async function crearPlantillas() {
  try {
    console.log("🏗️ Creando plantillas de bloques...\n");

    // Verificar si ya existen plantillas
    const plantillasExistentes = await Bloque.count({
      where: { es_plantilla: true },
    });

    if (plantillasExistentes > 0) {
      console.log(
        `ℹ️ Ya existen ${plantillasExistentes} plantillas. No es necesario crear más.`
      );
      return;
    }

    // Crear las plantillas con IDs fijos para Isla de Lobos
    const plantillas = [
      {
        id: "11111111-1111-1111-1111-111111111111",
        nombre: "Bloque Matutino",
        hora_inicio: "08:00:00",
        hora_fin: "10:00:00",
        capacidad_total: 65,
        capacidad_registrada: 0,
        estado: "activo",
        destino: "Isla de Lobos",
        es_plantilla: true,
        fecha: null,
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        nombre: "Bloque Intermedio", // Cambié nombre para consistencia
        hora_inicio: "10:00:00", // Cambié horarios para que coincidan con seeders
        hora_fin: "12:00:00",
        capacidad_total: 65,
        capacidad_registrada: 0,
        estado: "activo",
        destino: "Isla de Lobos",
        es_plantilla: true,
        fecha: null,
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        nombre: "Bloque Vespertino",
        hora_inicio: "12:00:00", // Cambié horarios para que coincidan con seeders
        hora_fin: "14:00:00",
        capacidad_total: 65,
        capacidad_registrada: 0,
        estado: "activo",
        destino: "Isla de Lobos",
        es_plantilla: true,
        fecha: null,
      },
    ];

    console.log("📋 Creando plantillas...\n");

    for (const plantilla of plantillas) {
      await Bloque.create(plantilla);
      console.log(`✅ Creada: ${plantilla.nombre} (${plantilla.id})`);
    }

    console.log("\n🎉 Plantillas creadas exitosamente!");

    // Verificar que se crearon correctamente
    const plantillasCreadas = await Bloque.findAll({
      where: { es_plantilla: true },
      order: [["hora_inicio", "ASC"]],
    });

    console.log(`\n📊 Total de plantillas: ${plantillasCreadas.length}`);
    plantillasCreadas.forEach((plantilla) => {
      console.log(`  - ${plantilla.nombre}: ${plantilla.id}`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

crearPlantillas();
