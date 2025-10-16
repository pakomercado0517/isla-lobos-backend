# 🚀 Guía de Instalación en Producción - Isla Lobos Backend

Esta guía te llevará paso a paso desde cero hasta tener la aplicación funcionando en producción.

---

## ✅ **Checklist de Pre-requisitos**

Antes de comenzar, asegúrate de tener:

- [ ] Servidor con Node.js 16+ instalado
- [ ] Base de datos PostgreSQL 12+ configurada
- [ ] Acceso al servidor (SSH)
- [ ] Dominio configurado (opcional)
- [ ] Certificado SSL (recomendado)

---

## 📦 **Paso 1: Clonar y Configurar el Proyecto**

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/isla-lobos-backend.git
cd isla-lobos-backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
nano .env  # o vim .env
```

### **Variables de Entorno Obligatorias**

```env
# Servidor
PORT=3000
NODE_ENV=production

# Base de Datos
DB_URL=postgresql://usuario:password@localhost:5432/isla_lobos_db

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura_cambiar_aqui
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=https://tu-dominio.com

# Frontend
FRONTEND_URL=https://tu-dominio.com

# Primer Admin (solo para setup inicial)
FIRST_ADMIN_EMAIL=admin@conanp.gob.mx
FIRST_ADMIN_PASSWORD=ContraseñaSegura123!
FIRST_ADMIN_NAME=Administrador CONANP
FIRST_ADMIN_PHONE=+52 55 1234 5678
```

---

## 🗄️ **Paso 2: Configurar Base de Datos**

```bash
# 1. Crear la base de datos (si no existe)
npm run db:create

# 2. Ejecutar migraciones
npm run db:migrate

# 3. Verificar que las tablas se crearon correctamente
psql -U postgres -d isla_lobos_db -c "\dt"
```

**Tablas esperadas:**

- `users`
- `embarcaciones`
- `bloques`
- `salidas`
- `condiciones_meteorologicas`
- `invitaciones`
- `lotes_brazaletes`
- `brazaletes`
- `ventas_brazaletes`

---

## 🔐 **Paso 3: Crear Primer Administrador**

```bash
# Ejecutar script de bootstrap
npm run create:admin
```

**Salida esperada:**

```
🔐 CREACIÓN DEL PRIMER ADMINISTRADOR CONANP

✓ Conexión a la base de datos establecida
✓ ¡Primer administrador creado exitosamente!

📋 CREDENCIALES DE ACCESO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Email:      admin@conanp.gob.mx
   Contraseña: ContraseñaSegura123!
   Rol:        CONANP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**⚠️ IMPORTANTE:**

1. Guarda estas credenciales en un lugar seguro
2. Cámbialas después del primer login
3. Elimina las variables `FIRST_ADMIN_*` del `.env` después de este paso

---

## 🏗️ **Paso 4: Compilar y Ejecutar**

```bash
# 1. Compilar TypeScript a JavaScript
npm run build

# 2. Verificar que la compilación fue exitosa
ls dist/

# 3. Probar la aplicación en modo producción
npm start
```

**Verificar que el servidor está funcionando:**

```bash
curl http://localhost:3000/health
```

**Respuesta esperada:**

```json
{
  "status": "OK",
  "message": "Servidor funcionando correctamente",
  "timestamp": "2025-10-14T10:30:00.000Z"
}
```

---

## 🔄 **Paso 5: Configurar PM2 (Recomendado)**

PM2 mantiene la aplicación corriendo y la reinicia automáticamente si falla.

```bash
# 1. Instalar PM2 globalmente
npm install -g pm2

# 2. Iniciar aplicación con PM2
pm2 start dist/index.js --name isla-lobos-backend

# 3. Configurar PM2 para iniciar al arrancar el servidor
pm2 startup
pm2 save

# 4. Ver logs
pm2 logs isla-lobos-backend

# 5. Ver estado
pm2 status
```

**Comandos útiles de PM2:**

```bash
pm2 restart isla-lobos-backend  # Reiniciar
pm2 stop isla-lobos-backend     # Detener
pm2 delete isla-lobos-backend   # Eliminar
pm2 monit                        # Monitor en tiempo real
```

---

## 🌐 **Paso 6: Configurar Nginx (Reverse Proxy)**

### **Instalar Nginx**

```bash
sudo apt update
sudo apt install nginx
```

### **Configurar Virtual Host**

```bash
sudo nano /etc/nginx/sites-available/isla-lobos
```

