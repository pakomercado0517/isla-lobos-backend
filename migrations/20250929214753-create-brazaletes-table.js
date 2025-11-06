"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("brazaletes", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      codigo: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      tipo: {
        type: Sequelize.ENUM("isla", "arrecife"),
        allowNull: false,
      },
      estado: {
        type: Sequelize.ENUM("disponible", "asignado", "utilizado", "perdido"),
        allowNull: false,
        defaultValue: "disponible",
      },
      precio: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      fecha_creacion: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      fecha_asignacion: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      fecha_uso: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      prestador_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      salida_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "salidas",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      turista_nacionalidad: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      turista_edad: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 120,
        },
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
    const indices = [
      { campos: ["estado"], nombre: "idx_brazaletes_estado" },
      { campos: ["prestador_id"], nombre: "idx_brazaletes_prestador_id" },
      { campos: ["salida_id"], nombre: "idx_brazaletes_salida_id" },
      { campos: ["tipo"], nombre: "idx_brazaletes_tipo" },
      { campos: ["fecha_uso"], nombre: "idx_brazaletes_fecha_uso" },
      { campos: ["lote_id"], nombre: "idx_brazaletes_lote_id" },
      { campos: ["codigo"], nombre: "idx_brazaletes_codigo" },
    ];

    for (const indice of indices) {
      try {
        await queryInterface.addIndex("brazaletes", indice.campos, {
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
    await queryInterface.dropTable("brazaletes");
  },
};
