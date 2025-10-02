"use strict";

const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Crear usuarios de prueba con datos de permisos
    const hoy = new Date();
    const en30Dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
    const en15Dias = new Date(hoy.getTime() + 15 * 24 * 60 * 60 * 1000);
    const en7Dias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
    const hace5Dias = new Date(hoy.getTime() - 5 * 24 * 60 * 60 * 1000);

    const users = [
      {
        id: randomUUID(),
        nombre: "Administrador CONANP",
        email: "admin@conanp.gob.mx",
        password: await bcrypt.hash("Admin123!", 12),
        telefono: "+52 55 1234 5678",
        rol: "conanp",
        activo: true,
        // CONANP no tiene restricciones de permiso
        fecha_vencimiento_permiso: null,
        estado_permiso: "vigente",
        dias_notificacion: 30,
        ultima_notificacion: null,
        motivo_suspension: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        nombre: "Juan Pérez",
        email: "juan.perez@ejemplo.com",
        password: await bcrypt.hash("Prestador123!", 12),
        telefono: "+52 229 123 4567",
        rol: "prestador",
        activo: true,
        // Permiso vigente, vence en 30 días
        fecha_vencimiento_permiso: en30Dias,
        estado_permiso: "vigente",
        dias_notificacion: 30,
        ultima_notificacion: null,
        motivo_suspension: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        nombre: "María González",
        email: "maria.gonzalez@ejemplo.com",
        password: await bcrypt.hash("Prestador123!", 12),
        telefono: "+52 229 987 6543",
        rol: "prestador",
        activo: true,
        // Permiso próximo a vencer (15 días)
        fecha_vencimiento_permiso: en15Dias,
        estado_permiso: "por_vencer",
        dias_notificacion: 30,
        ultima_notificacion: new Date(hoy.getTime() - 2 * 24 * 60 * 60 * 1000), // Notificada hace 2 días
        motivo_suspension: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        nombre: "Carlos Rodríguez",
        email: "carlos.rodriguez@ejemplo.com",
        password: await bcrypt.hash("Prestador123!", 12),
        telefono: "+52 229 555 1234",
        rol: "prestador",
        activo: true,
        // Permiso muy próximo a vencer (7 días)
        fecha_vencimiento_permiso: en7Dias,
        estado_permiso: "por_vencer",
        dias_notificacion: 30,
        ultima_notificacion: new Date(hoy.getTime() - 1 * 24 * 60 * 60 * 1000), // Notificada ayer
        motivo_suspension: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        nombre: "Ana Martínez",
        email: "ana.martinez@ejemplo.com",
        password: await bcrypt.hash("Prestador123!", 12),
        telefono: "+52 229 777 8888",
        rol: "prestador",
        activo: false, // Usuario inactivo para pruebas
        // Permiso vencido hace 5 días
        fecha_vencimiento_permiso: hace5Dias,
        estado_permiso: "vencido",
        dias_notificacion: 30,
        ultima_notificacion: new Date(
          hace5Dias.getTime() + 1 * 24 * 60 * 60 * 1000
        ), // Notificada hace 4 días
        motivo_suspension: "Permiso vencido - requiere renovación",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("users", users, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  },
};
