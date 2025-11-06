"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("lotes_brazaletes", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      numero_lote: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      cantidad_total: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      cantidad_disponibles: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      cantidad_vendidos: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      cantidad_utilizados: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      tipo: {
        type: Sequelize.ENUM("isla", "arrecife"),
        allowNull: false,
      },
      fecha_compra: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      fecha_vencimiento: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      costo_unitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      precio_venta: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      proveedor: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM("activo", "agotado", "vencido", "cancelado"),
        allowNull: false,
        defaultValue: "activo",
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
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Crear índices para optimización (con verificación de existencia)
    try {
      await queryInterface.addIndex("lotes_brazaletes", ["tipo"], {
        name: "idx_lotes_brazaletes_tipo",
      });
    } catch (error) {
      // Ignorar si el índice ya existe
      if (!error.message.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.addIndex("lotes_brazaletes", ["estado"], {
        name: "idx_lotes_brazaletes_estado",
      });
    } catch (error) {
      if (!error.message.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.addIndex("lotes_brazaletes", ["fecha_compra"], {
        name: "idx_lotes_brazaletes_fecha_compra",
      });
    } catch (error) {
      if (!error.message.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.addIndex("lotes_brazaletes", ["numero_lote"], {
        name: "idx_lotes_brazaletes_numero_lote",
      });
    } catch (error) {
      if (!error.message.includes("already exists")) {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("lotes_brazaletes");
  },
};
