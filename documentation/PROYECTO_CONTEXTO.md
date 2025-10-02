# 🏝️ Isla Lobos - Sistema de Gestión de Bloques y Salidas

## 📋 **Contexto del Proyecto**

### **Problema a Resolver:**

La CONANP (Comisión Nacional de Áreas Naturales Protegidas) necesita un sistema para gestionar el turismo en Isla de Lobos, donde actualmente:

- Se maneja todo por WhatsApp (grupos de chat)
- Hay límites de capacidad (65 personas normales, hasta 150 en temporada alta)
- Se crean bloques horarios (3 bloques al día) para controlar el flujo
- Los prestadores de servicios envían mensajes manuales
- No hay control centralizado ni reportes automatizados
- **Dependencia del clima:** Capitanía de Puerto puede cerrar/abrir el puerto por condiciones meteorológicas
- **Cancelaciones imprevistas:** Pueden ser por horas o días completos
- **Comunicación de emergencia:** No hay sistema automatizado para notificar cambios de estado

### **Modelo de Negocio:**

- **Monetización:** Vender el sistema a prestadores de servicios autorizados
- **CONANP:** Obtiene control total y automatización
- **Prestadores:** Facilidad de uso y profesionalización
- **Sistema de invitaciones:** Solo prestadores autorizados por CONANP

## 🎯 **Funcionalidades Principales**

### **Vista Prestador de Servicios:**

- Formulario rápido para registrar salida
- Selección de embarcación y capacidad
- Registro de pasajeros por viaje
- Selección de bloque horario disponible
- Confirmación inmediata de registro

### **Vista CONANP (Administración):**

- Dashboard con estado de bloques en tiempo real
- Tabla de capacidad: Total | Registrados | Disponibles | Estatus
- Estados visuales: 🟢 Disponible | 🟡 Casi lleno | 🔴 Lleno
- Generación de reportes PDF/Excel
- Control de permisos y acceso

## 🔧 **Stack Tecnológico**

### **Backend:**

- **Node.js** con **TypeScript**
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **Sequelize** - ORM
- **JWT** - Autenticación
- **Bcrypt** - Encriptación

### **Estructura del Proyecto:**

```
backend/
├── src/
│   ├── config/          # Configuraciones (DB, etc.)
│   ├── controllers/     # Controladores de rutas
│   ├── middleware/      # Middleware personalizado
│   ├── models/          # Modelos de Sequelize
│   ├── routes/          # Definición de rutas
│   ├── types/           # Tipos de TypeScript
│   ├── utils/           # Utilidades
│   └── index.ts         # Servidor principal
```

## 📊 **Entidades del Sistema**

### **Usuarios:**

- **CONANP:** Acceso completo + reportes
- **Prestadores:** Solo registro de salidas
- Sistema de roles y permisos

### **Embarcaciones:**

- Nombre, matrícula, capacidad
- Estado: disponible | en_uso | mantenimiento
- Asociadas a prestadores

### **Bloques:**

- Horarios fijos (ej: 08:00-10:00, 10:00-12:00, 12:00-14:00)
- Capacidad total por bloque
- Estado: activo | inactivo | suspendido_por_clima | cerrado_capitaria
- **Control meteorológico:** Integración con alertas de Capitanía de Puerto
- **Suspensiones temporales:** Por horas o días completos

### **Salidas:**

- Registro de viajes por prestador
- Fecha, pasajeros, observaciones
- Estado: programada | en_curso | completada | cancelada | cancelada_por_clima | cancelada_capitaria
- **Motivo de cancelación:** Clima, Capitanía, operacional
- **Reembolsos:** Gestión automática de cancelaciones por clima

### **Condiciones Meteorológicas:**

