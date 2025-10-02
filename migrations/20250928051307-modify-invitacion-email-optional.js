"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Modificar el campo email para permitir NULL
    await queryInterface.changeColumn("invitaciones", "email", {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: "Email del usuario que usará la invitación (opcional al crear)",
    });
  },

  async down(queryInterface, Sequelize) {
    // Revertir el cambio - hacer el email requerido nuevamente
    await queryInterface.changeColumn("invitaciones", "email", {
      type: Sequelize.STRING(255),
      allowNull: false,
      comment: "Email del usuario que usará la invitación",
    });
  },
};
