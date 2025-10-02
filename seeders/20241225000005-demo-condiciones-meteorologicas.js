"use strict";

const { randomUUID } = require("crypto");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Crear condiciones meteorológicas de prueba
    const condiciones = [
      {
        id: randomUUID(),
        fecha_hora: new Date(),
        oleaje: 1.2,
        viento_velocidad: 15.5,
        viento_direccion: "NE",
        visibilidad: "Buena",
        estado_puerto: "abierto",
        prediccion_5_dias:
          "Condiciones estables para los próximos 5 días. Oleaje entre 1.0-1.5m. Vientos del noreste 10-20 km/h. Visibilidad buena.",
        fuente: "CONAGUA",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        fecha_hora: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        oleaje: 2.1,
        viento_velocidad: 25.0,
        viento_direccion: "E",
        visibilidad: "Regular",
        estado_puerto: "restricciones",
        prediccion_5_dias:
          "Condiciones variables. Oleaje aumentando a 2.0-2.5m. Vientos del este 20-30 km/h. Posibles restricciones para embarcaciones menores.",
        fuente: "NOAA",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        fecha_hora: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
        oleaje: 0.8,
        viento_velocidad: 8.0,
        viento_direccion: "S",
        visibilidad: "Excelente",
        estado_puerto: "abierto",
        prediccion_5_dias:
          "Condiciones excelentes. Oleaje bajo 0.5-1.0m. Vientos suaves del sur 5-15 km/h. Visibilidad excelente.",
        fuente: "CONAGUA",
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        fecha_hora: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
        oleaje: 3.2,
        viento_velocidad: 35.0,
        viento_direccion: "N",
        visibilidad: "Mala",
        estado_puerto: "cerrado",
        prediccion_5_dias:
          "Condiciones adversas. Oleaje alto 3.0-4.0m. Vientos fuertes del norte 30-40 km/h. Puerto cerrado por seguridad.",
        fuente: "Capitanía de Puerto",
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    ];

    await queryInterface.bulkInsert(
      "condiciones_meteorologicas",
      condiciones,
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("condiciones_meteorologicas", null, {});
  },
};

