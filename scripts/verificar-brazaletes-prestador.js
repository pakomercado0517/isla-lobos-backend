const { Sequelize } = require("sequelize");
const Brazalete = require("../dist/models/Brazalete").default;
const User = require("../dist/models/User").default;

async function verificarBrazaletesPrestador() {
  try {
    console.log("🔍 Verificando brazaletes del prestador...\n");

    const prestadorId = "6352b123-ad6d-4c89-a6d5-de53220f1233";

    console.log(`👤 Prestador ID: ${prestadorId}\n`);

    // 1. Verificar el prestador
    const prestador = await User.findByPk(prestadorId);
    if (!prestador) {
      console.log("❌ Prestador no encontrado");
      return;
    }

    console.log(
      `✅ Prestador encontrado: ${prestador.nombre} (${prestador.email})\n`
    );

    // 2. Contar todos los brazaletes del prestador por estado
    const totalBrazaletes = await Brazalete.count({
      where: { prestador_id: prestadorId },
    });

    console.log(`📊 Total de brazaletes del prestador: ${totalBrazaletes}\n`);

    // 3. Contar por estado
    const estados = [
      "disponible",
      "asignado",
      "utilizado",
      "perdido",
      "dañado",
    ];

    console.log("📋 Brazaletes por estado:");
    for (const estado of estados) {
      const count = await Brazalete.count({
        where: {
          prestador_id: prestadorId,
          estado: estado,
        },
      });
      console.log(`   ${estado}: ${count}`);
    }

    // 4. Mostrar algunos ejemplos de brazaletes
    console.log("\n📋 Ejemplos de brazaletes del prestador:");
    const ejemplos = await Brazalete.findAll({
      where: { prestador_id: prestadorId },
      limit: 10,
      order: [["fecha_creacion", "ASC"]],
      attributes: [
        "id",
        "codigo",
        "estado",
        "fecha_creacion",
        "fecha_asignacion",
      ],
    });

    ejemplos.forEach((brazalete, index) => {
      console.log(
        `   ${index + 1}. ${brazalete.codigo} - Estado: ${brazalete.estado}`
      );
      console.log(`      Creado: ${brazalete.fecha_creacion}`);
      console.log(`      Asignado: ${brazalete.fecha_asignacion || "N/A"}`);
      console.log("");
    });

    // 5. Verificar la consulta que usa el controlador
    console.log("🔍 Probando la consulta del controlador...");
    const brazaletesDisponibles = await Brazalete.findAll({
      where: {
        prestador_id: prestadorId,
        estado: "disponible",
      },
      limit: 5,
      order: [["fecha_creacion", "ASC"]],
    });

    console.log(
      `📊 Brazaletes con estado "disponible": ${brazaletesDisponibles.length}`
    );

    if (brazaletesDisponibles.length > 0) {
      console.log("✅ Brazaletes disponibles encontrados:");
      brazaletesDisponibles.forEach((brazalete, index) => {
        console.log(
          `   ${index + 1}. ${brazalete.codigo} - Estado: ${brazalete.estado}`
        );
      });
    } else {
      console.log("❌ No se encontraron brazaletes con estado 'disponible'");
    }

    // 6. Verificar brazaletes con estado "asignado"
    console.log("\n🔍 Probando con estado 'asignado'...");
    const brazaletesAsignados = await Brazalete.findAll({
      where: {
        prestador_id: prestadorId,
        estado: "asignado",
      },
      limit: 5,
      order: [["fecha_creacion", "ASC"]],
    });

    console.log(
      `📊 Brazaletes con estado "asignado": ${brazaletesAsignados.length}`
    );

    if (brazaletesAsignados.length > 0) {
      console.log("✅ Brazaletes asignados encontrados:");
      brazaletesAsignados.forEach((brazalete, index) => {
        console.log(
          `   ${index + 1}. ${brazalete.codigo} - Estado: ${brazalete.estado}`
        );
      });
    }

    console.log("\n🎯 Conclusión:");
    if (brazaletesDisponibles.length > 0) {
      console.log("✅ El controlador debería funcionar correctamente");
    } else if (brazaletesAsignados.length > 0) {
      console.log(
        "⚠️ Los brazaletes están en estado 'asignado', no 'disponible'"
      );
      console.log("💡 Necesitamos corregir la consulta del controlador");
    } else {
      console.log("❌ No hay brazaletes para este prestador");
    }
  } catch (error) {
    console.error("❌ Error en la verificación:", error);
  } finally {
    process.exit(0);
  }
}

verificarBrazaletesPrestador();
