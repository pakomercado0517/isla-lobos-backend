const { Sequelize } = require("sequelize");
const Salida = require("../dist/models/Salida").default;
const Embarcacion = require("../dist/models/Embarcacion").default;
const Bloque = require("../dist/models/Bloque").default;
const User = require("../dist/models/User").default;

async function debugSalidaConflicto() {
  try {
    console.log("🔍 Investigando conflicto de salida...\n");

    // Parámetros de prueba (ajusta según tu caso)
    const embarcacionId = "tu-embarcacion-id"; // Cambia por el ID real
    const fecha = "2025-10-03"; // Cambia por la fecha real

    console.log(`📋 Buscando conflictos para:`);
    console.log(`🚢 Embarcación ID: ${embarcacionId}`);
    console.log(`📅 Fecha: ${fecha}\n`);

    // 1. Verificar si la embarcación existe
    console.log("1️⃣ Verificando embarcación...");
    const embarcacion = await Embarcacion.findByPk(embarcacionId, {
      include: [
        {
          model: User,
          as: "prestador",
          attributes: ["id", "nombre", "email"],
        },
      ],
    });

    if (!embarcacion) {
      console.log("❌ Embarcación no encontrada");
      return;
    }

    console.log("✅ Embarcación encontrada:");
    console.log(`   - Nombre: ${embarcacion.nombre}`);
    console.log(`   - Matrícula: ${embarcacion.matricula}`);
    console.log(`   - Capacidad: ${embarcacion.capacidad}`);
    console.log(`   - Estado: ${embarcacion.estado}`);
    console.log(`   - Prestador: ${embarcacion.prestador?.nombre}\n`);

    // 2. Buscar salidas existentes para esta embarcación
    console.log("2️⃣ Buscando salidas existentes...");
    const salidasExistentes = await Salida.findAll({
      where: {
        embarcacion_id: embarcacionId,
      },
      include: [
        {
          model: Bloque,
          as: "bloque",
          attributes: ["id", "nombre", "hora_inicio", "hora_fin"],
        },
        {
          model: User,
          as: "prestador",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["fecha", "DESC"]],
    });

    console.log(`📊 Total de salidas para esta embarcación: ${salidasExistentes.length}\n`);

    if (salidasExistentes.length > 0) {
      console.log("📋 Salidas existentes:");
      salidasExistentes.forEach((salida, index) => {
        console.log(`   ${index + 1}. ID: ${salida.id}`);
        console.log(`      Fecha: ${salida.fecha}`);
        console.log(`      Destino: ${salida.destino}`);
        console.log(`      Estado: ${salida.estado}`);
        console.log(`      Pasajeros: ${salida.numero_pasajeros}`);
        console.log(`      Bloque: ${salida.bloque?.nombre || "N/A"}`);
        console.log(`      Prestador: ${salida.prestador?.nombre}`);
        console.log("");
      });
    }

    // 3. Buscar conflictos específicos para la fecha
    console.log("3️⃣ Buscando conflictos para la fecha específica...");
    const fechaBusqueda = new Date(fecha);
    console.log(`📅 Fecha de búsqueda: ${fechaBusqueda.toISOString()}`);

    const conflictos = await Salida.findAll({
      where: {
        embarcacion_id: embarcacionId,
        fecha: fechaBusqueda,
        estado: {
          [Sequelize.Op.notIn]: [
            "cancelada",
            "cancelada_por_clima", 
            "cancelada_capitaria",
          ],
        },
      },
      include: [
        {
          model: Bloque,
          as: "bloque",
          attributes: ["id", "nombre"],
        },
      ],
    });

    console.log(`📊 Conflictos encontrados: ${conflictos.length}\n`);

    if (conflictos.length > 0) {
      console.log("⚠️ CONFLICTOS DETECTADOS:");
      conflictos.forEach((conflicto, index) => {
        console.log(`   ${index + 1}. ID: ${conflicto.id}`);
        console.log(`      Fecha: ${conflicto.fecha}`);
        console.log(`      Destino: ${conflicto.destino}`);
        console.log(`      Estado: ${conflicto.estado}`);
        console.log(`      Bloque: ${conflicto.bloque?.nombre || "N/A"}`);
        console.log(`      Pasajeros: ${conflicto.numero_pasajeros}`);
        console.log("");
      });
    } else {
      console.log("✅ No se encontraron conflictos para esta fecha");
    }

    // 4. Buscar con rango de fechas (por si hay problemas de timezone)
    console.log("4️⃣ Buscando con rango de fechas (timezone)...");
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    console.log(`📅 Rango: ${inicioDia.toISOString()} - ${finDia.toISOString()}`);

    const conflictosRango = await Salida.findAll({
      where: {
        embarcacion_id: embarcacionId,
        fecha: {
          [Sequelize.Op.between]: [inicioDia, finDia],
        },
        estado: {
          [Sequelize.Op.notIn]: [
            "cancelada",
            "cancelada_por_clima",
            "cancelada_capitaria",
          ],
        },
      },
      include: [
        {
          model: Bloque,
          as: "bloque",
          attributes: ["id", "nombre"],
        },
      ],
    });

    console.log(`📊 Conflictos en rango: ${conflictosRango.length}\n`);

    if (conflictosRango.length > 0) {
      console.log("⚠️ CONFLICTOS EN RANGO:");
      conflictosRango.forEach((conflicto, index) => {
        console.log(`   ${index + 1}. ID: ${conflicto.id}`);
        console.log(`      Fecha: ${conflicto.fecha}`);
        console.log(`      Destino: ${conflicto.destino}`);
        console.log(`      Estado: ${conflicto.estado}`);
        console.log(`      Bloque: ${conflicto.bloque?.nombre || "N/A"}`);
        console.log("");
      });
    }

    console.log("\n🎯 Resumen:");
    console.log(`- Salidas totales para embarcación: ${salidasExistentes.length}`);
    console.log(`- Conflictos exactos: ${conflictos.length}`);
    console.log(`- Conflictos en rango: ${conflictosRango.length}`);

  } catch (error) {
    console.error("❌ Error en la investigación:", error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  debugSalidaConflicto().catch(console.error);
}

module.exports = { debugSalidaConflicto };
