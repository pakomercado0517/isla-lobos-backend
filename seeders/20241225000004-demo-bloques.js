"use strict";

const { randomUUID } = require("crypto");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Crear bloques para los próximos 7 días
    const bloques = [];
    const hoy = new Date();

    // Crear bloques para los próximos 7 días
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      const fechaStr = fecha.toISOString().split("T")[0]; // YYYY-MM-DD

      // 3 bloques por día
      const bloquesDelDia = [
        {
          id: randomUUID(),
          nombre: "Bloque Matutino",
          hora_inicio: "08:00:00",
          hora_fin: "10:00:00",
          capacidad_total: 65,
          capacidad_registrada: 0,
          estado: "activo",
          fecha: fechaStr,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: randomUUID(),
          nombre: "Bloque Intermedio",
          hora_inicio: "10:00:00",
          hora_fin: "12:00:00",
          capacidad_total: 65,
          capacidad_registrada: 0,
          estado: "activo",
          fecha: fechaStr,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: randomUUID(),
          nombre: "Bloque Vespertino",
          hora_inicio: "12:00:00",
          hora_fin: "14:00:00",
          capacidad_total: 65,
          capacidad_registrada: 0,
          estado: "activo",
          fecha: fechaStr,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Para el primer día, simular algunos bloques con ocupación
      if (i === 0) {
        bloquesDelDia[0].capacidad_registrada = 45; // Casi lleno
        bloquesDelDia[1].capacidad_registrada = 65; // Lleno
        bloquesDelDia[1].estado = "lleno";
        bloquesDelDia[2].capacidad_registrada = 20; // Disponible
      }

      // Para el segundo día, simular bloque suspendido por clima
      if (i === 1) {
        bloquesDelDia[0].estado = "suspendido_por_clima";
        bloquesDelDia[1].estado = "suspendido_por_clima";
        bloquesDelDia[2].estado = "suspendido_por_clima";
      }

      // Para el tercer día, simular bloque cerrado por capitanía
      if (i === 2) {
        bloquesDelDia[0].estado = "cerrado_capitaria";
        bloquesDelDia[1].estado = "cerrado_capitaria";
        bloquesDelDia[2].estado = "cerrado_capitaria";
      }

      bloques.push(...bloquesDelDia);
    }

    await queryInterface.bulkInsert("bloques", bloques, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("bloques", null, {});
  },
};

