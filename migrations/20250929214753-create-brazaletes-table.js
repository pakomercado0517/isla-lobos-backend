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

    // Crear índices para optimización
    await queryInterface.addIndex("brazaletes", ["estado"]);
    await queryInterface.addIndex("brazaletes", ["prestador_id"]);
    await queryInterface.addIndex("brazaletes", ["salida_id"]);
    await queryInterface.addIndex("brazaletes", ["tipo"]);
    await queryInterface.addIndex("brazaletes", ["fecha_uso"]);
    await queryInterface.addIndex("brazaletes", ["lote_id"]);
    await queryInterface.addIndex("brazaletes", ["codigo"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("brazaletes");
  },
};
