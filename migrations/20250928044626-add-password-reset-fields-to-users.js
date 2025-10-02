"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "password_reset_token", {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: "Token temporal para recuperación de contraseña",
    });

    await queryInterface.addColumn("users", "password_reset_expires", {
      type: Sequelize.DATE,
      allowNull: true,
      comment: "Fecha de expiración del token de recuperación",
    });

    // Agregar índice para el token de recuperación
    await queryInterface.addIndex("users", ["password_reset_token"], {
      name: "users_password_reset_token_index",
    });
  },

  async down(queryInterface, Sequelize) {
    // Eliminar índice
    await queryInterface.removeIndex(
      "users",
      "users_password_reset_token_index"
    );

    // Eliminar columnas
    await queryInterface.removeColumn("users", "password_reset_token");
    await queryInterface.removeColumn("users", "password_reset_expires");
  },
};
