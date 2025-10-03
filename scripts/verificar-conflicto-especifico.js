const { Sequelize } = require("sequelize");
const Salida = require("../dist/models/Salida").default;
const Embarcacion = require("../dist/models/Embarcacion").default;
const User = require("../dist/models/User").default;

async function verificarConflictoEspecifico() {
  try {
    console.log("🔍 Verificando conflicto específico...\n");

    // Datos exactos del frontend
    const embarcacionId = "c6790ee5-530f-4605-9035-3ba12acede3e";
    const fecha = "2025-10-09";
    const bloqueId = "e9b0b483-b983-47d8-af0c-6d81a962950b";

    console.log(`📋 Datos del frontend:`);
    console.log(`   Embarcación ID: ${embarcacionId}`);
    console.log(`   Fecha: ${fecha}`);
    console.log(`   Bloque ID: ${bloqueId}\n`);

    // 1. Verificar la embarcación
    console.log("1️⃣ Verificando embarcación...");
    const embarcacion = await Embarcacion.findByPk(embarcacionId);

    if (!embarcacion) {
      console.log("❌ Embarcación no encontrada");
      return;
    }

    console.log(`✅ Embarcación encontrada:`);
    console.log(`   Nombre: ${embarcacion.nombre}`);
    console.log(`   Matrícula: ${embarcacion.matricula}`);
    console.log(`   Estado: ${embarcacion.estado}`);
    console.log(`   Prestador ID: ${embarcacion.prestador_id}\n`);

    // 2. Buscar salidas existentes para esta embarcación en esta fecha
    console.log("2️⃣ Buscando salidas existentes...");

    // Usar la misma lógica del controlador corregido
    const fechaBusqueda = new Date(fecha + "T00:00:00.000Z");
    const inicioDia = new Date(fechaBusqueda);
    const finDia = new Date(fechaBusqueda);
    finDia.setUTCHours(23, 59, 59, 999);

    console.log(`📅 Rango de búsqueda:`);
    console.log(`   Inicio: ${inicioDia.toISOString()}`);
    console.log(`   Fin: ${finDia.toISOString()}\n`);

    const salidasExistentes = await Salida.findAll({
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
    });

    console.log(`📊 Salidas encontradas: ${salidasExistentes.length}`);

    if (salidasExistentes.length > 0) {
      console.log("🚨 CONFLICTOS ENCONTRADOS:");
      salidasExistentes.forEach((salida, index) => {
        console.log(`   ${index + 1}. ID: ${salida.id}`);
        console.log(`      Fecha: ${salida.fecha}`);
        console.log(`      Estado: ${salida.estado}`);
        console.log(`      Destino: ${salida.destino}`);
        console.log(`      Bloque ID: ${salida.bloque_id}`);
        console.log(`      Pasajeros: ${salida.numero_pasajeros}`);
        console.log(`      Observaciones: ${salida.observaciones || "N/A"}`);
        console.log("");
      });
    } else {
      console.log("✅ No hay conflictos - La salida se puede crear");
    }

    // 3. Verificar todas las salidas de esta embarcación
    console.log("3️⃣ Todas las salidas de esta embarcación:");
    const todasLasSalidas = await Salida.findAll({
      where: {
        embarcacion_id: embarcacionId,
      },
      order: [["fecha", "ASC"]],
    });

    console.log(`📊 Total de salidas: ${todasLasSalidas.length}`);
    todasLasSalidas.forEach((salida, index) => {
      const fechaSalida = new Date(salida.fecha);
      const fechaLocal = fechaSalida.toLocaleDateString();
      const fechaISO = fechaSalida.toISOString();

      console.log(`   ${index + 1}. Fecha: ${fechaLocal} (${fechaISO})`);
      console.log(
        `      Estado: ${salida.estado} - Destino: ${salida.destino}`
      );
      console.log(`      Bloque ID: ${salida.bloque_id}`);
      console.log(`      ID: ${salida.id}`);
      console.log("");
    });

    // 4. Verificar si hay salidas en el mismo bloque para la misma fecha
    console.log("4️⃣ Verificando salidas en el mismo bloque...");
    const salidasEnBloque = await Salida.findAll({
      where: {
        bloque_id: bloqueId,
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
    });

    console.log(`📊 Salidas en el mismo bloque: ${salidasEnBloque.length}`);
    if (salidasEnBloque.length > 0) {
      console.log("🚨 SALIDAS EN EL MISMO BLOQUE:");
      salidasEnBloque.forEach((salida, index) => {
        console.log(`   ${index + 1}. ID: ${salida.id}`);
        console.log(`      Embarcación ID: ${salida.embarcacion_id}`);
        console.log(`      Estado: ${salida.estado}`);
        console.log(`      Destino: ${salida.destino}`);
        console.log(`      Pasajeros: ${salida.numero_pasajeros}`);
        console.log("");
      });
    }

    // 5. Conclusión
    console.log("🎯 CONCLUSIÓN:");
    if (salidasExistentes.length > 0) {
      console.log("❌ NO SE PUEDE CREAR LA SALIDA");
      console.log(
        "💡 La embarcación ya tiene una salida programada para esta fecha"
      );
      console.log("🔧 Soluciones:");
      console.log("   1. Usar una embarcación diferente");
      console.log("   2. Usar una fecha diferente");
      console.log("   3. Cancelar la salida existente si ya no es válida");
    } else {
      console.log("✅ SE PUEDE CREAR LA SALIDA");
      console.log("💡 No hay conflictos detectados");
    }
  } catch (error) {
    console.error("❌ Error en la verificación:", error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verificarConflictoEspecifico().catch(console.error);
}

module.exports = { verificarConflictoEspecifico };
