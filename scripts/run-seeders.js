#!/usr/bin/env node

/**
 * Script para ejecutar todos los seeders en orden
 * Uso: node scripts/run-seeders.js
 */

const { execSync } = require("child_process");
const path = require("path");

console.log("🌱 Iniciando ejecución de seeders...\n");

const seeders = [
  "20241225000001-demo-users.js",
  "20241225000002-demo-invitations.js",
  "20241225000003-demo-embarcaciones.js",
  "20241225000004-demo-bloques.js",
  "20241225000005-demo-condiciones-meteorologicas.js",
  "20241225000006-demo-salidas.js",
];

try {
  // Ejecutar cada seeder en orden
  for (const seeder of seeders) {
    console.log(`📦 Ejecutando seeder: ${seeder}`);

    try {
      execSync(`npx sequelize-cli db:seed --seed ${seeder}`, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      console.log(`✅ Seeder ${seeder} ejecutado exitosamente\n`);
    } catch (error) {
      console.error(`❌ Error ejecutando seeder ${seeder}:`, error.message);
      throw error;
    }
  }

  console.log("🎉 ¡Todos los seeders ejecutados exitosamente!");
  console.log("\n📊 Datos de prueba creados:");
  console.log("   👥 5 usuarios (1 CONANP, 4 prestadores)");
  console.log("   📧 5 invitaciones (válidas, expiradas, usadas)");
  console.log("   🚢 6 embarcaciones (diferentes tipos y estados)");
  console.log("   ⏰ 21 bloques (7 días x 3 bloques)");
  console.log("   🌊 4 condiciones meteorológicas");
  console.log("   🚤 5 salidas (diferentes estados)");

  console.log("\n🔑 Credenciales de prueba:");
  console.log("   CONANP: admin@conanp.gob.mx / Admin123!");
  console.log("   Prestador: juan.perez@ejemplo.com / Prestador123!");
  console.log("   Prestador: maria.gonzalez@ejemplo.com / Prestador123!");
  console.log("   Prestador: carlos.rodriguez@ejemplo.com / Prestador123!");

  console.log("\n📝 Códigos de invitación válidos:");
  console.log("   PRESTADOR001, PRESTADOR002, CONANP001");
} catch (error) {
  console.error("\n❌ Error ejecutando seeders:", error.message);
  process.exit(1);
}

