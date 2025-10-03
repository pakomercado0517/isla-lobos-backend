const axios = require("axios");

const BASE_URL = "http://localhost:3001/api";

// Credenciales de un prestador de prueba (ajusta según tus datos)
const prestadorCredentials = {
  email: "juan.perez@ejemplo.com", // Prestador activo de la base de datos
  password: "Prestador123!", // Contraseña correcta del seeder
};

async function obtenerTokenPrestador() {
  console.log("🔐 Obteniendo token de prestador...\n");

  try {
    const response = await axios.post(
      `${BASE_URL}/auth/login`,
      prestadorCredentials,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status === "success" && response.data.data.token) {
      console.log("✅ Token obtenido exitosamente:");
      console.log("🔑 Token:", response.data.data.token);
      console.log("👤 Usuario:", response.data.data.user.nombre);
      console.log("🏷️ Rol:", response.data.data.user.rol);

      console.log("\n📋 Para usar en Postman o scripts:");
      console.log(`Authorization: Bearer ${response.data.data.token}`);

      return response.data.data.token;
    } else {
      console.log("❌ No se pudo obtener el token");
      console.log("📝 Respuesta:", response.data);
    }
  } catch (error) {
    console.log("❌ Error al obtener token:");
    if (error.response) {
      console.log("📊 Status:", error.response.status);
      console.log(
        "📝 Response data:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.log("💥 Error de conexión:", error.message);
    }

    console.log("\n💡 Sugerencias:");
    console.log(
      "1. Verifica que el servidor esté corriendo en http://localhost:3000"
    );
    console.log("2. Ajusta las credenciales en el script");
    console.log("3. Verifica que el prestador exista en la base de datos");
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  obtenerTokenPrestador().catch(console.error);
}

module.exports = { obtenerTokenPrestador };
