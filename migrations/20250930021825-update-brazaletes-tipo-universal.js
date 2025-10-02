"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Actualizar enum de tipo para lotes_brazaletes
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_lotes_brazaletes_tipo RENAME TO enum_lotes_brazaletes_tipo_old;
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE enum_lotes_brazaletes_tipo AS ENUM ('universal');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE lotes_brazaletes 
      ALTER COLUMN tipo TYPE enum_lotes_brazaletes_tipo 
      USING CASE 
        WHEN tipo IN ('isla', 'arrecife') THEN 'universal'::enum_lotes_brazaletes_tipo
        ELSE tipo::text::enum_lotes_brazaletes_tipo
      END;
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE enum_lotes_brazaletes_tipo_old;
    `);

    // Actualizar enum de tipo para brazaletes
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_brazaletes_tipo RENAME TO enum_brazaletes_tipo_old;
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE enum_brazaletes_tipo AS ENUM ('universal');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE brazaletes 
      ALTER COLUMN tipo TYPE enum_brazaletes_tipo 
      USING CASE 
        WHEN tipo IN ('isla', 'arrecife') THEN 'universal'::enum_brazaletes_tipo
        ELSE tipo::text::enum_brazaletes_tipo
      END;
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE enum_brazaletes_tipo_old;
    `);
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
