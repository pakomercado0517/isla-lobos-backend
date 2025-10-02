#!/usr/bin/env node

/**
 * Script para limpiar todos los datos de prueba
 * Uso: node scripts/clean-seeders.js
 */

const { execSync } = require("child_process");

console.log("🧹 Limpiando datos de prueba...\n");

const seeders = [
  "20241225000006-demo-salidas.js",
  "20241225000005-demo-condiciones-meteorologicas.js",
  "20241225000004-demo-bloques.js",
  "20241225000003-demo-embarcaciones.js",
  "20241225000002-demo-invitations.js",
  "20241225000001-demo-users.js",
];

try {
  // Ejecutar cada seeder en orden inverso para limpiar
  for (const seeder of seeders) {
    console.log(`🗑️  Limpiando seeder: ${seeder}`);

    try {
      execSync(`npx sequelize-cli db:seed:undo --seed ${seeder}`, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      console.log(`✅ Seeder ${seeder} limpiado exitosamente\n`);
    } catch (error) {
      console.error(`❌ Error limpiando seeder ${seeder}:`, error.message);
      throw error;
    }
  }

  console.log("🎉 ¡Todos los datos de prueba han sido limpiados!");
} catch (error) {
  console.error("\n❌ Error limpiando seeders:", error.message);
  process.exit(1);
}

