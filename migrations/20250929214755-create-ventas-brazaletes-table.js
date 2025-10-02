"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ventas_brazaletes", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      prestador_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      lote_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "lotes_brazaletes",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      precio_unitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      fecha_venta: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      metodo_pago: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      estado_pago: {
        type: Sequelize.ENUM("pendiente", "pagado", "cancelado"),
        allowNull: false,
        defaultValue: "pendiente",
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Crear índices para optimización
    await queryInterface.addIndex("ventas_brazaletes", ["prestador_id"]);
    await queryInterface.addIndex("ventas_brazaletes", ["fecha_venta"]);
    await queryInterface.addIndex("ventas_brazaletes", ["lote_id"]);
    await queryInterface.addIndex("ventas_brazaletes", ["estado_pago"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ventas_brazaletes");
  },
};
