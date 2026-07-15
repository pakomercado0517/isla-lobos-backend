"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 0. Hacer fecha nullable en bloques para permitir plantillas
    try {
      await queryInterface.changeColumn("bloques", "fecha", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    } catch (err) {
      console.log("⚠ Columna fecha en bloques ya fue actualizada");
    }

    // 1. Agregar campo destino (idempotente)
    try {
      const columnExists = await queryInterface.sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'salidas' AND column_name = 'destino';
      `);

      if (!columnExists || columnExists[0].length === 0) {
        await queryInterface.addColumn("salidas", "destino", {
          type: Sequelize.STRING(100),
          allowNull: false,
          defaultValue: "Isla de Lobos",
        });
      }
    } catch (err) {
      console.log("⚠ Columna destino ya existe en salidas");
    }

    // 2. Hacer bloque_id opcional (idempotente)
    try {
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
    } catch (err) {
      console.log("⚠ Columna bloque_id ya fue actualizada");
    }

    // 3. Agregar campo hora para destinos sin bloques (idempotente)
    try {
      const columnExists = await queryInterface.sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'salidas' AND column_name = 'hora';
      `);

      if (!columnExists || columnExists[0].length === 0) {
        await queryInterface.addColumn("salidas", "hora", {
          type: Sequelize.TIME,
          allowNull: true,
        });
      }
    } catch (err) {
      console.log("⚠ Columna hora ya existe en salidas");
    }

    // 4. Crear índice para optimizar búsquedas por destino (idempotente)
    try {
      await queryInterface.addIndex("salidas", ["destino"], {
        name: "idx_salidas_destino",
      });
    } catch (err) {
      console.log("⚠ Índice idx_salidas_destino ya existe");
    }

    // 5. Agregar constraint para validar que tenga bloque_id O hora (idempotente)
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE salidas
        ADD CONSTRAINT check_bloque_o_hora
        CHECK (
          (destino = 'Isla de Lobos' AND bloque_id IS NOT NULL) OR
          (destino != 'Isla de Lobos' AND hora IS NOT NULL)
        );
      `);
    } catch (err) {
      if (!err.message.includes("already exists")) {
        console.log(
          "⚠ Constraint check_bloque_o_hora ya existe o no se puede agregar",
        );
      }
    }
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
