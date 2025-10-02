"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "fecha_vencimiento_permiso", {
      type: Sequelize.DATE,
      allowNull: true,
      comment: "Fecha de vencimiento del permiso de operación",
    });

    await queryInterface.addColumn("users", "estado_permiso", {
      type: Sequelize.ENUM("vigente", "por_vencer", "vencido", "suspendido"),
      allowNull: false,
      defaultValue: "vigente",
      comment: "Estado actual del permiso",
    });

    await queryInterface.addColumn("users", "dias_notificacion", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 30,
      comment: "Días antes del vencimiento para enviar notificaciones",
    });

    await queryInterface.addColumn("users", "ultima_notificacion", {
      type: Sequelize.DATE,
      allowNull: true,
      comment: "Última fecha en que se envió notificación de vencimiento",
    });

    await queryInterface.addColumn("users", "motivo_suspension", {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Motivo de suspensión del permiso",
    });

    // Agregar índices para optimizar consultas
    await queryInterface.addIndex("users", ["estado_permiso"], {
      name: "idx_users_estado_permiso",
    });

    await queryInterface.addIndex("users", ["fecha_vencimiento_permiso"], {
      name: "idx_users_fecha_vencimiento_permiso",
    });

    await queryInterface.addIndex("users", ["ultima_notificacion"], {
      name: "idx_users_ultima_notificacion",
    });
  },

  async down(queryInterface, Sequelize) {
    // Eliminar índices primero
    await queryInterface.removeIndex("users", "idx_users_estado_permiso");
    await queryInterface.removeIndex(
      "users",
      "idx_users_fecha_vencimiento_permiso"
    );
    await queryInterface.removeIndex("users", "idx_users_ultima_notificacion");

    // Eliminar columnas
    await queryInterface.removeColumn("users", "motivo_suspension");
    await queryInterface.removeColumn("users", "ultima_notificacion");
    await queryInterface.removeColumn("users", "dias_notificacion");
    await queryInterface.removeColumn("users", "estado_permiso");
    await queryInterface.removeColumn("users", "fecha_vencimiento_permiso");

    // Eliminar el ENUM
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_users_estado_permiso";'
    );
  },
};
