const { Sequelize } = require("sequelize");
const Salida = require("../dist/models/Salida").default;
const Bloque = require("../dist/models/Bloque").default;
const LoteBrazalete = require("../dist/models/LoteBrazalete").default;
const Brazalete = require("../dist/models/Brazalete").default;
const VentaBrazalete = require("../dist/models/VentaBrazalete").default;
const CondicionMeteorologica =
  require("../dist/models/CondicionMeteorologica").default;
const Invitacion = require("../dist/models/Invitacion").default;

async function limpiarDatosCompleto() {
  try {
    console.log(
      "🧹 Limpiando base de datos (manteniendo usuarios y embarcaciones)...\n"
    );

    // 1. Eliminar todas las salidas
    console.log("🗑️ Eliminando todas las salidas...");
    const salidasEliminadas = await Salida.destroy({
      where: {},
      truncate: true,
      cascade: true,
    });
    console.log(`✅ ${salidasEliminadas} salidas eliminadas\n`);

    // 2. Eliminar todas las ventas de brazaletes (primero, no tiene dependencias)
    console.log("🗑️ Eliminando todas las ventas de brazaletes...");
    const ventasEliminadas = await VentaBrazalete.destroy({
      where: {},
    });
    console.log(`✅ ${ventasEliminadas} ventas de brazaletes eliminadas\n`);

    // 3. Eliminar todos los brazaletes (segundo, depende de lotes)
    console.log("🗑️ Eliminando todos los brazaletes...");
    const brazaletesEliminados = await Brazalete.destroy({
      where: {},
    });
    console.log(`✅ ${brazaletesEliminados} brazaletes eliminados\n`);

    // 4. Eliminar todos los lotes de brazaletes (tercero, no tiene dependencias)
    console.log("🗑️ Eliminando todos los lotes de brazaletes...");
    const lotesEliminados = await LoteBrazalete.destroy({
      where: {},
    });
    console.log(`✅ ${lotesEliminados} lotes de brazaletes eliminados\n`);

    // 5. Eliminar bloques con fecha específica (no plantillas)
    console.log("🗑️ Eliminando bloques con fecha específica...");
    const bloquesEliminados = await Bloque.destroy({
      where: {
        fecha: { [Sequelize.Op.ne]: null },
      },
    });
    console.log(`✅ ${bloquesEliminados} bloques con fecha eliminados\n`);

    // 6. Eliminar condiciones meteorológicas
    console.log("🗑️ Eliminando condiciones meteorológicas...");
    const condicionesEliminadas = await CondicionMeteorologica.destroy({
      where: {},
    });
    console.log(
      `✅ ${condicionesEliminadas} condiciones meteorológicas eliminadas\n`
    );

    // 7. Eliminar invitaciones
    console.log("🗑️ Eliminando invitaciones...");
    const invitacionesEliminadas = await Invitacion.destroy({
      where: {},
    });
    console.log(`✅ ${invitacionesEliminadas} invitaciones eliminadas\n`);

    // 8. Verificar plantillas de bloques restantes
    console.log("📋 Verificando plantillas de bloques...");
    const plantillas = await Bloque.findAll({
      where: { fecha: null },
      order: [["hora_inicio", "ASC"]],
    });
    console.log(`✅ Plantillas restantes: ${plantillas.length}`);
    plantillas.forEach((plantilla, index) => {
      console.log(
        `   ${index + 1}. ${plantilla.nombre} (${plantilla.hora_inicio} - ${
          plantilla.hora_fin
        })`
      );
    });
    console.log("");

    // 9. Verificar usuarios restantes
    console.log("👥 Verificando usuarios restantes...");
    const User = require("../dist/models/User").default;
    const usuarios = await User.findAll({
      attributes: ["id", "nombre", "email", "rol", "activo"],
      order: [["nombre", "ASC"]],
    });
    console.log(`✅ Usuarios restantes: ${usuarios.length}`);
    usuarios.forEach((usuario, index) => {
      console.log(
        `   ${index + 1}. ${usuario.nombre} (${usuario.email}) - Rol: ${
          usuario.rol
        } - Activo: ${usuario.activo}`
      );
    });
    console.log("");

    // 10. Verificar embarcaciones restantes
    console.log("🚢 Verificando embarcaciones restantes...");
    const Embarcacion = require("../dist/models/Embarcacion").default;
    const embarcaciones = await Embarcacion.findAll({
      attributes: [
        "id",
        "nombre",
        "matricula",
        "tipo",
        "capacidad",
        "estado",
        "prestador_id",
      ],
      order: [["nombre", "ASC"]],
    });
    console.log(`✅ Embarcaciones restantes: ${embarcaciones.length}`);
    embarcaciones.forEach((embarcacion, index) => {
      console.log(
        `   ${index + 1}. ${embarcacion.nombre} (${
          embarcacion.matricula
        }) - Tipo: ${embarcacion.tipo} - Estado: ${embarcacion.estado}`
      );
    });
    console.log("");

    // 11. Verificar que no queden datos de prueba
    console.log("🔍 Verificación final...");
    const salidasRestantes = await Salida.count();
    const brazaletesRestantes = await Brazalete.count();
    const bloquesConFechaRestantes = await Bloque.count({
      where: { fecha: { [Sequelize.Op.ne]: null } },
    });

    console.log(`📊 Salidas restantes: ${salidasRestantes}`);
    console.log(`📊 Brazaletes restantes: ${brazaletesRestantes}`);
    console.log(
      `📊 Bloques con fecha restantes: ${bloquesConFechaRestantes}\n`
    );

    if (
      salidasRestantes === 0 &&
      brazaletesRestantes === 0 &&
      bloquesConFechaRestantes === 0
    ) {
      console.log("🎉 ¡Limpieza completada exitosamente!");
      console.log("💡 Base de datos lista para nuevas pruebas");
      console.log("📋 Datos conservados:");
      console.log("   ✅ Usuarios (CONANP y Prestadores)");
      console.log("   ✅ Embarcaciones");
      console.log("   ✅ Plantillas de bloques");
      console.log("🗑️ Datos eliminados:");
      console.log("   ❌ Salidas");
      console.log("   ❌ Brazaletes");
      console.log("   ❌ Lotes de brazaletes");
      console.log("   ❌ Ventas de brazaletes");
      console.log("   ❌ Bloques con fecha específica");
      console.log("   ❌ Condiciones meteorológicas");
      console.log("   ❌ Invitaciones");
    } else {
      console.log("⚠️ Algunos datos no se eliminaron correctamente");
    }
  } catch (error) {
    console.error("❌ Error al limpiar datos:", error);
  } finally {
    process.exit(0);
  }
}

limpiarDatosCompleto();
