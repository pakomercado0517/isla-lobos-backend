"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hacer el campo fecha nullable para permitir bloques plantilla
    await queryInterface.changeColumn("bloques", "fecha", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revertir a no nullable (solo si no hay datos que lo impidan)
    await queryInterface.changeColumn("bloques", "fecha", {
      type: Sequelize.DATE,
      allowNull: false,
    });
  },
};
