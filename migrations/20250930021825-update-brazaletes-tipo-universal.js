"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Nota: Esta migración es idempotente. Si ya fue ejecutada, se ejecutará sin error.

    // Actualizar enum de tipo para lotes_brazaletes
    try {
      // Verificar si el tipo actual existe
      const typeExists = await queryInterface.sequelize.query(`
        SELECT 1 FROM pg_type WHERE typname = 'enum_lotes_brazaletes_tipo';
      `);

      if (typeExists && typeExists[0].length > 0) {
        // Verificar si ya fue renombrado
        const oldTypeExists = await queryInterface.sequelize.query(`
          SELECT 1 FROM pg_type WHERE typname = 'enum_lotes_brazaletes_tipo_old';
        `);

        if (!oldTypeExists || oldTypeExists[0].length === 0) {
          // Renombrar solo si el viejo no existe
          await queryInterface.sequelize.query(`
            ALTER TYPE enum_lotes_brazaletes_tipo RENAME TO enum_lotes_brazaletes_tipo_old;
          `);
        }
      }

      // Crear el nuevo tipo si no existe
      const newTypeExists = await queryInterface.sequelize.query(`
        SELECT 1 FROM pg_type WHERE typname = 'enum_lotes_brazaletes_tipo';
      `);

      if (!newTypeExists || newTypeExists[0].length === 0) {
        await queryInterface.sequelize.query(`
          CREATE TYPE enum_lotes_brazaletes_tipo AS ENUM ('universal');
        `);
      }

      // Cambiar el tipo de la columna
      await queryInterface.sequelize.query(`
        ALTER TABLE lotes_brazaletes 
        ALTER COLUMN tipo TYPE enum_lotes_brazaletes_tipo 
        USING CASE 
          WHEN tipo IN ('isla', 'arrecife') THEN 'universal'::enum_lotes_brazaletes_tipo
          ELSE 'universal'::enum_lotes_brazaletes_tipo
        END;
      `);

      // Limpiar el tipo viejo si existe
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_lotes_brazaletes_tipo_old CASCADE;
      `);
    } catch (err) {
      console.log(`⚠ Error en lotes_brazaletes enum update: ${err.message}`);
    }

    // Actualizar enum de tipo para brazaletes
    try {
      // Verificar si el tipo actual existe
      const typeExists = await queryInterface.sequelize.query(`
        SELECT 1 FROM pg_type WHERE typname = 'enum_brazaletes_tipo';
      `);

      if (typeExists && typeExists[0].length > 0) {
        // Verificar si ya fue renombrado
        const oldTypeExists = await queryInterface.sequelize.query(`
          SELECT 1 FROM pg_type WHERE typname = 'enum_brazaletes_tipo_old';
        `);

        if (!oldTypeExists || oldTypeExists[0].length === 0) {
          // Renombrar solo si el viejo no existe
          await queryInterface.sequelize.query(`
            ALTER TYPE enum_brazaletes_tipo RENAME TO enum_brazaletes_tipo_old;
          `);
        }
      }

      // Crear el nuevo tipo si no existe
      const newTypeExists = await queryInterface.sequelize.query(`
        SELECT 1 FROM pg_type WHERE typname = 'enum_brazaletes_tipo';
      `);

      if (!newTypeExists || newTypeExists[0].length === 0) {
        await queryInterface.sequelize.query(`
          CREATE TYPE enum_brazaletes_tipo AS ENUM ('universal');
        `);
      }

      // Cambiar el tipo de la columna
      await queryInterface.sequelize.query(`
        ALTER TABLE brazaletes 
        ALTER COLUMN tipo TYPE enum_brazaletes_tipo 
        USING CASE 
          WHEN tipo IN ('isla', 'arrecife') THEN 'universal'::enum_brazaletes_tipo
          ELSE 'universal'::enum_brazaletes_tipo
        END;
      `);

      // Limpiar el tipo viejo si existe
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_brazaletes_tipo_old CASCADE;
      `);
    } catch (err) {
      console.log(`⚠ Error en brazaletes enum update: ${err.message}`);
    }
  },

  async down(queryInterface, Sequelize) {
    // Revertir enum de tipo para lotes_brazaletes
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_lotes_brazaletes_tipo RENAME TO enum_lotes_brazaletes_tipo_new;
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE enum_lotes_brazaletes_tipo AS ENUM ('isla', 'arrecife');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE lotes_brazaletes 
      ALTER COLUMN tipo TYPE enum_lotes_brazaletes_tipo 
      USING 'isla'::enum_lotes_brazaletes_tipo;
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE enum_lotes_brazaletes_tipo_new;
    `);

    // Revertir enum de tipo para brazaletes
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_brazaletes_tipo RENAME TO enum_brazaletes_tipo_new;
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE enum_brazaletes_tipo AS ENUM ('isla', 'arrecife');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE brazaletes 
      ALTER COLUMN tipo TYPE enum_brazaletes_tipo 
      USING 'isla'::enum_brazaletes_tipo;
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE enum_brazaletes_tipo_new;
    `);
  },
};
