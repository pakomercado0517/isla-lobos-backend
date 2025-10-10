import sequelize from "../config/database";
import { dbLogger } from "../utils/logger";

// Importar todos los modelos
import User from "./User";
import Embarcacion from "./Embarcacion";
import Bloque from "./Bloque";
import Salida from "./Salida";
import CondicionMeteorologica from "./CondicionMeteorologica";
import Invitacion from "./Invitacion";
import LoteBrazalete from "./LoteBrazalete";
import Brazalete from "./Brazalete";
import VentaBrazalete from "./VentaBrazalete";

// Configurar las relaciones entre modelos

// Relación User -> Embarcacion (1:N)
User.hasMany(Embarcacion, {
  foreignKey: "prestador_id",
  as: "embarcaciones",
});

Embarcacion.belongsTo(User, {
  foreignKey: "prestador_id",
  as: "prestador",
});

// Relación User -> Salida (1:N)
User.hasMany(Salida, {
  foreignKey: "prestador_id",
  as: "salidas",
});

Salida.belongsTo(User, {
  foreignKey: "prestador_id",
  as: "prestador",
});

// Relación Embarcacion -> Salida (1:N)
Embarcacion.hasMany(Salida, {
  foreignKey: "embarcacion_id",
  as: "salidas",
});

Salida.belongsTo(Embarcacion, {
  foreignKey: "embarcacion_id",
  as: "embarcacion",
});

// Relación Bloque -> Salida (1:N)
Bloque.hasMany(Salida, {
  foreignKey: "bloque_id",
  as: "salidas",
});

Salida.belongsTo(Bloque, {
  foreignKey: "bloque_id",
  as: "bloque",
});

// Relación User -> Invitacion (1:N) - Usuario que crea la invitación
User.hasMany(Invitacion, {
  foreignKey: "creada_por",
  as: "invitaciones_creadas",
});

Invitacion.belongsTo(User, {
  foreignKey: "creada_por",
  as: "creador",
});

// Relación LoteBrazalete -> Brazalete (1:N)
LoteBrazalete.hasMany(Brazalete, {
  foreignKey: "lote_id",
  as: "brazaletes",
});

Brazalete.belongsTo(LoteBrazalete, {
  foreignKey: "lote_id",
  as: "lote",
});

// Relación User -> Brazalete (1:N) - Prestador que compró el brazalete
User.hasMany(Brazalete, {
  foreignKey: "prestador_id",
  as: "brazaletes",
});

Brazalete.belongsTo(User, {
  foreignKey: "prestador_id",
  as: "prestador",
});

// Relación Salida -> Brazalete (1:N) - Brazaletes usados en una salida
Salida.hasMany(Brazalete, {
  foreignKey: "salida_id",
  as: "brazaletes_utilizados",
});

Brazalete.belongsTo(Salida, {
  foreignKey: "salida_id",
  as: "salida",
});

// Relación User -> VentaBrazalete (1:N) - Prestador que compró
User.hasMany(VentaBrazalete, {
  foreignKey: "prestador_id",
  as: "ventas_brazaletes",
});

VentaBrazalete.belongsTo(User, {
  foreignKey: "prestador_id",
  as: "prestador",
});

// Relación LoteBrazalete -> VentaBrazalete (1:N) - Lote vendido
LoteBrazalete.hasMany(VentaBrazalete, {
  foreignKey: "lote_id",
  as: "ventas",
});

VentaBrazalete.belongsTo(LoteBrazalete, {
  foreignKey: "lote_id",
  as: "lote",
});

// Exportar todos los modelos y la instancia de sequelize
export {
  sequelize,
  User,
  Embarcacion,
  Bloque,
  Salida,
  CondicionMeteorologica,
  Invitacion,
  LoteBrazalete,
  Brazalete,
  VentaBrazalete,
};

// Función para sincronizar todos los modelos
export const syncModels = async (): Promise<void> => {
  try {
    if (process.env["NODE_ENV"] === "development") {
      await sequelize.sync({ force: false });
      dbLogger.info("✅ Todos los modelos sincronizados correctamente");
    }
  } catch (error) {
    dbLogger.error({ err: error }, "❌ Error al sincronizar modelos");
    throw error;
  }
};
