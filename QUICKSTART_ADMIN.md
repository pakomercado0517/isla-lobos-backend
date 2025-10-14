# ⚡ Guía Rápida: Crear Primer Admin en 2 Minutos

## 🎯 Para el Cliente (Producción)

### **Paso 1: Configurar**

Editar archivo `.env`:

```env
FIRST_ADMIN_EMAIL=admin@conanp.gob.mx
FIRST_ADMIN_PASSWORD=TuContraseñaSegura123!
FIRST_ADMIN_NAME=Administrador CONANP
FIRST_ADMIN_PHONE=+52 55 1234 5678
```

### **Paso 2: Ejecutar**

```bash
npm run create:admin
```

### **Paso 3: Entregar Credenciales al Cliente**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email:      admin@conanp.gob.mx
🔑 Contraseña: TuContraseñaSegura123!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### **Paso 4: Cliente Cambia Contraseña**

En el frontend o con API:

```
PUT /api/auth/change-password
```

---

## 🧪 Para Desarrollo

### **Opción Rápida:**

```bash
npm run seed:demo
```

**Credenciales:**

```
Email:      admin@conanp.gob.mx
Password:   Admin123!
```

---

## 📝 Comandos Útiles

```bash
# Crear primer admin (producción)
npm run create:admin

# Datos de prueba (desarrollo)
npm run seed:demo

# Limpiar datos de prueba
npm run seed:clean

# Migraciones
npm run db:migrate

# Compilar
npm run build

# Iniciar
npm start
```

---

## 🔄 Flujo Completo Visual

```
┌──────────────┐
│  Desplegar   │
│  Aplicación  │
└──────┬───────┘
       ↓
┌──────────────┐
│   Ejecutar   │
│ create:admin │
└──────┬───────┘
       ↓
┌──────────────┐
│   Entregar   │
│ Credenciales │
└──────┬───────┘
       ↓
┌──────────────┐
│   Cliente    │
│   Inicia     │
│   Sesión     │
└──────┬───────┘
       ↓
┌──────────────┐
│   Cambiar    │
│  Contraseña  │
└──────┬───────┘
       ↓
┌──────────────┐
│    Crear     │
│ Invitaciones │
└──────┬───────┘
       ↓
┌──────────────┐
│ Prestadores  │
│ se Registran │
└──────────────┘
```

---

## ⚠️ Importante

- ✅ Cambia contraseña después del primer login
- ✅ Elimina variables `FIRST_ADMIN_*` del `.env`
- ✅ Guarda credenciales en lugar seguro
- ❌ NO uses seeders en producción
- ❌ NO subas `.env` a Git

---

## 📚 Más Información

- 📖 [Guía completa de bootstrap](documentation/BOOTSTRAP_ADMIN.md)
- 🚀 [Setup completo de producción](SETUP_PRODUCCION.md)
- 🔐 [Documentación de autenticación](documentation/AUTH_API_DOCUMENTATION.md)

---

**¿Problemas?** Revisa: [`documentation/CREAR_PRIMER_ADMIN.md`](documentation/CREAR_PRIMER_ADMIN.md)
