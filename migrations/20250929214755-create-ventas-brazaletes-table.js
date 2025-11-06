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

    // Crear índices para optimización (con verificación de existencia)
    const indices = [
      { campos: ["prestador_id"], nombre: "idx_ventas_brazaletes_prestador_id" },
      { campos: ["fecha_venta"], nombre: "idx_ventas_brazaletes_fecha_venta" },
      { campos: ["lote_id"], nombre: "idx_ventas_brazaletes_lote_id" },
      { campos: ["estado_pago"], nombre: "idx_ventas_brazaletes_estado_pago" },
    ];

    for (const indice of indices) {
      try {
        await queryInterface.addIndex("ventas_brazaletes", indice.campos, {
          name: indice.nombre,
        });
      } catch (error) {
        // Ignorar si el índice ya existe
        if (!error.message.includes("already exists")) {
          throw error;
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ventas_brazaletes");
  },
};
