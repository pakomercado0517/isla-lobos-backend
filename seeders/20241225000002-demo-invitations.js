"use strict";

const { randomUUID } = require("crypto");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero necesitamos obtener el ID del usuario CONANP
    const adminUser = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = ?",
      {
        replacements: ["admin@conanp.gob.mx"],
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    if (adminUser.length === 0) {
      throw new Error(
        "Usuario administrador no encontrado. Ejecuta primero el seeder de usuarios."
      );
    }

    const adminId = adminUser[0].id;

    // Crear invitaciones de prueba
    const invitations = [
      {
        id: randomUUID(),
        codigo: "PRESTADOR001",
        email: "nuevo.prestador1@ejemplo.com",
        rol: "prestador",
        expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
        usada: false,
        creada_por: adminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        codigo: "PRESTADOR002",
        email: "nuevo.prestador2@ejemplo.com",
        rol: "prestador",
        expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
        usada: false,
        creada_por: adminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        codigo: "CONANP001",
        email: "nuevo.admin@conanp.gob.mx",
        rol: "conanp",
        expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
        usada: false,
        creada_por: adminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        codigo: "EXPIRADO001",
        email: "expirado@ejemplo.com",
        rol: "prestador",
        expira_en: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expirado hace 1 día
        usada: false,
        creada_por: adminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        codigo: "USADO001",
        email: "usado@ejemplo.com",
        rol: "prestador",
        expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
        usada: true, // Ya fue usada
        creada_por: adminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("invitaciones", invitations, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("invitaciones", null, {});
  },
};

