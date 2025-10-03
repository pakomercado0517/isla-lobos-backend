const { Sequelize } = require("sequelize");
const User = require("../dist/models/User").default;

async function verificarUsuarios() {
  try {
    console.log("👥 Verificando usuarios en la base de datos...\n");

    const usuarios = await User.findAll({
      attributes: ["id", "nombre", "email", "rol", "activo"],
      order: [
        ["rol", "ASC"],
        ["nombre", "ASC"],
      ],
    });

    if (usuarios.length === 0) {
      console.log("❌ No hay usuarios en la base de datos");
      console.log("💡 Ejecuta: npm run seed:demo");
      return;
    }

    console.log(`📊 Total de usuarios: ${usuarios.length}\n`);

    const usuariosPorRol = usuarios.reduce((acc, user) => {
      if (!acc[user.rol]) acc[user.rol] = [];
      acc[user.rol].push(user);
      return acc;
    }, {});

    Object.keys(usuariosPorRol).forEach((rol) => {
      console.log(`🏷️ ${rol.toUpperCase()}:`);
      usuariosPorRol[rol].forEach((user) => {
        console.log(
          `  - ${user.nombre} (${user.email}) - ${
            user.activo ? "✅ Activo" : "❌ Inactivo"
          }`
        );
      });
      console.log("");
    });

    // Mostrar prestadores específicamente
    const prestadores = usuarios.filter((u) => u.rol === "prestador");
    if (prestadores.length > 0) {
      console.log("🚢 PRESTADORES DISPONIBLES PARA PRUEBAS:");
      prestadores.forEach((prestador) => {
        console.log(`  📧 Email: ${prestador.email}`);
        console.log(`  👤 Nombre: ${prestador.nombre}`);
        console.log(`  🆔 ID: ${prestador.id}`);
        console.log(`  ✅ Activo: ${prestador.activo ? "Sí" : "No"}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("❌ Error al verificar usuarios:", error);
  } finally {
    process.exit(0);
  }
}

verificarUsuarios();
