#!/usr/bin/env node

/**
 * Script para verificar los datos en la base de datos
 */

const { Sequelize } = require("sequelize");
const config = require("../config/database.js").development;

// Crear conexión a la base de datos
const sequelize = new Sequelize(config.url, config);

async function checkData() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida correctamente.\n");

    // Verificar usuarios
    const [users] = await sequelize.query(
      "SELECT COUNT(*) as count FROM users"
    );
    console.log(`👥 Usuarios en la base de datos: ${users[0].count}`);

    // Verificar invitaciones
    const [invitations] = await sequelize.query(
      "SELECT COUNT(*) as count FROM invitaciones"
    );
    console.log(`📧 Invitaciones en la base de datos: ${invitations[0].count}`);

    // Verificar embarcaciones
    const [embarcaciones] = await sequelize.query(
      "SELECT COUNT(*) as count FROM embarcaciones"
    );
    console.log(
      `🚢 Embarcaciones en la base de datos: ${embarcaciones[0].count}`
    );

    // Verificar bloques
    const [bloques] = await sequelize.query(
      "SELECT COUNT(*) as count FROM bloques"
    );
    console.log(`⏰ Bloques en la base de datos: ${bloques[0].count}`);

    // Verificar condiciones meteorológicas
    const [condiciones] = await sequelize.query(
      "SELECT COUNT(*) as count FROM condiciones_meteorologicas"
    );
    console.log(
      `🌊 Condiciones meteorológicas en la base de datos: ${condiciones[0].count}`
    );

    // Verificar salidas
    const [salidas] = await sequelize.query(
      "SELECT COUNT(*) as count FROM salidas"
    );
    console.log(`🚤 Salidas en la base de datos: ${salidas[0].count}`);

    // Mostrar algunos usuarios de ejemplo
    console.log("\n📋 Usuarios de ejemplo:");
    const [userExamples] = await sequelize.query(
      "SELECT nombre, email, rol, activo FROM users LIMIT 5"
    );
    userExamples.forEach((user) => {
      console.log(
        `   - ${user.nombre} (${user.email}) - ${user.rol} - ${
          user.activo ? "Activo" : "Inactivo"
        }`
      );
    });

    // Verificar si existe tabla de seeders
    const [seederTable] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SequelizeData'
      );
    `);

    if (seederTable[0].exists) {
      console.log("\n📊 Tabla de seeders encontrada:");
      const [seederData] = await sequelize.query(
        'SELECT * FROM "SequelizeData" ORDER BY name'
      );
      seederData.forEach((seeder) => {
        console.log(`   - ${seeder.name}`);
      });
    } else {
      console.log("\n⚠️  No se encontró tabla de seeders (SequelizeData)");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await sequelize.close();
  }
}

checkData();
