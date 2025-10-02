"use strict";

const { randomUUID } = require("crypto");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Obtener IDs de los prestadores
    const prestadores = await queryInterface.sequelize.query(
      "SELECT id, nombre FROM users WHERE rol = ? AND activo = true",
      {
        replacements: ["prestador"],
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    if (prestadores.length === 0) {
      throw new Error(
        "No se encontraron prestadores. Ejecuta primero el seeder de usuarios."
      );
    }

    // Crear embarcaciones de prueba
    const embarcaciones = [
      // Embarcaciones de Juan Pérez
      {
        id: randomUUID(),
        nombre: "Lobos Express",
        matricula: "VER-001-ABC",
        capacidad: 25,
        tipo: "menor",
        estado: "disponible",
        prestador_id: prestadores[0].id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        nombre: "Isla Dorada",
        matricula: "VER-002-DEF",
        capacidad: 40,
        tipo: "mayor",
        estado: "disponible",
        prestador_id: prestadores[0].id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Embarcaciones de María González
      {
        id: randomUUID(),
        nombre: "Mar Azul",
        matricula: "VER-003-GHI",
        capacidad: 30,
        tipo: "menor",
        estado: "disponible",
        prestador_id: prestadores[1].id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        nombre: "Océano Verde",
        matricula: "VER-004-JKL",
        capacidad: 50,
        tipo: "mayor",
        estado: "en_uso",
        prestador_id: prestadores[1].id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Embarcaciones de Carlos Rodríguez
      {
        id: randomUUID(),
        nombre: "Viento Libre",
        matricula: "VER-005-MNO",
        capacidad: 20,
        tipo: "menor",
        estado: "disponible",
        prestador_id: prestadores[2].id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        nombre: "Sol del Caribe",
        matricula: "VER-006-PQR",
        capacidad: 35,
        tipo: "menor",
        estado: "mantenimiento",
        prestador_id: prestadores[2].id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("embarcaciones", embarcaciones, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("embarcaciones", null, {});
  },
};

