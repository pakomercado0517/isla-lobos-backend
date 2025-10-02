"use strict";

const { randomUUID } = require("crypto");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Obtener datos necesarios para crear salidas
    const prestadores = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE rol = ? AND activo = true LIMIT 3",
      {
        replacements: ["prestador"],
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    const embarcaciones = await queryInterface.sequelize.query(
      "SELECT id, prestador_id FROM embarcaciones WHERE estado = ? LIMIT 3",
      {
        replacements: ["disponible"],
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    const bloques = await queryInterface.sequelize.query(
      "SELECT id FROM bloques WHERE estado = ? LIMIT 3",
      {
        replacements: ["activo"],
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    if (
      prestadores.length === 0 ||
      embarcaciones.length === 0 ||
      bloques.length === 0
    ) {
      throw new Error(
        "No se encontraron datos necesarios. Ejecuta primero los seeders de usuarios, embarcaciones y bloques."
      );
    }

    // Crear salidas de prueba
    const salidas = [
      {
        id: randomUUID(),
        prestador_id: prestadores[0].id,
        embarcacion_id: embarcaciones[0].id,
        bloque_id: bloques[0].id,
        fecha: new Date(),
        numero_pasajeros: 15,
        observaciones: "Salida de prueba con 15 pasajeros",
        estado: "programada",
        motivo_cancelacion: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        prestador_id: prestadores[1].id,
        embarcacion_id: embarcaciones[1].id,
        bloque_id: bloques[1].id,
        fecha: new Date(),
        numero_pasajeros: 25,
        observaciones: "Grupo familiar de 25 personas",
        estado: "en_curso",
        motivo_cancelacion: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        prestador_id: prestadores[2].id,
        embarcacion_id: embarcaciones[2].id,
        bloque_id: bloques[2].id,
        fecha: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        numero_pasajeros: 20,
        observaciones: "Salida completada exitosamente",
        estado: "completada",
        motivo_cancelacion: null,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        id: randomUUID(),
        prestador_id: prestadores[0].id,
        embarcacion_id: embarcaciones[0].id,
        bloque_id: bloques[0].id,
        fecha: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
        numero_pasajeros: 18,
        observaciones: "Cancelada por mal tiempo",
        estado: "cancelada_por_clima",
        motivo_cancelacion: "Oleaje alto y vientos fuertes",
        created_at: new Date(Date.now() - 25 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        prestador_id: prestadores[1].id,
        embarcacion_id: embarcaciones[1].id,
        bloque_id: bloques[1].id,
        fecha: new Date(Date.now() - 48 * 60 * 60 * 1000), // Hace 2 días
        numero_pasajeros: 12,
        observaciones: "Cancelada por decisión de capitanía",
        estado: "cancelada_capitaria",
        motivo_cancelacion: "Puerto cerrado por condiciones meteorológicas",
        created_at: new Date(Date.now() - 49 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
    ];

    await queryInterface.bulkInsert("salidas", salidas, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("salidas", null, {});
  },
};

