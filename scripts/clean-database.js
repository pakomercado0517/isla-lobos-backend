const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: "postgres",
  timezone: "America/Mexico_City",
  dialectOptions: {
    timezone: "local",
  },
});

async function cleanDatabase() {
  try {
    console.log("🧹 Limpiando base de datos...");

    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log("✅ Conexión establecida");

    // Obtener todas las tablas
    const [tables] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename != 'SequelizeMeta'
    `);

    if (tables.length === 0) {
      console.log("📭 No hay tablas para eliminar");
      return;
    }

    // Deshabilitar restricciones de clave foránea temporalmente
    await sequelize.query("SET session_replication_role = replica;");

    // Eliminar todas las tablas
    for (const table of tables) {
      console.log(`🗑️  Eliminando tabla: ${table.tablename}`);
      await sequelize.query(
        `DROP TABLE IF EXISTS "${table.tablename}" CASCADE;`
      );
    }

    // Rehabilitar restricciones de clave foránea
    await sequelize.query("SET session_replication_role = DEFAULT;");

    console.log("✅ Base de datos limpiada correctamente");
  } catch (error) {
    console.error("❌ Error al limpiar la base de datos:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanDatabase()
    .then(() => {
      console.log("🎉 Proceso completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Error:", error);
      process.exit(1);
    });
}

module.exports = cleanDatabase;
