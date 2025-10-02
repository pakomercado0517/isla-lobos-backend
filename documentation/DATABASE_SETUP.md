# 🗄️ Configuración de Base de Datos - Isla Lobos

## ✅ Configuración Completada

La configuración de la base de datos PostgreSQL con Sequelize ha sido completada exitosamente. Aquí está lo que se ha configurado:

### 📁 Archivos Creados

1. **`src/config/database.ts`** - Configuración principal de Sequelize
2. **`config/database.js`** - Configuración para Sequelize CLI
3. **`.sequelizerc`** - Configuración de rutas para Sequelize CLI
4. **`src/types/index.ts`** - Tipos TypeScript para todas las entidades
5. **`src/models/`** - Modelos de Sequelize:
   - `User.ts` - Usuarios (CONANP y Prestadores)
   - `Embarcacion.ts` - Embarcaciones
   - `Bloque.ts` - Bloques horarios
   - `Salida.ts` - Salidas registradas
   - `CondicionMeteorologica.ts` - Condiciones del clima
   - `Invitacion.ts` - Sistema de invitaciones
   - `index.ts` - Configuración de relaciones

### 🔗 Relaciones Configuradas

- **User** → **Embarcacion** (1:N) - Un prestador puede tener múltiples embarcaciones
- **User** → **Salida** (1:N) - Un prestador puede registrar múltiples salidas
- **Embarcacion** → **Salida** (1:N) - Una embarcación puede hacer múltiples salidas
- **Bloque** → **Salida** (1:N) - Un bloque puede tener múltiples salidas
- **User** → **Invitacion** (1:N) - Un usuario puede crear múltiples invitaciones

### 🚀 Cómo Usar

#### 1. Variables de Entorno

Asegúrate de tener configurado tu archivo `.env` con:

```env
DB_URL=postgresql://usuario:password@localhost:5432/isla_lobos_db
NODE_ENV=development
```

#### 2. Iniciar el Servidor

```bash
npm run dev
```

El servidor automáticamente:

- ✅ Probará la conexión a la base de datos
- ✅ Sincronizará los modelos (creará las tablas si no existen)
- ✅ Mostrará mensajes de confirmación

#### 3. Scripts Disponibles

```bash
# Crear la base de datos
npm run db:create

# Ejecutar migraciones
npm run db:migrate

# Revertir última migración
npm run db:migrate:undo

# Ejecutar seeders
npm run db:seed

# Revertir seeders
npm run db:seed:undo

# Eliminar base de datos (¡CUIDADO!)
npm run db:drop
```

### 📊 Estructura de la Base de Datos

#### Tablas Creadas:

- `users` - Usuarios del sistema
- `embarcaciones` - Embarcaciones registradas
- `bloques` - Bloques horarios
- `salidas` - Registro de salidas
- `condiciones_meteorologicas` - Datos del clima
- `invitaciones` - Sistema de invitaciones

#### Características:

- ✅ **Timestamps automáticos** - `created_at` y `updated_at`
- ✅ **UUIDs como claves primarias** - Más seguros que IDs incrementales
- ✅ **Validaciones de datos** - A nivel de modelo y base de datos
- ✅ **Índices optimizados** - Para consultas rápidas
- ✅ **Relaciones configuradas** - Con claves foráneas
- ✅ **Nomenclatura en español** - Campos y tablas en español

### 🔧 Funcionalidades Incluidas

#### Modelo Bloque:

- Cálculo automático de capacidad disponible
- Validación de horarios (fin > inicio)
- Estados de bloque (activo, suspendido, etc.)

#### Modelo Usuario:

- Método `toJSON()` que excluye la contraseña
- Roles predefinidos (CONANP, Prestador)
- Validación de email único

#### Modelo Invitación:

- Códigos únicos con expiración
- Validación de estado (usada/expirada)

### 🎯 Próximos Pasos

1. **Crear controladores** para manejar las operaciones CRUD
2. **Implementar autenticación JWT** para usuarios
3. **Crear rutas de la API** según el contexto del proyecto
4. **Implementar validaciones** de negocio específicas
5. **Crear seeders** con datos de prueba

### 🐛 Solución de Problemas

#### Error de Conexión:

- Verifica que PostgreSQL esté ejecutándose
- Confirma que la URL de conexión sea correcta
- Asegúrate de que la base de datos exista

#### Error de Sincronización:

- Verifica que tengas permisos para crear tablas
- Revisa los logs del servidor para más detalles
- En desarrollo, las tablas se crean automáticamente

### 📝 Notas Importantes

- En **desarrollo**, las tablas se sincronizan automáticamente
- En **producción**, usa migraciones para cambios controlados
- Los modelos incluyen validaciones de negocio específicas
- Todas las relaciones están configuradas correctamente
- El sistema está listo para implementar la lógica de negocio

---

**¡La configuración de la base de datos está completa y lista para usar! 🎉**