- **Fecha y hora:** Timestamp de la medición
- **Oleaje:** Altura en metros (máximo permitido por embarcación)
- **Viento:** Velocidad y dirección
- **Visibilidad:** Condiciones de visibilidad
- **Estado del puerto:** Abierto | Restricciones | Cerrado
- **Predicción:** Condiciones esperadas para próximos 5 días
- **Fuente:** CONAGUA, NOAA, Capitanía de Puerto

## 🌊 **Manejo de Clima y Capitanía de Puerto**

### **Estados del Puerto:**

- **🟢 Abierto:** Operaciones normales
- **🟡 Restricciones:** Solo embarcaciones menores
- **🔴 Cerrado:** Sin operaciones
- **⚡ Emergencia:** Cierre inmediato

### **Tipos de Suspensión:**

- **Por horas:** 2-6 horas de cierre
- **Por día:** Cierre completo del día
- **Por múltiples días:** Temporada de mal clima
- **Reapertura gradual:** Por bloques horarios

### **Notificaciones Automáticas:**

- **CONANP:** Recibe alertas inmediatas de cambios
- **Prestadores:** Notificación por WhatsApp, email y app
- **Pasajeros:** Si hay sistema de reservas, notificación automática
- **Público general:** Actualización en sitio web/dashboard público

### **Gestión de Cancelaciones:**

- **Cancelación masiva:** Todos los bloques del día
- **Cancelación selectiva:** Solo bloques específicos
- **Reagendamiento:** Opción de mover salidas al siguiente día disponible
- **Reembolsos:** Gestión automática de devoluciones

### **Integración con Capitanía:**

- **API oficial:** Si está disponible
- **Webhook:** Para recibir notificaciones automáticas
- **Verificación manual:** CONANP puede confirmar estados
- **Historial:** Registro de todos los cierres y reaperturas

### **Servicios Meteorológicos Integrados:**

- **API de CONAGUA:** Datos oficiales de México
- **NOAA/Servicios marítimos:** Oleaje, viento, corrientes
- **Predicciones:** Hasta 7 días de anticipación
- **Alertas automáticas:** Cambios en condiciones
- **Límite de reserva:** Máximo 5 días antes de la fecha

### **Control de Oleaje para Reservas:**

- **Nivel de oleaje:** Máximo permitido por embarcación
- **Advertencias:** Cuando el oleaje supere límites seguros
- **Restricciones:** Por tipo de embarcación (menor/mayor)
- **Cancelación automática:** Si las condiciones empeoran
- **Reagendamiento:** Opción automática para fechas alternativas

## 🚀 **Funcionalidades Avanzadas Planificadas**

### **Sistema de Invitaciones:**

- Códigos únicos con expiración
- Verificación de documentos CONANP
- Control de acceso estricto

### **Automatizaciones:**

- **Bot de WhatsApp:** Resumen diario automático
- **Notificaciones:** Email, WhatsApp, plataforma
- **Recordatorios:** Renovación de permisos
- **Reportes:** Diarios y mensuales automáticos
- **Alertas meteorológicas:** Notificaciones automáticas de cierre de puerto
- **Cancelaciones masivas:** Suspensión automática de bloques por clima
- **Reapertura:** Notificación automática cuando se reabre el puerto

### **Dashboard CONANP:**

- Métricas en tiempo real
- Alertas inteligentes
- Comparativas históricas
- Predicciones de ocupación

### **Monetización:**

- Suscripción mensual por prestador
- Planes básico y premium
- Servicios adicionales

## 📱 **Endpoints API Sugeridos**

```
/api/auth          # Autenticación JWT
/api/usuarios      # Gestión de usuarios
/api/embarcaciones # CRUD embarcaciones
/api/bloques       # Gestión de bloques horarios
/api/salidas       # Registro de salidas
/api/reportes      # Generación de reportes
/api/dashboard     # Datos para dashboard
/api/invitaciones  # Sistema de invitaciones
/api/clima         # Condiciones meteorológicas actuales
/api/predicciones  # Pronósticos de 5 días
/api/capitaria     # Estados de puerto
/api/oleaje        # Niveles de oleaje por embarcación
/api/notificaciones # Sistema de alertas
```