**Contenido del archivo:**

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Aumentar límites para archivos grandes
    client_max_body_size 10M;

    # Proxy pass a Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Logs
    access_log /var/log/nginx/isla-lobos-access.log;
    error_log /var/log/nginx/isla-lobos-error.log;
}
```

### **Activar y Reiniciar Nginx**

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/isla-lobos /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔒 **Paso 7: Configurar SSL con Let's Encrypt (HTTPS)**

```bash
# 1. Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# 2. Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# 3. Renovación automática
sudo certbot renew --dry-run
```

---

## ✅ **Paso 8: Verificar Instalación**

### **1. Health Check**

```bash
curl https://tu-dominio.com/health
```

### **2. Login con Admin**

```bash
curl -X POST https://tu-dominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@conanp.gob.mx",
    "password": "ContraseñaSegura123!"
  }'
```

**Respuesta esperada:**

```json
{
  "status": "success",
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "uuid-here",
      "nombre": "Administrador CONANP",
      "email": "admin@conanp.gob.mx",
      "rol": "conanp"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### **3. Cambiar Contraseña del Admin**

```bash
curl -X PUT https://tu-dominio.com/api/auth/change-password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "ContraseñaSegura123!",
    "newPassword": "NuevaContraseñaSegura456!"
  }'
```

---

## 🎯 **Paso 9: Configuración Post-Instalación**

### **1. Crear Invitaciones para Prestadores**

Desde el frontend o con Postman:

```bash
POST https://tu-dominio.com/api/invitaciones
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "email": "prestador@ejemplo.com",
  "rol": "prestador"
}
```

### **2. Enviar Invitación al Prestador**

El sistema generará un código único como `ABC123XYZ`. Envíalo al prestador por email o WhatsApp.

### **3. Prestador se Registra**

```bash
POST https://tu-dominio.com/api/auth/register
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "prestador@ejemplo.com",
  "password": "Prestador123!",
  "telefono": "2291234567",
  "codigo_invitacion": "ABC123XYZ"
}
```

---

## 📊 **Paso 10: Configurar Monitoreo (Opcional)**

### **Logs con PM2**

```bash
# Ver logs en tiempo real
pm2 logs isla-lobos-backend --lines 100

# Logs en archivo
pm2 logs isla-lobos-backend > logs.txt
```

### **Monitoreo de Sistema**

```bash
# Instalar htop para monitoreo
sudo apt install htop

# Ver uso de recursos
htop
```

### **Backups Automáticos de Base de Datos**

```bash
# Crear script de backup
nano /home/usuario/backup-db.sh
```

**Contenido:**

```bash
#!/bin/bash
BACKUP_DIR="/home/usuario/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="isla_lobos_backup_$DATE.sql"

pg_dump -U postgres isla_lobos_db > $BACKUP_DIR/$FILENAME

# Mantener solo los últimos 7 días
find $BACKUP_DIR -name "isla_lobos_backup_*.sql" -mtime +7 -delete

echo "Backup completado: $FILENAME"
```

**Hacer ejecutable y configurar cron:**

```bash
chmod +x /home/usuario/backup-db.sh

# Agregar a crontab (ejecutar diario a las 2 AM)
crontab -e
# Agregar: 0 2 * * * /home/usuario/backup-db.sh
```

---

## 🚨 **Troubleshooting**

### **Problema: Puerto 3000 ya está en uso**

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :3000

# Matar el proceso
sudo kill -9 <PID>
```

### **Problema: Base de datos no conecta**

```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Iniciar PostgreSQL
sudo systemctl start postgresql

# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-12-main.log
```

### **Problema: Nginx no sirve la aplicación**

```bash
# Verificar estado de Nginx
sudo systemctl status nginx

# Ver logs de error
sudo tail -f /var/log/nginx/isla-lobos-error.log

# Verificar que Node.js está corriendo
pm2 status
```

---

## 📞 **Soporte**

Si tienes problemas durante la instalación:

1. Revisa los logs: `pm2 logs isla-lobos-backend`
2. Verifica las variables de entorno en `.env`
3. Confirma que todas las dependencias están instaladas
4. Consulta la documentación completa en `documentation/`

---

## 🎉 **¡Instalación Completa!**

Tu aplicación Isla Lobos Backend está ahora:

- ✅ Instalada y configurada
- ✅ Corriendo en producción
- ✅ Con primer administrador creado
- ✅ Con SSL/HTTPS habilitado
- ✅ Con PM2 para alta disponibilidad
- ✅ Con Nginx como reverse proxy
- ✅ Lista para usar

---

**Próximos pasos recomendados:**

1. Configura el frontend y conéctalo al backend
2. Crea invitaciones para prestadores
3. Configura notificaciones de WhatsApp y Email
4. Realiza pruebas completas del sistema
5. Capacita a los usuarios en el uso de la plataforma

---

**Última actualización:** 14 de Octubre, 2025  
**Versión:** 1.0.0  
**Autor:** Equipo de Desarrollo Isla Lobos
