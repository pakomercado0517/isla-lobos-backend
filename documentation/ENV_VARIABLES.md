# Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de CORS
CORS_ORIGIN=http://localhost:3000

# Configuración de la base de datos PostgreSQL
DB_URL=postgresql://usuario:password@localhost:5432/isla_lobos_db

# Configuración JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
JWT_EXPIRES_IN=24h

# Configuración de email (para notificaciones)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion

# Configuración de WhatsApp (para notificaciones)
WHATSAPP_TOKEN=tu_token_de_whatsapp_business
WHATSAPP_PHONE_ID=tu_phone_id

# APIs externas
CONAGUA_API_KEY=tu_api_key_de_conagua
NOAA_API_KEY=tu_api_key_de_noaa
```

## Variables Obligatorias

- `DB_URL`: URL de conexión a PostgreSQL (ya configurada según mencionaste)
- `JWT_SECRET`: Clave secreta para firmar tokens JWT
- `NODE_ENV`: Entorno de ejecución (development/production)

## Variables Opcionales

- `PORT`: Puerto del servidor (default: 3000)
- `CORS_ORIGIN`: Origen permitido para CORS
- Las demás variables son para funcionalidades futuras (notificaciones, APIs externas)
