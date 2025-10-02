"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero, agregar el valor 'plantilla' al enum de estado si no existe
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'plantilla' 
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'enum_bloques_estado'
          )
        ) THEN
          ALTER TYPE enum_bloques_estado ADD VALUE 'plantilla';
        END IF;
      END $$;
    `);

    // Usar UUIDs fijos para los bloques predefinidos (para consistencia)
    // Insertar bloques predefinidos permanentes
    await queryInterface.bulkInsert("bloques", [
      {
        id: "11111111-1111-1111-1111-111111111111",
        nombre: "Bloque Matutino",
        hora_inicio: "08:00:00",
        hora_fin: "10:00:00",
        capacidad_total: 65,
        capacidad_registrada: 0,
        estado: "plantilla",
        fecha: null, // NULL indica que es una plantilla
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        nombre: "Bloque Mediodía",
        hora_inicio: "11:00:00",
        hora_fin: "13:00:00",
        capacidad_total: 65,
        capacidad_registrada: 0,
        estado: "plantilla",
        fecha: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        nombre: "Bloque Vespertino",
        hora_inicio: "14:00:00",
        hora_fin: "16:00:00",
        capacidad_total: 65,
        capacidad_registrada: 0,
        estado: "plantilla",
        fecha: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Eliminar bloques predefinidos por estado plantilla
    await queryInterface.bulkDelete("bloques", {
      estado: "plantilla",
    });

    // Nota: No eliminamos el valor 'plantilla' del enum porque podría estar en uso
    // y causaría errores. En producción, los enums no se deben modificar hacia atrás.
  },
};
