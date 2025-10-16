// ============================================================================
// Script de Prueba de Conexión SMTP
// ============================================================================

// IMPORTANTE: Cargar variables de entorno PRIMERO
require("dotenv").config();

const nodemailer = require("nodemailer");

async function testEmail() {
  console.log("\n🔍 Probando conexión SMTP...\n");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Leer variables de entorno
  const host = process.env.NODEMAILER_HOST;
  const port = process.env.NODEMAILER_PORT;
  const user = process.env.NODEMAILER_USER;
  const pass = process.env.NODEMAILER_PASS;

  // Mostrar configuración
  console.log("📋 Configuración leída del .env:");
  console.log(`   NODEMAILER_HOST: ${host || "❌ NO CONFIGURADO"}`);
  console.log(`   NODEMAILER_PORT: ${port || "❌ NO CONFIGURADO"}`);
  console.log(`   NODEMAILER_USER: ${user || "❌ NO CONFIGURADO"}`);
  console.log(
    `   NODEMAILER_PASS: ${
      pass
        ? "✅ Configurada (" + pass.length + " caracteres)"
        : "❌ NO CONFIGURADA"
    }`
  );
  console.log(
    "\n═══════════════════════════════════════════════════════════\n"
  );

  // Validar que todas las variables estén configuradas
  if (!host || !port || !user || !pass) {
    console.error("❌ ERROR: Faltan variables de entorno\n");
    console.log("💡 Verifica que tu archivo .env contenga:");
    console.log("   NODEMAILER_HOST=smtp.gmail.com");
    console.log("   NODEMAILER_PORT=587");
    console.log("   NODEMAILER_USER=tu-email@gmail.com");
    console.log("   NODEMAILER_PASS=tu_contraseña_de_aplicacion\n");
    process.exit(1);
  }

  const portNumber = parseInt(port);
  const config = {
    host,
    port: portNumber,
    secure: portNumber === 465, // true para 465 (SSL), false para 587 (TLS)
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // Permite certificados autofirmados
    },
  };

  console.log("📧 Configuración de Nodemailer:");
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Secure (SSL): ${config.secure}`);
  console.log(`   User: ${config.auth.user}`);
  console.log(`   Pass: ${"*".repeat(pass.length - 4)}${pass.slice(-4)}\n`);
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    // Crear transportador
    console.log("⏳ Creando transportador de Nodemailer...");
    const transporter = nodemailer.createTransport(config);
    console.log("✅ Transportador creado\n");

    // Verificar conexión
    console.log("⏳ Verificando conexión con el servidor SMTP...");
    await transporter.verify();
    console.log("✅ Conexión SMTP exitosa!\n");
    console.log(
      "═══════════════════════════════════════════════════════════\n"
    );

    // Enviar email de prueba
    console.log("📧 Enviando email de prueba...");
    const info = await transporter.sendMail({
      from: `"Isla Lobos 🏝️" <${config.auth.user}>`,
      to: config.auth.user,
      subject: "🏝️ Prueba de Email - Isla Lobos",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #00796b, #4caf50); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>🏝️ ¡Funciona!</h1>
          </div>
          <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #00796b;">✅ Configuración Exitosa</h2>
            <p>El servicio de email de <strong>Isla Lobos</strong> está configurado correctamente.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #00796b;">📋 Detalles de la Prueba:</h3>
              <ul style="list-style: none; padding: 0;">
                <li>🌐 <strong>Host:</strong> ${config.host}</li>
                <li>🔌 <strong>Puerto:</strong> ${config.port}</li>
                <li>📧 <strong>Email:</strong> ${config.auth.user}</li>
                <li>🔒 <strong>Seguro:</strong> ${
                  config.secure ? "SSL" : "TLS"
                }</li>
              </ul>
            </div>
            <p style="color: #666; font-size: 14px; text-align: center;">
              Sistema de Gestión CONANP - Isla de Lobos
            </p>
          </div>
        </div>
      `,
    });

    console.log("✅ Email enviado exitosamente!\n");
    console.log(
      "═══════════════════════════════════════════════════════════\n"
    );
    console.log("📊 Información del envío:");
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Respuesta: ${info.response}`);

    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    console.log(
      "\n═══════════════════════════════════════════════════════════"
    );
    console.log("🎉 ¡PRUEBA EXITOSA! El sistema de emails está listo.\n");
  } catch (error) {
    console.log(
      "═══════════════════════════════════════════════════════════\n"
    );
    console.error("❌ ERROR DE CONEXIÓN:\n");
    console.error(`   Código: ${error.code || "DESCONOCIDO"}`);
    console.error(`   Mensaje: ${error.message}`);
    if (error.command) {
      console.error(`   Comando: ${error.command}`);
    }
    console.log(
      "\n═══════════════════════════════════════════════════════════\n"
    );

    // Diagnóstico según el tipo de error
    if (
      error.code === "ESOCKET" ||
      error.code === "ECONNECTION" ||
      error.code === "ETIMEDOUT"
    ) {
      console.log("💡 PROBLEMA: No se puede conectar al servidor SMTP\n");
      console.log("📝 Posibles soluciones:");
      console.log("   1. ✅ Verifica que el HOST sea correcto:");
      console.log("      - Gmail: smtp.gmail.com");
      console.log("      - Outlook: smtp-mail.outlook.com");
      console.log("      - Ethereal: smtp.ethereal.email\n");
      console.log("   2. ✅ Verifica el PUERTO:");
      console.log("      - 587 para TLS (recomendado)");
      console.log("      - 465 para SSL\n");
      console.log("   3. ✅ Verifica tu firewall/antivirus");
      console.log("      - Permite conexiones salientes en puerto 587/465");
      console.log("      - Agrega Node.js a las excepciones\n");
      console.log("   4. ✅ Verifica tu conexión a Internet");
      console.log("      - Algunos ISPs bloquean puertos SMTP\n");
    }

    if (error.code === "EAUTH" || error.responseCode === 535) {
      console.log("💡 PROBLEMA: Error de autenticación\n");
      console.log("📝 Soluciones para Gmail:");
      console.log("   1. ✅ Usa una contraseña de aplicación:");
      console.log("      - Ve a: https://myaccount.google.com/apppasswords");
      console.log("      - Activa verificación en dos pasos");
      console.log('      - Genera contraseña para "Correo"');
      console.log(
        "      - Usa esa contraseña (16 caracteres) en NODEMAILER_PASS\n"
      );
      console.log("   2. ✅ NO uses tu contraseña normal de Gmail");
      console.log("   3. ✅ Verifica que el email sea correcto\n");
    }

    if (error.code === "EENVELOPE") {
      console.log("💡 PROBLEMA: Email del remitente inválido\n");
      console.log("📝 Solución:");
      console.log("   - Verifica que NODEMAILER_USER sea un email válido\n");
    }

    console.log(
      "═══════════════════════════════════════════════════════════\n"
    );
    console.log("📚 Documentación útil:");
    console.log("   - Nodemailer: https://nodemailer.com/");
    console.log(
      "   - Gmail SMTP: https://support.google.com/mail/answer/7126229"
    );
    console.log(
      "   - Contraseñas de aplicación: https://myaccount.google.com/apppasswords\n"
    );

    process.exit(1);
  }
}

// Ejecutar prueba
console.log("\n🏝️  ISLA LOBOS - Test de Configuración de Email");
console.log("═══════════════════════════════════════════════════════════\n");

testEmail().catch((error) => {
  console.error("Error inesperado:", error);
  process.exit(1);
});
