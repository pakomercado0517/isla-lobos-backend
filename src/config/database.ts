import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Configuración de la base de datos
const sequelize = new Sequelize(process.env["DB_URL"] || "", {
  dialect: "postgres",
  // logging: process.env["NODE_ENV"] === "development" ? console.log : false,
  logging: false,
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
    console.log("✅ Conexión a la base de datos establecida correctamente.");
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
    throw error;
  }
};

// Función para sincronizar modelos (solo en desarrollo)
export const syncDatabase = async (): Promise<void> => {
  try {
    if (process.env["NODE_ENV"] === "development") {
      await sequelize.sync({ force: false });
      console.log("🔄 Base de datos sincronizada correctamente.");
    }
  } catch (error) {
    console.error("❌ Error al sincronizar la base de datos:", error);
    throw error;
  }
};

export default sequelize;
