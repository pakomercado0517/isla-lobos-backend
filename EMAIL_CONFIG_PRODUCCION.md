# 📧 Configuración de Email para Producción - Isla Lobos

## ✅ **Configuración Actual Validada**

Tu configuración actual es **correcta** y está lista para producción:

```env
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587
NODEMAILER_USER=cashtrackrpako@gmail.com
NODEMAILER_PASS=zntzxxffsznitgbz
```

## 🔒 **Seguridad - Verificaciones Importantes**

### ✅ **Lo que está BIEN:**

- **Contraseña de aplicación**: `zntzxxffsznitgbz` (formato correcto, sin espacios)
- **Puerto TLS**: `587` (más seguro que 465)
- **Host Gmail**: `smtp.gmail.com` (oficial de Google)

### 🔐 **Recomendaciones de Seguridad:**

1. **Verificar 2FA habilitado** en `cashtrackrpako@gmail.com`
2. **Confirmar contraseña de aplicación** generada correctamente
3. **No compartir** estas credenciales en repositorios públicos
4. **Rotar contraseña** cada 6 meses

## 🚀 **Optimizaciones para Producción**

### **Variables Adicionales Recomendadas:**

```env
# Configuraciones adicionales para producción
NODEMAILER_TIMEOUT=60000
NODEMAILER_MAX_RETRIES=3
NODEMAILER_RETRY_DELAY=5000
NODEMAILER_POOL=true
NODEMAILER_MAX_CONNECTIONS=5
NODEMAILER_MAX_MESSAGES=100
```

### **Configuración Mejorada del EmailService:**

El servicio ya está optimizado con:

- ✅ **Pool de conexiones** para alta carga
- ✅ **Timeouts configurados** (30 segundos)
- ✅ **TLS seguro** habilitado
- ✅ **Manejo de errores** robusto
- ✅ **Logs detallados** para debugging

## 📊 **Límites de Gmail para Producción**

### **Límites Diarios:**

- **Usuarios normales**: 500 emails/día
- **Google Workspace**: 2,000 emails/día
- **Cuentas verificadas**: Hasta 10,000 emails/día

### **Límites por Minuto:**

- **Envío normal**: ~100 emails/minuto
- **Emails masivos**: ~50 emails/minuto (con pausas)

## 🧪 **Pruebas Recomendadas**

### **1. Test de Conexión:**

```bash
curl -X GET https://tu-dominio.com/api/emails/estado \
  -H "Authorization: Bearer <token_admin>"
```

### **2. Test de Envío:**

```bash
curl -X POST https://tu-dominio.com/api/emails/test \
  -H "Authorization: Bearer <token_admin>" \
  -H "Content-Type: application/json" \
  -d '{"email": "tu-email@ejemplo.com"}'
```

### **3. Test de Email Individual:**

```bash
curl -X POST https://tu-dominio.com/api/emails/enviar \
  -H "Authorization: Bearer <token_admin>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "asunto": "Test Producción",
    "mensaje": "Email de prueba desde producción",
    "tipo": "notificacion_general"
  }'
```

## 🔧 **Configuración en Servidor de Producción**

### **1. Variables de Entorno en .env:**

```env
# Email (ya configurado correctamente)
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587
NODEMAILER_USER=cashtrackrpako@gmail.com
NODEMAILER_PASS=zntzxxffsznitgbz

# Otras variables necesarias
NODE_ENV=production
PORT=3000
```

### **2. Verificar Configuración:**

```bash
# En el servidor de producción
pm2 logs isla-lobos-backend | grep "Email"
```

**Salida esperada:**

```
✅ Servicio de Email (Nodemailer) inicializado correctamente
```

## 📈 **Monitoreo en Producción**

### **Logs a Monitorear:**

```bash
# Ver logs de email
pm2 logs isla-lobos-backend --lines 100 | grep -i email

# Verificar errores de email
pm2 logs isline-lobos-backend | grep -i "error.*email"
```

### **Métricas Importantes:**

- ✅ **Tasa de éxito** de emails enviados
- ✅ **Tiempo de respuesta** del servidor SMTP
- ✅ **Errores de autenticación** o conexión
- ✅ **Límites de Gmail** alcanzados

## 🚨 **Troubleshooting Común**

### **Error: "Invalid login"**

- Verificar que la contraseña de aplicación sea correcta
- Confirmar que 2FA esté habilitado
- Regenerar contraseña de aplicación

### **Error: "Connection timeout"**

- Verificar conectividad de red
- Comprobar firewall del servidor
- Intentar con puerto 465 (SSL)

### **Error: "Daily limit exceeded"**

- Implementar rate limiting en el código
- Considerar upgrade a Google Workspace
- Distribuir emails en múltiples cuentas

## ✅ **Estado: Listo para Producción**

Tu configuración actual es **perfecta** para producción. Solo necesitas:

1. ✅ **Agregar las variables** al archivo `.env` del servidor
2. ✅ **Verificar conectividad** desde el servidor
3. ✅ **Probar envío** con el endpoint de test
4. ✅ **Monitorear logs** durante las primeras horas

## 📞 **Soporte**

Si tienes problemas:

1. Revisar logs: `pm2 logs isla-lobos-backend`
2. Verificar variables de entorno
3. Probar conexión SMTP manualmente
4. Consultar documentación de Gmail SMTP

---

**Última actualización:** 18 de Octubre, 2025  
**Estado:** ✅ Configuración validada y lista para producción
