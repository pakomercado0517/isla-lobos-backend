import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { dbLogger } from "../utils/logger";

dotenv.config();

// Configuración de la base de datos
const sequelize = new Sequelize(process.env["DB_URL"] || "", {
  dialect: "postgres",
  // Logging con Pino en modo debug
  logging:
    process.env["NODE_ENV"] === "development"
      ? (msg: string) => dbLogger.debug(msg)
      : false,
  timezone: "America/Mexico_City", // Zona horaria de México
  dialectOptions: {
    timezone: "local", // Usar zona horaria local
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
});

// Función para probar la conexión
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    dbLogger.info("✅ Conexión a la base de datos establecida correctamente");
  } catch (error) {
    dbLogger.error({ err: error }, "❌ Error al conectar con la base de datos");
    throw error;
  }
};

// Función para sincronizar modelos (solo en desarrollo)
export const syncDatabase = async (): Promise<void> => {
  try {
    if (process.env["NODE_ENV"] === "development") {
      await sequelize.sync({ force: false });
      dbLogger.info("🔄 Base de datos sincronizada correctamente");
    }
  } catch (error) {
    dbLogger.error({ err: error }, "❌ Error al sincronizar la base de datos");
    throw error;
  }
};

export default sequelize;
