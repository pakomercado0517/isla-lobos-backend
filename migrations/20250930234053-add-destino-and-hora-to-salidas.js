"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 0. Hacer fecha nullable en bloques para permitir plantillas
    await queryInterface.changeColumn("bloques", "fecha", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    // 1. Agregar campo destino
    await queryInterface.addColumn("salidas", "destino", {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: "Isla de Lobos",
    });

    // 2. Hacer bloque_id opcional
    await queryInterface.changeColumn("salidas", "bloque_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "bloques",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // 3. Agregar campo hora para destinos sin bloques
    await queryInterface.addColumn("salidas", "hora", {
      type: Sequelize.TIME,
      allowNull: true,
    });

    // 4. Crear índice para optimizar búsquedas por destino
    await queryInterface.addIndex("salidas", ["destino"], {
      name: "idx_salidas_destino",
    });

    // 5. Agregar constraint para validar que tenga bloque_id O hora
    await queryInterface.sequelize.query(`
      ALTER TABLE salidas
      ADD CONSTRAINT check_bloque_o_hora
      CHECK (
        (destino = 'Isla de Lobos' AND bloque_id IS NOT NULL) OR
        (destino != 'Isla de Lobos' AND hora IS NOT NULL)
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revertir constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE salidas DROP CONSTRAINT IF EXISTS check_bloque_o_hora;
    `);

    // Revertir índice
    await queryInterface.removeIndex("salidas", "idx_salidas_destino");

    // Revertir campo hora
    await queryInterface.removeColumn("salidas", "hora");

    // Revertir bloque_id a obligatorio (solo si no hay datos que lo impidan)
    await queryInterface.changeColumn("salidas", "bloque_id", {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "bloques",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });

    // Revertir campo destino
    await queryInterface.removeColumn("salidas", "destino");

    // Revertir fecha a no nullable en bloques
    await queryInterface.changeColumn("bloques", "fecha", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },
};