## 🔐 **Seguridad y Validaciones**

### **Autenticación:**

- JWT con roles (admin, operador, capitan)
- Rate limiting para prevenir spam
- Validación de permisos por endpoint

### **Validaciones:**

- Capacidad disponible antes de registrar
- Horarios dentro de bloques válidos
- Estados de embarcaciones
- Permisos de usuarios

### **Auditoría:**

- Log completo de acciones
- Backup automático
- Encriptación de datos sensibles

## 📈 **Estrategia de Implementación**

### **Fase 1 - MVP:**

- Sistema básico de bloques y salidas
- Autenticación y roles
- Reportes básicos en Excel

### **Fase 2 - Automatización:**

- Bot de WhatsApp
- Notificaciones por email
- Dashboard avanzado

### **Fase 3 - Escalabilidad:**

- App móvil
- Integraciones externas
- Funcionalidades premium

## 💡 **Ideas de Diferenciación**

- Certificación oficial por CONANP
- Sello de calidad para prestadores
- Programa de lealtad
- Capacitación incluida
- Soporte 24/7 en temporada alta

## 🎯 **Valor para CONANP**

1. **Reducción de carga administrativa** del 70%
2. **Eliminación de errores** de comunicación
3. **Cumplimiento automático** de regulaciones
4. **Datos en tiempo real** para decisiones
5. **Escalabilidad** para otras áreas protegidas

## 🎯 **Valor para Prestadores**

1. **Facilidad de uso** vs WhatsApp
2. **Confirmación inmediata** de disponibilidad
3. **Historial** de servicios
4. **Notificaciones** de renovación
5. **Profesionalización** de operación

---

## 👴👵 **Consideraciones para Usuarios Mayores**

### **Diseño Accesible:**

- **Botones grandes:** Mínimo 44px de tamaño
- **Texto grande:** Fuentes de 16px o más
- **Colores contrastantes:** Alto contraste para mejor visibilidad
- **Navegación simple:** Máximo 3 opciones por pantalla
- **Iconos descriptivos:** Con texto explicativo

### **Soporte Personalizado:**

- **Capacitación presencial:** En el muelle o centro comunitario
- **Manual impreso:** Con capturas de pantalla grandes
- **Videos tutoriales:** Con audio en español
- **Soporte telefónico:** Durante horarios de operación
- **Asistencia familiar:** Modo "ayudante" para familiares

### **Alternativas de Uso:**

- **Línea telefónica:** Para registro de salidas
- **Formulario físico:** En el muelle con ingreso manual
- **Representante:** Familiar/empleado maneja la app
- **Técnico comunitario:** Ayuda a múltiples prestadores

## 💰 **Modelo de Costos y Pagos**

### **Costos Estimados:**

- **Desarrollo inicial:** $36,000 - $57,000 USD
- **Operación mensual:** $1,350 - $2,950 USD
- **Costo por prestador (20 usuarios):** $100 USD/mes
- **Costo por prestador (30 usuarios):** $83 USD/mes
- **Costo por prestador (50 usuarios):** $60 USD/mes

### **Alternativas de Pago:**

- **Sistema híbrido:** $50 USD/mes (incluye soporte telefónico)
- **Registro manual:** $30 USD/mes (solo reportes básicos)
- **Asistencia comunitaria:** Descuento del 20% por grupo

## 📝 **Notas de Desarrollo**

- **Prioridad:** Sistema robusto y escalable
- **Enfoque:** Automatización y control
- **Objetivo:** Solución completa para gestión turística
- **Monetización:** Modelo SaaS para prestadores
- **Diferenciación:** Integración oficial con CONANP
- **Accesibilidad:** Diseño para usuarios mayores
- **Clima:** Manejo de suspensiones por condiciones meteorológicas

---

_Documento creado para mantener contexto del proyecto en futuras sesiones de desarrollo._
