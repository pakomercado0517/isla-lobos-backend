# 🚀 API Routes Reference - Isla Lobos Backend

## 📋 Información General

- **URL Base**: `http://localhost:3001/api`
- **Autenticación**: JWT Bearer Token
- **Content-Type**: `application/json`
- **Total de Endpoints**: 77
- **Zona Horaria**: `America/Mexico_City`

---

## 🔐 Autenticación (`/api/auth`)

**Nota:** Los endpoints de recuperación de contraseña (`forgot-password` y `reset-password`) son públicos y no requieren autenticación.

### 1. Login

```http
POST /api/auth/login
```

**Body:**

```json
{
  "email": "admin@conanp.gob.mx",
  "password": "Admin123!"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "Admin CONANP",
      "email": "admin@conanp.gob.mx",
      "telefono": "+52 229 123 4567",
      "rol": "conanp",
      "activo": true,
      "fechaVencimientoPermiso": null,
      "estadoPermiso": "vigente",
      "diasNotificacion": 30,
      "ultimaNotificacion": null,
      "motivoSuspension": null,
      "createdAt": "2025-09-26T03:11:54.535Z",
      "updatedAt": "2025-09-26T03:11:54.535Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Respuesta de Error (401):**

```json
{
  "status": "error",
  "message": "Credenciales inválidas"
}
```

### 2. Registro

```http
POST /api/auth/register
```

**Body:**

```json
{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "Password123!",
  "telefono": "2291234567",
  "codigo_invitacion": "PRESTADOR001"
}
```

**Respuesta Exitosa (201):**

```json
{
  "status": "success",
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "Juan Pérez",
      "email": "juan@ejemplo.com",
      "telefono": "2291234567",
      "rol": "prestador",
      "activo": true,
      "fechaVencimientoPermiso": "2026-09-26T00:00:00.000Z",
      "estadoPermiso": "vigente",
      "diasNotificacion": 30,
      "ultimaNotificacion": null,
      "motivoSuspension": null,
      "createdAt": "2025-09-26T03:11:54.535Z",
      "updatedAt": "2025-09-26T03:11:54.535Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Verificar Token

```http
GET /api/auth/verify
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Token válido",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "Juan Pérez",
      "email": "juan@ejemplo.com",
      "telefono": "2291234567",
      "rol": "prestador",
      "activo": true,
      "fechaVencimientoPermiso": "2026-09-26T00:00:00.000Z",
      "estadoPermiso": "vigente",
      "diasNotificacion": 30,
      "createdAt": "2025-09-26T03:11:54.535Z",
      "updatedAt": "2025-09-26T03:11:54.535Z"
    }
  }
}
```

### 4. Refrescar Token

```http
POST /api/auth/refresh
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Token refrescado exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 5. Cerrar Sesión

```http
POST /api/auth/logout
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Sesión cerrada exitosamente"
}
```

### 6. Solicitar Recuperación de Contraseña

```http
POST /api/auth/forgot-password
```

**Body:**

```json
{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Si el email existe en nuestro sistema, recibirás un enlace para recuperar tu contraseña"
}
```

### 7. Resetear Contraseña

```http
POST /api/auth/reset-password
```

**Body:**

```json
{
  "token": "abc123def456...",
  "newPassword": "NuevaPassword123!",
  "confirmPassword": "NuevaPassword123!"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña"
}
```

### 8. Cambiar Contraseña

```http
PUT /api/auth/change-password
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Contraseña actualizada exitosamente"
}
```

### 9. Obtener Perfil

```http
GET /api/auth/profile
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Perfil obtenido exitosamente",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "Juan Pérez",
      "email": "juan@ejemplo.com",
      "telefono": "2291234567",
      "rol": "prestador",
      "activo": true,
      "fechaVencimientoPermiso": "2026-09-26T00:00:00.000Z",
      "estadoPermiso": "vigente",
      "diasNotificacion": 30,
      "createdAt": "2025-09-26T03:11:54.535Z",
      "updatedAt": "2025-09-26T03:11:54.535Z"
    }
  }
}
```

---

## 👥 Usuarios (`/api/usuarios`)

> **Nota:** Todas las rutas requieren autenticación. Las rutas marcadas con 🔒 requieren rol CONANP.

### 1. Listar Usuarios 🔒

```http
GET /api/usuarios?page=1&limit=10&rol=prestador&activo=true
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Usuarios obtenidos exitosamente",
  "data": {
    "users": [
      {
        "id": "uuid",
        "nombre": "Juan Pérez",
        "email": "juan.perez@ejemplo.com",
        "telefono": "+52 229 123 4567",
        "rol": "prestador",
        "activo": true,
        "fechaVencimientoPermiso": "2026-09-26T00:00:00.000Z",
        "estadoPermiso": "vigente",
        "diasNotificacion": 30,
        "ultimaNotificacion": null,
        "motivoSuspension": null,
        "createdAt": "2025-09-26T03:11:54.764Z",
        "updatedAt": "2025-09-26T03:11:54.764Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### 2. Obtener Usuario por ID 🔒

```http
GET /api/usuarios/:userId
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Usuario obtenido exitosamente",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "Juan Pérez",
      "email": "juan.perez@ejemplo.com",
      "telefono": "+52 229 123 4567",
      "rol": "prestador",
      "activo": true,
      "fechaVencimientoPermiso": "2026-09-26T00:00:00.000Z",
      "estadoPermiso": "vigente",
      "diasNotificacion": 30,
      "createdAt": "2025-09-26T03:11:54.764Z",
      "updatedAt": "2025-09-26T03:11:54.764Z"
    }
  }
}
```

### 3. Crear Usuario 🔒

```http
POST /api/usuarios
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "nombre": "Nuevo Usuario",
  "email": "nuevo@ejemplo.com",
  "telefono": "2291234567",
  "password": "Password123!",
  "rol": "prestador",
  "activo": true
}
```

**Respuesta Exitosa (201):**

```json
{
  "status": "success",
  "message": "Usuario creado exitosamente",
  "data": {
    "user": {
      "id": "nuevo-uuid",
      "nombre": "Nuevo Usuario",
      "email": "nuevo@ejemplo.com",
      "telefono": "2291234567",
      "rol": "prestador",
      "activo": true,
      "fechaVencimientoPermiso": "2026-09-26T00:00:00.000Z",
      "estadoPermiso": "vigente",
      "diasNotificacion": 30,
      "createdAt": "2025-09-26T03:11:54.764Z",
      "updatedAt": "2025-09-26T03:11:54.764Z"
    }
  }
}
```

### 4. Actualizar Usuario 🔒

```http
PUT /api/usuarios/:userId
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "nombre": "Nombre Actualizado",
  "telefono": "2299876543",
  "activo": false
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Usuario actualizado exitosamente",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "Nombre Actualizado",
      "email": "usuario@ejemplo.com",
      "telefono": "2299876543",
      "rol": "prestador",
      "activo": false,
      "createdAt": "2025-09-26T03:11:54.764Z",
      "updatedAt": "2025-09-26T03:11:54.764Z"
    }
  }
}
```

### 5. Eliminar Usuario (Soft Delete) 🔒

```http
DELETE /api/usuarios/:userId
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Usuario desactivado exitosamente",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "Usuario",
      "email": "usuario@ejemplo.com",
      "telefono": "2291234567",
      "rol": "prestador",
      "activo": false,
      "createdAt": "2025-09-26T03:11:54.764Z",
      "updatedAt": "2025-09-26T03:11:54.764Z"
    }
  }
}
```

### 6. Activar Usuario 🔒

```http
PATCH /api/usuarios/:userId/activate
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Usuario activado exitosamente",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "Usuario",
      "email": "usuario@ejemplo.com",
      "telefono": "2291234567",
      "rol": "prestador",
      "activo": true,
      "createdAt": "2025-09-26T03:11:54.764Z",
      "updatedAt": "2025-09-26T03:11:54.764Z"
    }
  }
}
```

### 7. Actualizar Perfil Personal

```http
PUT /api/usuarios/profile/update
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "nombre": "Mi Nombre Actualizado",
  "telefono": "2291234567"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Perfil actualizado exitosamente",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "Mi Nombre Actualizado",
      "email": "usuario@ejemplo.com",
      "telefono": "2291234567",
      "rol": "prestador",
      "activo": true,
      "createdAt": "2025-09-26T03:11:54.764Z",
      "updatedAt": "2025-09-26T03:11:54.764Z"
    }
  }
}
```

### 8. Estadísticas de Usuarios 🔒

```http
GET /api/usuarios/stats
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "stats": {
      "total": 15,
      "activos": 12,
      "inactivos": 3,
      "conanp": 2,
      "prestadores": 13,
      "por_estado_permiso": {
        "vigente": 10,
        "por_vencer": 2,
        "vencido": 1,
        "suspendido": 0
      }
    }
  }
}
```

---

## ⏰ Bloques (`/api/bloques`)

> **Nota:** Todas las rutas requieren autenticación. Las rutas marcadas con 🔒 requieren rol CONANP.

### 1. Listar Bloques Disponibles

```http
GET /api/bloques?fecha=2025-10-15
```

**Headers:** `Authorization: Bearer <token>`

**Descripción:** Siempre devuelve los 3 bloques predefinidos permanentes con capacidad calculada en tiempo real. Si se proporciona una fecha, calcula la ocupación para esa fecha específica.

**Parámetros de Query:**

- `fecha` (opcional): Fecha para calcular capacidad ocupada (formato: YYYY-MM-DD)

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Bloques obtenidos exitosamente",
  "data": {
    "bloques": [
      {
        "id": "11111111-1111-1111-1111-111111111111",
        "nombre": "Bloque Matutino",
        "hora_inicio": "08:00:00",
        "hora_fin": "10:00:00",
        "capacidad_total": 65,
        "capacidad_registrada": 45,
        "capacidad_disponible": 20,
        "estado": "activo",
        "fecha": "2025-10-15"
      },
      {
        "id": "22222222-2222-2222-2222-222222222222",
        "nombre": "Bloque Mediodía",
        "hora_inicio": "11:00:00",
        "hora_fin": "13:00:00",
        "capacidad_total": 65,
        "capacidad_registrada": 65,
        "capacidad_disponible": 0,
        "estado": "lleno",
        "fecha": "2025-10-15"
      },
      {
        "id": "33333333-3333-3333-3333-333333333333",
        "nombre": "Bloque Vespertino",
        "hora_inicio": "14:00:00",
        "hora_fin": "16:00:00",
        "capacidad_total": 65,
        "capacidad_registrada": 0,
        "capacidad_disponible": 65,
        "estado": "activo",
        "fecha": "2025-10-15"
      }
    ]
  }
}
```

**Estados de Bloques:**

- `activo`: Bloque disponible con cupos
- `lleno`: Bloque sin cupos disponibles
- `suspendido_por_clima`: Cerrado por condiciones meteorológicas
- `cerrado_capitaria`: Cerrado por capitanía de puerto
- `plantilla`: Bloque predefinido (solo visible sin fecha)

### 2. Obtener Bloque por ID

```http
GET /api/bloques/:id
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Bloque obtenido exitosamente",
  "data": {
    "bloque": {
      "id": "uuid",
      "nombre": "Bloque Matutino",
      "hora_inicio": "08:00:00",
      "hora_fin": "10:00:00",
      "capacidad_total": 65,
      "capacidad_registrada": 45,
      "estado": "activo",
      "fecha": "2025-09-26",
      "createdAt": "2025-09-26T16:31:51.205Z",
      "updatedAt": "2025-09-26T16:31:51.205Z"
    }
  }
}
```

### 3. Crear Bloque 🔒

```http
POST /api/bloques
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "nombre": "Bloque de Prueba",
  "hora_inicio": "15:00",
  "hora_fin": "17:00",
  "capacidad_total": 50,
  "fecha": "2025-12-30",
  "estado": "activo"
}
```

**Respuesta Exitosa (201):**

```json
{
  "status": "success",
  "message": "Bloque creado exitosamente",
  "data": {
    "bloque": {
      "id": "uuid",
      "nombre": "Bloque de Prueba",
      "hora_inicio": "15:00:00",
      "hora_fin": "17:00:00",
      "capacidad_total": 50,
      "capacidad_registrada": 0,
      "estado": "activo",
      "fecha": "2025-12-30",
      "createdAt": "2025-09-26T16:53:03.562Z",
      "updatedAt": "2025-09-26T16:53:03.562Z"
    }
  }
}
```

### 4. Actualizar Bloque 🔒

```http
PUT /api/bloques/:id
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "nombre": "Bloque Actualizado",
  "capacidad_total": 60,
  "estado": "lleno"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Bloque actualizado exitosamente",
  "data": {
    "bloque": {
      "id": "uuid",
      "nombre": "Bloque Actualizado",
      "hora_inicio": "15:00:00",
      "hora_fin": "17:00:00",
      "capacidad_total": 60,
      "capacidad_registrada": 0,
      "estado": "lleno",
      "fecha": "2025-12-30",
      "createdAt": "2025-09-26T16:53:03.562Z",
      "updatedAt": "2025-09-26T16:53:03.562Z"
    }
  }
}
```

### 5. Eliminar Bloque 🔒

```http
DELETE /api/bloques/:id
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Bloque eliminado exitosamente"
}
```

### 6. Cerrar Bloque Temporalmente 🔒

```http
POST /api/bloques/cerrar
```

**Headers:** `Authorization: Bearer <token>`

**Descripción:** Permite a CONANP cerrar un bloque para una fecha específica por motivos como clima o capitanía.

**Body:**

```json
{
  "bloque_id": "11111111-1111-1111-1111-111111111111",
  "fecha": "2025-10-15",
  "motivo": "suspendido_por_clima",
  "observaciones": "Oleaje alto y vientos fuertes"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Bloque cerrado exitosamente",
  "data": {
    "cierre": {
      "id": "uuid",
      "bloque_plantilla_id": "11111111-1111-1111-1111-111111111111",
      "fecha": "2025-10-15",
      "motivo": "suspendido_por_clima",
      "observaciones": "Oleaje alto y vientos fuertes",
      "activo": true,
      "creado_por": "uuid-conanp",
      "created_at": "2025-10-15T08:00:00.000Z"
    }
  }
}
```

### 7. Reabrir Bloque 🔒

```http
POST /api/bloques/abrir
```

**Headers:** `Authorization: Bearer <token>`

**Descripción:** Permite a CONANP reabrir un bloque previamente cerrado.

**Body:**

```json
{
  "bloque_id": "11111111-1111-1111-1111-111111111111",
  "fecha": "2025-10-15"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Bloque reabierto exitosamente"
}
```

### 8. Estadísticas de Bloques 🔒

```http
GET /api/bloques/estadisticas?fecha_inicio=2025-09-01&fecha_fin=2025-09-30
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "estadisticas": {
      "total_bloques": 22,
      "por_estado": {
        "activo": 15,
        "lleno": 1,
        "suspendido_por_clima": 3,
        "cerrado_capitaria": 3
      },
      "capacidad": {
        "total": 1415,
        "ocupada": 130,
        "disponible": 1285,
        "porcentaje_ocupacion": 9
      },
      "periodo": {
        "fecha_inicio": "2025-09-01T00:00:00.000Z",
        "fecha_fin": "2025-09-30T23:59:59.999Z"
      }
    }
  }
}
```

---

## 🚢 Embarcaciones (`/api/embarcaciones`)

> **Nota:** Todas las rutas requieren autenticación. Las rutas marcadas con 🔒 requieren rol CONANP.

### 1. Listar Embarcaciones

```http
GET /api/embarcaciones?page=1&limit=10&estado=disponible&tipo=menor
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Embarcaciones obtenidas exitosamente",
  "data": {
    "embarcaciones": [
      {
        "id": "b5c54240-b74e-4ff8-9bb5-95804521fbb4",
        "nombre": "Isla Dorada",
        "matricula": "VER-002-DEF",
        "capacidad": 40,
        "tipo": "mayor",
        "estado": "disponible",
        "prestador_id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
        "createdAt": "2025-09-26T16:31:48.340Z",
        "updatedAt": "2025-09-26T16:31:48.340Z",
        "prestador": {
          "id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
          "nombre": "Juan Pérez",
          "email": "juan.perez@ejemplo.com",
          "telefono": "+52 229 123 4567"
        }
      }
    ],
    "estadisticas": {
      "total": 6,
      "disponibles": 4,
      "en_uso": 1,
      "mantenimiento": 1,
      "menor": 4,
      "mayor": 2
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 6,
      "totalPages": 1
    }
  }
}
```

### 2. Obtener Embarcación por ID

```http
GET /api/embarcaciones/:id
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Embarcación obtenida exitosamente",
  "data": {
    "embarcacion": {
      "id": "b5c54240-b74e-4ff8-9bb5-95804521fbb4",
      "nombre": "Isla Dorada",
      "matricula": "VER-002-DEF",
      "capacidad": 40,
      "tipo": "mayor",
      "estado": "disponible",
      "prestador_id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
      "createdAt": "2025-09-26T16:31:48.340Z",
      "updatedAt": "2025-09-26T16:31:48.340Z",
      "prestador": {
        "id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
        "nombre": "Juan Pérez",
        "email": "juan.perez@ejemplo.com",
        "telefono": "+52 229 123 4567"
      }
    }
  }
}
```

### 3. Crear Embarcación

```http
POST /api/embarcaciones
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "nombre": "Nueva Embarcacion",
  "matricula": "VER-007-ABC",
  "capacidad": 30,
  "tipo": "menor",
  "estado": "disponible",
  "prestador_id": "6352b123-ad6d-4c89-a6d5-de53220f1233"
}
```

**Respuesta Exitosa (201):**

```json
{
  "status": "success",
  "message": "Embarcación creada exitosamente",
  "data": {
    "embarcacion": {
      "id": "c6790ee5-530f-4605-9035-3ba12acede3e",
      "nombre": "Nueva Embarcacion",
      "matricula": "VER-007-ABC",
      "capacidad": 30,
      "tipo": "menor",
      "estado": "disponible",
      "prestador_id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
      "createdAt": "2025-09-26T17:10:48.238Z",
      "updatedAt": "2025-09-26T17:10:48.238Z",
      "prestador": {
        "id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
        "nombre": "Juan Pérez",
        "email": "juan.perez@ejemplo.com",
        "telefono": "+52 229 123 4567"
      }
    }
  }
}
```

### 4. Actualizar Embarcación

```http
PUT /api/embarcaciones/:id
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "nombre": "Embarcacion Actualizada",
  "capacidad": 35,
  "estado": "en_uso"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Embarcación actualizada exitosamente",
  "data": {
    "embarcacion": {
      "id": "c6790ee5-530f-4605-9035-3ba12acede3e",
      "nombre": "Embarcacion Actualizada",
      "matricula": "VER-007-ABC",
      "capacidad": 35,
      "tipo": "menor",
      "estado": "en_uso",
      "prestador_id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
      "createdAt": "2025-09-26T17:10:48.238Z",
      "updatedAt": "2025-09-26T17:15:30.123Z",
      "prestador": {
        "id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
        "nombre": "Juan Pérez",
        "email": "juan.perez@ejemplo.com",
        "telefono": "+52 229 123 4567"
      }
    }
  }
}
```

### 5. Eliminar Embarcación

```http
DELETE /api/embarcaciones/:id
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Embarcación eliminada exitosamente"
}
```

### 6. Mis Embarcaciones

```http
GET /api/embarcaciones/mis-embarcaciones?page=1&limit=10
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Mis embarcaciones obtenidas exitosamente",
  "data": {
    "embarcaciones": [
      {
        "id": "b5c54240-b74e-4ff8-9bb5-95804521fbb4",
        "nombre": "Isla Dorada",
        "matricula": "VER-002-DEF",
        "capacidad": 40,
        "tipo": "mayor",
        "estado": "disponible",
        "prestador_id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
        "createdAt": "2025-09-26T16:31:48.340Z",
        "updatedAt": "2025-09-26T16:31:48.340Z"
      }
    ],
    "estadisticas": {
      "total": 3,
      "disponibles": 2,
      "en_uso": 1,
      "mantenimiento": 0,
      "menor": 2,
      "mayor": 1
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

### 7. Estadísticas de Embarcaciones 🔒

```http
GET /api/embarcaciones/estadisticas?prestador_id=uuid
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "estadisticas": {
      "total_embarcaciones": 7,
      "por_estado": {
        "disponible": 5,
        "en_uso": 1,
        "mantenimiento": 1
      },
      "por_tipo": {
        "menor": 5,
        "mayor": 2
      },
      "capacidad_total": 245,
      "por_prestador": [
        {
          "prestador": {
            "id": "uuid",
            "nombre": "Juan Pérez",
            "email": "juan@ejemplo.com"
          },
          "total": 3,
          "disponibles": 2,
          "en_uso": 1,
          "mantenimiento": 0
        }
      ]
    }
  }
}
```

---

## 🚤 Salidas (`/api/salidas`)

> **Nota:** Todas las rutas requieren autenticación.

### 🎯 Destinos Soportados

El sistema ahora soporta múltiples destinos con diferentes flujos de trabajo:

#### **Isla de Lobos** (Con bloques horarios)

- Requiere `bloque_id`
- Validación de capacidad automática
- 3 bloques predefinidos siempre disponibles

#### **Arrecifes** (Con hora libre)

- Requiere `hora`
- Sin restricciones de bloques
- Destinos disponibles:
  - Arrecife Tuxpan
  - Arrecife de en Medio
  - Arrecife Tanhuijo

### 1. Listar Salidas

```http
GET /api/salidas?page=1&limit=10&fecha=2025-09-26&estado=programada
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Salidas obtenidas exitosamente",
  "data": {
    "salidas": [
      {
        "id": "uuid",
        "fecha": "2025-09-26",
        "destino": "Isla de Lobos",
        "bloque_id": "11111111-1111-1111-1111-111111111111",
        "hora": null,
        "numero_pasajeros": 25,
        "observaciones": "Salida programada",
        "estado": "programada",
        "motivo_cancelacion": null,
        "prestador_id": "uuid",
        "embarcacion_id": "uuid",
        "createdAt": "2025-09-26T10:00:00.000Z",
        "updatedAt": "2025-09-26T10:00:00.000Z",
        "prestador": {
          "id": "uuid",
          "nombre": "Juan Pérez",
          "email": "juan@ejemplo.com",
          "telefono": "2291234567"
        },
        "embarcacion": {
          "id": "uuid",
          "nombre": "Lancha María",
          "matricula": "VER-001-ABC",
          "capacidad": 30,
          "tipo": "menor"
        },
        "bloque": {
          "id": "uuid",
          "nombre": "Bloque Matutino",
          "hora_inicio": "08:00:00",
          "hora_fin": "10:00:00",
          "fecha": "2025-09-26"
        }
      }
    ],
    "estadisticas": {
      "total": 150,
      "programadas": 8,
      "en_curso": 3,
      "completadas": 135,
      "canceladas": 4
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    }
  }
}
```

### 2. Obtener Salida por ID

```http
GET /api/salidas/:id
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Salida obtenida exitosamente",
  "data": {
    "salida": {
      "id": "uuid",
      "fecha": "2025-09-26",
      "numero_pasajeros": 25,
      "observaciones": "Salida programada",
      "estado": "programada",
      "motivo_cancelacion": null,
      "prestador_id": "uuid",
      "embarcacion_id": "uuid",
      "bloque_id": "uuid",
      "createdAt": "2025-09-26T10:00:00.000Z",
      "updatedAt": "2025-09-26T10:00:00.000Z",
      "prestador": {
        "id": "uuid",
        "nombre": "Juan Pérez",
        "email": "juan@ejemplo.com",
        "telefono": "2291234567"
      },
      "embarcacion": {
        "id": "uuid",
        "nombre": "Lancha María",
        "matricula": "VER-001-ABC",
        "capacidad": 30,
        "tipo": "menor"
      },
      "bloque": {
        "id": "uuid",
        "nombre": "Bloque Matutino",
        "hora_inicio": "08:00:00",
        "hora_fin": "10:00:00",
        "fecha": "2025-09-26"
      }
    }
  }
}
```

### 3. Registrar Salida

```http
POST /api/salidas
```

**Headers:** `Authorization: Bearer <token>`

**Descripción:** Registra una nueva salida con validación condicional según el destino seleccionado.

#### **Para Isla de Lobos** (Requiere bloque_id):

**Body:**

```json
{
  "destino": "Isla de Lobos",
  "bloque_id": "11111111-1111-1111-1111-111111111111",
  "fecha": "2025-10-15",
  "numero_pasajeros": 25,
  "embarcacion_id": "uuid-embarcacion",
  "observaciones": "Salida matutina a Isla de Lobos"
}
```

#### **Para Arrecifes** (Requiere hora):

**Body:**

```json
{
  "destino": "Arrecife Tuxpan",
  "hora": "09:30",
  "fecha": "2025-10-15",
  "numero_pasajeros": 15,
  "embarcacion_id": "uuid-embarcacion",
  "observaciones": "Tour al arrecife"
}
```

**Validaciones Automáticas:**

- **Isla de Lobos**: Verifica capacidad disponible en el bloque
- **Arrecifes**: Valida formato de hora
- **Ambos**: Verifica capacidad de embarcación y permisos del prestador

**Respuesta Exitosa (201):**

```json
{
  "status": "success",
  "message": "Salida registrada exitosamente",
  "data": {
    "salida": {
      "id": "uuid",
      "fecha": "2025-10-15",
      "destino": "Isla de Lobos",
      "bloque_id": "11111111-1111-1111-1111-111111111111",
      "hora": null,
      "numero_pasajeros": 25,
      "observaciones": "Salida matutina a Isla de Lobos",
      "estado": "programada",
      "motivo_cancelacion": null,
      "prestador_id": "uuid",
      "embarcacion_id": "uuid-embarcacion",
      "createdAt": "2025-10-15T10:00:00.000Z",
      "updatedAt": "2025-10-15T10:00:00.000Z",
      "prestador": {
        "id": "uuid",
        "nombre": "Juan Pérez",
        "email": "juan@ejemplo.com",
        "telefono": "2291234567"
      },
      "embarcacion": {
        "id": "uuid-embarcacion",
        "nombre": "Lancha María",
        "matricula": "VER-001-ABC",
        "capacidad": 30,
        "tipo": "menor"
      },
      "bloque": {
        "id": "11111111-1111-1111-1111-111111111111",
        "nombre": "Bloque Matutino",
        "hora_inicio": "08:00:00",
        "hora_fin": "10:00:00",
        "capacidad_total": 65
      }
    }
  }
}
```

**Respuesta para Arrecife (sin bloque):**

```json
{
  "status": "success",
  "message": "Salida registrada exitosamente",
  "data": {
    "salida": {
      "id": "uuid",
      "fecha": "2025-10-15",
      "destino": "Arrecife Tuxpan",
      "bloque_id": null,
      "hora": "09:30:00",
      "numero_pasajeros": 15,
      "observaciones": "Tour al arrecife",
      "estado": "programada",
      "motivo_cancelacion": null,
      "prestador_id": "uuid",
      "embarcacion_id": "uuid-embarcacion",
      "createdAt": "2025-10-15T10:00:00.000Z",
      "updatedAt": "2025-10-15T10:00:00.000Z",
      "prestador": {
        "id": "uuid",
        "nombre": "Juan Pérez",
        "email": "juan@ejemplo.com",
        "telefono": "2291234567"
      },
      "embarcacion": {
        "id": "uuid-embarcacion",
        "nombre": "Lancha María",
        "matricula": "VER-001-ABC",
        "capacidad": 30,
        "tipo": "menor"
      },
      "bloque": null
    }
  }
}
```

**Errores Comunes:**

```json
// Error: Bloque requerido para Isla de Lobos
{
  "status": "error",
  "message": "bloque_id es requerido para salidas a Isla de Lobos",
  "error": "VALIDATION_ERROR"
}

// Error: Capacidad insuficiente
{
  "status": "error",
  "message": "El bloque solo tiene 15 cupos disponibles",
  "error": "INSUFFICIENT_CAPACITY"
}

// Error: Hora requerida para arrecifes
{
  "status": "error",
  "message": "hora es requerida para este destino",
  "error": "VALIDATION_ERROR"
}
```

### 4. Actualizar Salida

```http
PUT /api/salidas/:id
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "numero_pasajeros": 30,
  "observaciones": "Actualización de pasajeros",
  "estado": "en_curso"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Salida actualizada exitosamente",
  "data": {
    "salida": {
      "id": "uuid",
      "fecha": "2025-09-26",
      "numero_pasajeros": 30,
      "observaciones": "Actualización de pasajeros",
      "estado": "en_curso",
      "motivo_cancelacion": null,
      "prestador_id": "uuid",
      "embarcacion_id": "uuid",
      "bloque_id": "uuid",
      "createdAt": "2025-09-26T10:00:00.000Z",
      "updatedAt": "2025-09-26T11:00:00.000Z",
      "prestador": {
        "id": "uuid",
        "nombre": "Juan Pérez",
        "email": "juan@ejemplo.com",
        "telefono": "2291234567"
      },
      "embarcacion": {
        "id": "uuid",
        "nombre": "Lancha María",
        "matricula": "VER-001-ABC",
        "capacidad": 30,
        "tipo": "menor"
      },
      "bloque": {
        "id": "uuid",
        "nombre": "Bloque Matutino",
        "hora_inicio": "08:00:00",
        "hora_fin": "10:00:00",
        "fecha": "2025-09-26"
      }
    }
  }
}
```

### 5. Cancelar Salida

```http
DELETE /api/salidas/:id
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Salida cancelada exitosamente",
  "data": {
    "salida": {
      "id": "uuid",
      "fecha": "2025-09-26",
      "numero_pasajeros": 25,
      "observaciones": "Salida cancelada",
      "estado": "cancelada",
      "motivo_cancelacion": "Cancelación por solicitud del prestador",
      "prestador_id": "uuid",
      "embarcacion_id": "uuid",
      "bloque_id": "uuid",
      "createdAt": "2025-09-26T10:00:00.000Z",
      "updatedAt": "2025-09-26T12:00:00.000Z"
    }
  }
}
```

### 6. Mis Salidas

```http
GET /api/salidas/mis-salidas?page=1&limit=10
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Mis salidas obtenidas exitosamente",
  "data": {
    "salidas": [
      {
        "id": "uuid",
        "fecha": "2025-09-26",
        "numero_pasajeros": 25,
        "observaciones": "Mi salida",
        "estado": "programada",
        "motivo_cancelacion": null,
        "prestador_id": "uuid",
        "embarcacion_id": "uuid",
        "bloque_id": "uuid",
        "createdAt": "2025-09-26T10:00:00.000Z",
        "updatedAt": "2025-09-26T10:00:00.000Z",
        "embarcacion": {
          "id": "uuid",
          "nombre": "Lancha María",
          "matricula": "VER-001-ABC",
          "capacidad": 30,
          "tipo": "menor"
        },
        "bloque": {
          "id": "uuid",
          "nombre": "Bloque Matutino",
          "hora_inicio": "08:00:00",
          "hora_fin": "10:00:00",
          "fecha": "2025-09-26"
        }
      }
    ],
    "estadisticas": {
      "total": 45,
      "programadas": 3,
      "en_curso": 1,
      "completadas": 40,
      "canceladas": 1
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

### 7. Obtener Destinos Disponibles

```http
GET /api/salidas/destinos
```

**Headers:** `Authorization: Bearer <token>`

**Descripción:** Obtiene la lista de destinos disponibles para registrar salidas.

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Destinos obtenidos exitosamente",
  "data": {
    "destinos": [
      {
        "id": "isla_lobos",
        "nombre": "Isla de Lobos",
        "tipo": "bloque",
        "descripcion": "Requiere selección de bloque horario",
        "requiere_bloque": true,
        "requiere_hora": false
      },
      {
        "id": "arrecife_tuxpan",
        "nombre": "Arrecife Tuxpan",
        "tipo": "hora_libre",
        "descripcion": "Requiere especificar hora de salida",
        "requiere_bloque": false,
        "requiere_hora": true
      },
      {
        "id": "arrecife_en_medio",
        "nombre": "Arrecife de en Medio",
        "tipo": "hora_libre",
        "descripcion": "Requiere especificar hora de salida",
        "requiere_bloque": false,
        "requiere_hora": true
      },
      {
        "id": "arrecife_tanhuijo",
        "nombre": "Arrecife Tanhuijo",
        "tipo": "hora_libre",
        "descripcion": "Requiere especificar hora de salida",
        "requiere_bloque": false,
        "requiere_hora": true
      }
    ]
  }
}
```

### 8. Estadísticas de Salidas

```http
GET /api/salidas/estadisticas?fecha_inicio=2025-09-01&fecha_fin=2025-09-30
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Estadísticas de salidas obtenidas exitosamente",
  "data": {
    "estadisticas": {
      "periodo": {
        "fecha_inicio": "2025-09-01T00:00:00.000Z",
        "fecha_fin": "2025-09-30T23:59:59.999Z",
        "total_dias": 30
      },
      "totales": {
        "salidas": 150,
        "pasajeros": 3750,
        "promedio_pasajeros_por_salida": 25
      },
      "por_estado": {
        "programadas": 8,
        "en_curso": 3,
        "completadas": 135,
        "canceladas": 4
      },
      "por_embarcacion": [
        {
          "embarcacion": {
            "id": "uuid",
            "nombre": "Lancha María",
            "matricula": "VER-001-ABC"
          },
          "total_salidas": 25,
          "total_pasajeros": 625
        }
      ],
      "por_prestador": [
        {
          "prestador": {
            "id": "uuid",
            "nombre": "Juan Pérez",
            "email": "juan@ejemplo.com"
          },
          "total_salidas": 25,
          "total_pasajeros": 625
        }
      ],
      "tendencias": {
        "salidas_por_dia": 5,
        "pasajeros_por_dia": 125,
        "ocupacion_promedio": 83
      }
    }
  }
}
```

---

## 🌤️ Clima (`/api/clima`)

> **Nota:** Todas las rutas requieren autenticación. Las rutas marcadas con 🔒 requieren rol CONANP.

### 1. Listar Condiciones Meteorológicas

```http
GET /api/clima?page=1&limit=10&fecha_inicio=2025-09-01&fecha_fin=2025-09-30
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Condiciones meteorológicas obtenidas exitosamente",
  "data": {
    "condiciones": [
      {
        "id": "bd8fc4e2-b824-499a-98d5-be143c6821ad",
        "fecha_hora": "2025-09-26T16:31:53.994Z",
        "oleaje": 1.2,
        "viento_velocidad": 15.5,
        "viento_direccion": "NE",
        "visibilidad": "Buena",
        "estado_puerto": "abierto",
        "prediccion_5_dias": "Condiciones estables para los próximos 5 días...",
        "fuente": "CONAGUA",
        "createdAt": "2025-09-26T16:31:53.994Z",
        "updatedAt": "2025-09-26T16:31:53.994Z"
      }
    ],
    "condicion_actual": {
      "id": "bd8fc4e2-b824-499a-98d5-be143c6821ad",
      "fecha_hora": "2025-09-26T16:31:53.994Z",
      "oleaje": 1.2,
      "viento_velocidad": 15.5,
      "viento_direccion": "NE",
      "visibilidad": "Buena",
      "estado_puerto": "abierto",
      "prediccion_5_dias": "Condiciones estables para los próximos 5 días...",
      "fuente": "CONAGUA"
    },
    "estadisticas": {
      "total": 4,
      "abierto": 2,
      "restricciones": 1,
      "cerrado": 1,
      "emergencia": 0
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 4,
      "totalPages": 1
    }
  }
}
```

### 2. Obtener Condición por ID

```http
GET /api/clima/:id
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Condición meteorológica obtenida exitosamente",
  "data": {
    "condicion": {
      "id": "bd8fc4e2-b824-499a-98d5-be143c6821ad",
      "fecha_hora": "2025-09-26T16:31:53.994Z",
      "oleaje": 1.2,
      "viento_velocidad": 15.5,
      "viento_direccion": "NE",
      "visibilidad": "Buena",
      "estado_puerto": "abierto",
      "prediccion_5_dias": "Condiciones estables para los próximos 5 días...",
      "fuente": "CONAGUA",
      "createdAt": "2025-09-26T16:31:53.994Z",
      "updatedAt": "2025-09-26T16:31:53.994Z"
    }
  }
}
```

### 3. Crear Condición Meteorológica 🔒

```http
POST /api/clima
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "fecha_hora": "2025-09-26T18:00:00Z",
  "oleaje": 1.5,
  "viento_velocidad": 18.0,
  "viento_direccion": "SE",
  "visibilidad": "buena",
  "estado_puerto": "abierto",
  "prediccion_5_dias": "Condiciones favorables",
  "fuente": "CONAGUA"
}
```

**Respuesta Exitosa (201):**

```json
{
  "status": "success",
  "message": "Condición meteorológica creada exitosamente",
  "data": {
    "condicion": {
      "id": "c6790ee5-530f-4605-9035-3ba12acede3e",
      "fecha_hora": "2025-09-26T18:00:00.000Z",
      "oleaje": 1.5,
      "viento_velocidad": 18.0,
      "viento_direccion": "SE",
      "visibilidad": "buena",
      "estado_puerto": "abierto",
      "prediccion_5_dias": "Condiciones favorables",
      "fuente": "CONAGUA",
      "createdAt": "2025-09-26T18:00:00.000Z",
      "updatedAt": "2025-09-26T18:00:00.000Z"
    }
  }
}
```

### 4. Actualizar Condición 🔒

```http
PUT /api/clima/:id
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "oleaje": 2.0,
  "viento_velocidad": 22.0,
  "visibilidad": "regular",
  "estado_puerto": "restricciones"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Condición meteorológica actualizada exitosamente",
  "data": {
    "condicion": {
      "id": "c6790ee5-530f-4605-9035-3ba12acede3e",
      "fecha_hora": "2025-09-26T18:00:00.000Z",
      "oleaje": 2.0,
      "viento_velocidad": 22.0,
      "viento_direccion": "SE",
      "visibilidad": "regular",
      "estado_puerto": "restricciones",
      "prediccion_5_dias": "Condiciones variables, precaución",
      "fuente": "CONAGUA",
      "createdAt": "2025-09-26T18:00:00.000Z",
      "updatedAt": "2025-09-26T18:30:00.000Z"
    }
  }
}
```

### 5. Eliminar Condición 🔒

```http
DELETE /api/clima/:id
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Condición meteorológica eliminada exitosamente"
}
```

### 6. Condición Actual

```http
GET /api/clima/actual
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Condición meteorológica actual obtenida exitosamente",
  "data": {
    "condicion": {
      "id": "bd8fc4e2-b824-499a-98d5-be143c6821ad",
      "fecha_hora": "2025-09-26T16:31:53.994Z",
      "oleaje": 1.2,
      "viento_velocidad": 15.5,
      "viento_direccion": "NE",
      "visibilidad": "Buena",
      "estado_puerto": "abierto",
      "prediccion_5_dias": "Condiciones estables para los próximos 5 días...",
      "fuente": "CONAGUA"
    },
    "tiempo_transcurrido_horas": 2,
    "necesita_actualizacion": false
  }
}
```

### 7. Predicción Meteorológica

```http
GET /api/clima/prediccion?dias=5
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Predicción meteorológica generada exitosamente",
  "data": {
    "prediccion": {
      "periodo_dias": 5,
      "promedio_oleaje": 1.4,
      "promedio_viento": 18.2,
      "tendencia_oleaje": "estable",
      "tendencia_viento": "decreciente",
      "recomendacion": "Condiciones favorables. Salidas recomendadas para todos los tipos de embarcación.",
      "condiciones_por_dia": [
        {
          "fecha": "2025-09-26T16:31:53.994Z",
          "oleaje": 1.2,
          "viento": 15.5,
          "estado_puerto": "abierto",
          "visibilidad": "Buena"
        }
      ]
    }
  }
}
```

### 8. Alertas Meteorológicas

```http
GET /api/clima/alertas
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Alertas meteorológicas obtenidas exitosamente",
  "data": {
    "alertas": [
      {
        "tipo": "oleaje_moderado",
        "severidad": "media",
        "mensaje": "Oleaje moderado: 1.5m. Precaución en salidas.",
        "valor": 1.5,
        "umbral": 1.5
      }
    ],
    "total_alertas": 1,
    "alertas_criticas": 0,
    "alertas_altas": 0,
    "alertas_medias": 1,
    "condicion_actual": {
      "fecha_hora": "2025-09-26T16:31:53.994Z",
      "oleaje": 1.5,
      "viento_velocidad": 18.0,
      "visibilidad": "Buena",
      "estado_puerto": "abierto"
    }
  }
}
```

### 9. Estadísticas Meteorológicas 🔒

```http
GET /api/clima/estadisticas?fecha_inicio=2025-09-01&fecha_fin=2025-09-30
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Estadísticas meteorológicas obtenidas exitosamente",
  "data": {
    "estadisticas": {
      "periodo": {
        "fecha_inicio": "2025-09-26T10:31:53.994Z",
        "fecha_fin": "2025-09-26T16:31:53.994Z",
        "total_registros": 4
      },
      "oleaje": {
        "promedio": 1.8,
        "minimo": 0.8,
        "maximo": 3.2,
        "registros_oleaje_alto": 2
      },
      "viento": {
        "promedio": 20.9,
        "minimo": 8.0,
        "maximo": 35.0,
        "registros_viento_fuerte": 1
      },
      "estado_puerto": {
        "abierto": 2,
        "restricciones": 1,
        "cerrado": 1,
        "emergencia": 0
      },
      "visibilidad": {
        "excelente": 1,
        "buena": 1,
        "regular": 1,
        "baja": 1
      }
    }
  }
}
```

---

## 📊 Dashboard (`/api/dashboard`)

> **Nota:** Todas las rutas requieren autenticación y rol CONANP 🔒.

### 1. Estadísticas Generales

```http
GET /api/dashboard/estadisticas
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Estadísticas generales obtenidas exitosamente",
  "data": {
    "estadisticas": {
      "sistema": {
        "fecha_actual": "2025-09-26T12:00:00.000Z",
        "uptime": 3600,
        "version": "1.0.0"
      },
      "usuarios": {
        "total": 15,
        "activos": 12,
        "por_vencer": 2,
        "vencidos": 1,
        "porcentaje_activos": 80
      },
      "embarcaciones": {
        "total": 25,
        "disponibles": 20,
        "en_uso": 3,
        "mantenimiento": 2,
        "porcentaje_disponibles": 80
      },
      "bloques": {
        "total": 42,
        "disponibles": 35,
        "llenos": 5,
        "cerrados": 2,
        "porcentaje_disponibles": 83
      },
      "salidas": {
        "total": 150,
        "programadas": 8,
        "en_curso": 3,
        "completadas": 135,
        "canceladas": 4,
        "este_mes": 45,
        "esta_semana": 12,
        "porcentaje_completadas": 90
      },
      "invitaciones": {
        "total": 50,
        "usadas": 15,
        "disponibles": 35,
        "porcentaje_usadas": 30
      },
      "clima": {
        "condicion_actual": {
          "fecha_hora": "2025-09-26T12:00:00.000Z",
          "oleaje": 1.2,
          "viento_velocidad": 15,
          "visibilidad": "buena",
          "estado_puerto": "abierto"
        }
      }
    }
  }
}
```

### 2. Ocupación por Día

```http
GET /api/dashboard/ocupacion?dias=7
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Ocupación por día obtenida exitosamente",
  "data": {
    "ocupacion_por_dia": [
      {
        "fecha": "2025-09-20",
        "bloques": [
          {
            "id": "uuid",
            "nombre": "Bloque Matutino",
            "hora_inicio": "08:00",
            "hora_fin": "12:00",
            "capacidad_total": 50,
            "capacidad_registrada": 35,
            "estado": "activo",
            "porcentaje_ocupacion": 70
          }
        ],
        "total_capacidad": 150,
        "total_ocupados": 105,
        "porcentaje_ocupacion": 70
      }
    ],
    "estadisticas": {
      "periodo_dias": 7,
      "fecha_inicio": "2025-09-20T00:00:00.000Z",
      "fecha_fin": "2025-09-26T12:00:00.000Z",
      "total_bloques": 21,
      "total_salidas": 45,
      "promedio_ocupacion": 75,
      "bloques_llenos": 3,
      "bloques_disponibles": 18
    }
  }
}
```

### 3. Estado de Embarcaciones

```http
GET /api/dashboard/embarcaciones
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Estado de embarcaciones obtenido exitosamente",
  "data": {
    "embarcaciones": [
      {
        "id": "uuid",
        "nombre": "Lancha María",
        "matricula": "ABC123",
        "capacidad": 20,
        "tipo": "menor",
        "estado": "disponible",
        "prestador": {
          "id": "uuid",
          "nombre": "Juan Pérez",
          "email": "juan@prestador.com",
          "telefono": "5551234567"
        }
      }
    ],
    "estadisticas": {
      "total": 25,
      "disponibles": 20,
      "en_uso": 3,
      "mantenimiento": 2,
      "por_tipo": {
        "menor": 15,
        "mayor": 10
      }
    },
    "por_prestador": [
      {
        "prestador": "uuid",
        "embarcaciones": [
          {
            "id": "uuid",
            "nombre": "Lancha María",
            "estado": "disponible"
          }
        ],
        "total": 5,
        "disponibles": 4,
        "en_uso": 1,
        "mantenimiento": 0
      }
    ]
  }
}
```

### 4. Estado de Permisos

```http
GET /api/dashboard/permisos
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Estado de permisos obtenido exitosamente",
  "data": {
    "estadisticas": {
      "total_prestadores": 12,
      "vigentes": 8,
      "por_vencer": 3,
      "vencidos": 1,
      "vencen_proximos_30_dias": 2
    },
    "usuarios_por_vencer": [
      {
        "id": "uuid",
        "nombre": "María García",
        "email": "maria@prestador.com",
        "fechaVencimientoPermiso": "2025-10-15T00:00:00.000Z",
        "estadoPermiso": "por_vencer",
        "diasNotificacion": 7
      }
    ],
    "usuarios_vencidos": [
      {
        "id": "uuid",
        "nombre": "Carlos López",
        "email": "carlos@prestador.com",
        "fechaVencimientoPermiso": "2025-09-15T00:00:00.000Z",
        "estadoPermiso": "vencido",
        "diasNotificacion": 30
      }
    ],
    "usuarios_vencen_proximos_30_dias": [
      {
        "id": "uuid",
        "nombre": "Ana Rodríguez",
        "email": "ana@prestador.com",
        "fechaVencimientoPermiso": "2025-10-20T00:00:00.000Z",
        "estadoPermiso": "vigente",
        "diasNotificacion": 15
      }
    ],
    "todos_los_usuarios": [
      {
        "id": "uuid",
        "nombre": "Juan Pérez",
        "email": "juan@prestador.com",
        "fechaVencimientoPermiso": "2026-09-26T00:00:00.000Z",
        "estadoPermiso": "vigente",
        "diasNotificacion": 30
      }
    ]
  }
}
```

### 5. Resumen Meteorológico

```http
GET /api/dashboard/clima?dias=7
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Resumen meteorológico obtenido exitosamente",
  "data": {
    "condicion_actual": {
      "id": "uuid",
      "fecha_hora": "2025-09-26T12:00:00.000Z",
      "oleaje": 1.2,
      "viento_velocidad": 15,
      "visibilidad": "buena",
      "estado_puerto": "abierto"
    },
    "promedios": {
      "oleaje": 1.1,
      "viento": 12.5
    },
    "estado_puerto": {
      "abierto": 5,
      "restricciones": 1,
      "cerrado": 0,
      "emergencia": 0
    },
    "alertas": [
      {
        "tipo": "oleaje_alto",
        "severidad": "alta",
        "mensaje": "Oleaje alto: 2.8m"
      }
    ],
    "condiciones_recientes": [
      {
        "id": "uuid",
        "fecha_hora": "2025-09-25T12:00:00.000Z",
        "oleaje": 1.0,
        "viento_velocidad": 12,
        "estado_puerto": "abierto"
      }
    ],
    "periodo_dias": 7
  }
}
```

### 6. Alertas del Sistema

```http
GET /api/dashboard/alertas
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Alertas del sistema obtenidas exitosamente",
  "data": {
    "alertas": [
      {
        "tipo": "permisos_vencidos",
        "severidad": "alta",
        "mensaje": "1 prestador(es) con permisos vencidos",
        "accion": "Revisar y renovar permisos"
      },
      {
        "tipo": "clima_oleaje_alto",
        "severidad": "alta",
        "mensaje": "Oleaje alto: 2.8m",
        "accion": "Evaluar suspensión de salidas"
      }
    ],
    "estadisticas": {
      "total": 3,
      "criticas": 0,
      "altas": 2,
      "medias": 1,
      "bajas": 0
    },
    "fecha_consulta": "2025-09-26T12:00:00.000Z"
  }
}
```

---

## 🎫 Invitaciones (`/api/invitaciones`)

> **Nota:** Las rutas marcadas con 🔒 requieren autenticación y rol CONANP. Las rutas marcadas con 🌐 son públicas.

### 1. Listar Invitaciones 🔒

```http
GET /api/invitaciones?page=1&limit=10&usada=false
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Invitaciones obtenidas exitosamente",
  "data": {
    "invitaciones": [
      {
        "id": "uuid",
        "codigo": "INV2025",
        "email": "usuario@ejemplo.com",
        "rol": "PRESTADOR",
        "expira_en": "2025-12-31T23:59:59.000Z",
        "usada": false,
        "creada_por": "uuid-creador",
        "created_at": "2025-09-26T12:00:00.000Z",
        "updated_at": "2025-09-26T12:00:00.000Z",
        "creador": {
          "id": "uuid",
          "nombre": "Admin CONANP",
          "email": "admin@conanp.gob.mx"
        },
        "usuario": null
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 50,
      "items_per_page": 10,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 2. Obtener Invitación por ID 🔒

```http
GET /api/invitaciones/:id
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Invitación obtenida exitosamente",
  "data": {
    "invitacion": {
      "id": "uuid",
      "codigo": "INV2025",
      "email": "usuario@ejemplo.com",
      "rol": "PRESTADOR",
      "expira_en": "2025-12-31T23:59:59.000Z",
      "usada": false,
      "creada_por": "uuid-creador",
      "creador": {
        "id": "uuid",
        "nombre": "Admin CONANP",
        "email": "admin@conanp.gob.mx"
      },
      "usuario": null
    }
  }
}
```

### 3. Crear Invitación 🔒

```http
POST /api/invitaciones
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "codigo": "INV2025",
  "fecha_expiracion": "2025-12-31T23:59:59.000Z"
}
```

**Respuesta Exitosa (201):**

```json
{
  "status": "success",
  "message": "Invitación creada exitosamente",
  "data": {
    "invitacion": {
      "id": "uuid",
      "codigo": "INV2025",
      "email": "",
      "rol": "PRESTADOR",
      "expira_en": "2025-12-31T23:59:59.000Z",
      "usada": false,
      "creada_por": "uuid-creador",
      "creador": {
        "id": "uuid",
        "nombre": "Admin CONANP",
        "email": "admin@conanp.gob.mx"
      }
    }
  }
}
```

### 4. Actualizar Invitación 🔒

```http
PUT /api/invitaciones/:id
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "fecha_expiracion": "2025-12-31T23:59:59.000Z"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Invitación actualizada exitosamente",
  "data": {
    "invitacion": {
      "id": "uuid",
      "codigo": "INV2025",
      "email": "",
      "rol": "PRESTADOR",
      "expira_en": "2025-12-31T23:59:59.000Z",
      "usada": false,
      "creada_por": "uuid-creador",
      "creador": {
        "id": "uuid",
        "nombre": "Admin CONANP",
        "email": "admin@conanp.gob.mx"
      }
    }
  }
}
```

### 5. Eliminar Invitación 🔒

```http
DELETE /api/invitaciones/:id
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Invitación eliminada exitosamente"
}
```

### 6. Validar Código 🌐

```http
POST /api/invitaciones/validar
```

**Body:**

```json
{
  "codigo": "INV2025"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Código de invitación válido",
  "data": {
    "invitacion": {
      "id": "uuid",
      "codigo": "INV2025",
      "email": "",
      "rol": "PRESTADOR",
      "creada_por": "uuid-creador",
      "expira_en": "2025-12-31T23:59:59.000Z"
    }
  }
}
```

### 7. Usar Invitación 🌐

```http
POST /api/invitaciones/:id/usar
```

**Body:**

```json
{
  "usuario_id": "uuid-del-usuario"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Invitación marcada como usada exitosamente",
  "data": {
    "invitacion": {
      "id": "uuid",
      "codigo": "INV2025",
      "email": "uuid-del-usuario",
      "rol": "PRESTADOR",
      "expira_en": "2025-12-31T23:59:59.000Z",
      "usada": true,
      "creada_por": "uuid-creador",
      "creador": {
        "id": "uuid",
        "nombre": "Admin CONANP",
        "email": "admin@conanp.gob.mx"
      },
      "usuario": {
        "id": "uuid",
        "nombre": "Usuario Nuevo",
        "email": "usuario@ejemplo.com"
      }
    }
  }
}
```

### 8. Estadísticas de Invitaciones 🔒

```http
GET /api/invitaciones/estadisticas
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Estadísticas de invitaciones obtenidas exitosamente",
  "data": {
    "estadisticas": {
      "generales": {
        "total": 50,
        "usadas": 15,
        "disponibles": 30,
        "expiradas": 5,
        "porcentaje_usadas": 30
      },
      "este_mes": {
        "creadas": 25,
        "usadas": 10
      },
      "top_creadores": [
        {
          "creador": {
            "id": "uuid",
            "nombre": "Admin CONANP",
            "email": "admin@conanp.gob.mx"
          },
          "total_creadas": 25
        }
      ]
    }
  }
}
```

---

## 🔑 Credenciales de Prueba

### Administrador CONANP

- **Email:** `admin@conanp.gob.mx`
- **Contraseña:** `Admin123!`

### Prestadores de Servicio

- **Email:** `juan.perez@ejemplo.com`
- **Contraseña:** `Prestador123!`

- **Email:** `maria.gonzalez@ejemplo.com`
- **Contraseña:** `Prestador123!`

- **Email:** `carlos.rodriguez@ejemplo.com`
- **Contraseña:** `Prestador123!`

### Códigos de Invitación Válidos

- `PRESTADOR001` - Para prestadores de servicio
- `PRESTADOR002` - Para prestadores de servicio
- `CONANP001` - Para administradores CONANP

---

## 📝 Notas Importantes

### Autenticación

- Todos los endpoints (excepto los marcados como 🌐) requieren el header `Authorization: Bearer <token>`
- Los tokens JWT expiran en 24 horas
- Para obtener un token, usar el endpoint de login

### Permisos

- 🔒 **Solo CONANP**: Requiere rol de administrador
- **Prestadores**: Pueden acceder a sus propios recursos y operaciones básicas
- 🌐 **Público**: No requiere autenticación

### Validaciones

- Todos los endpoints tienen validaciones robustas
- Los errores de validación devuelven códigos 400 con detalles específicos
- Los emails deben ser únicos en el sistema
- Las contraseñas deben cumplir criterios de seguridad

### Paginación

- Los endpoints de listado soportan paginación con `page` y `limit`
- El límite máximo es 100 elementos por página
- La respuesta incluye información de paginación

### Filtros

- Muchos endpoints soportan filtros por fecha, estado, tipo, etc.
- Consultar la documentación específica de cada endpoint para filtros disponibles

### Estados Comunes

- **Bloques**: `activo`, `lleno`, `suspendido_por_clima`, `cerrado_capitaria`, `plantilla`
- **Embarcaciones**: `disponible`, `en_uso`, `mantenimiento`
- **Salidas**: `programada`, `en_curso`, `completada`, `cancelada`, `cancelada_por_clima`, `cancelada_capitaria`
- **Puerto**: `abierto`, `restricciones`, `cerrado`, `emergencia`
- **Permisos**: `vigente`, `por_vencer`, `vencido`, `suspendido`

### Destinos Disponibles

- **Isla de Lobos**: Requiere `bloque_id`, validación de capacidad automática
- **Arrecife Tuxpan**: Requiere `hora`, sin restricciones de bloques
- **Arrecife de en Medio**: Requiere `hora`, sin restricciones de bloques
- **Arrecife Tanhuijo**: Requiere `hora`, sin restricciones de bloques

### Flujos de Trabajo

#### **Para Isla de Lobos:**

1. Prestador selecciona destino: "Isla de Lobos"
2. Frontend consulta: `GET /api/bloques?fecha=2025-10-15`
3. Backend devuelve 3 bloques SIEMPRE con capacidad calculada
4. Prestador selecciona bloque disponible
5. `POST /api/salidas` con `bloque_id`

#### **Para Arrecifes:**

1. Prestador selecciona destino: "Arrecife Tuxpan"
2. Prestador ingresa hora manualmente
3. `POST /api/salidas` con `hora` (sin `bloque_id`)

---

## 🚨 Códigos de Error Comunes

### 400 - Bad Request

```json
{
  "status": "error",
  "message": "Errores de validación encontrados",
  "error": "VALIDATION_ERROR",
  "data": {
    "errors": [
      {
        "field": "email",
        "message": "Debe ser un email válido",
        "value": "email-invalido"
      }
    ],
    "count": 1
  }
}
```

### 401 - Unauthorized

```json
{
  "status": "error",
  "message": "Token de acceso requerido",
  "error": "UNAUTHORIZED"
}
```

### 403 - Forbidden

```json
{
  "status": "error",
  "message": "Acceso denegado. Se requiere rol de CONANP",
  "error": "FORBIDDEN"
}
```

### 404 - Not Found

```json
{
  "status": "error",
  "message": "Recurso no encontrado",
  "error": "NOT_FOUND"
}
```

### 409 - Conflict

```json
{
  "status": "error",
  "message": "El recurso ya existe",
  "error": "RESOURCE_ALREADY_EXISTS"
}
```

### 500 - Internal Server Error

```json
{
  "status": "error",
  "message": "Error interno del servidor",
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## 🔐 Recuperación de Contraseña

### Flujo Completo

1. **Solicitar Recuperación**

   ```bash
   POST /api/auth/forgot-password
   ```

   - Envía email del usuario
   - Genera token de 64 caracteres
   - Token expira en 15 minutos

2. **Resetear Contraseña**
   ```bash
   POST /api/auth/reset-password
   ```
   - Usa el token recibido
   - Establece nueva contraseña
   - Limpia el token automáticamente

### Características de Seguridad

- **Tokens seguros**: Generados con `randomBytes(32)`
- **Expiración**: 15 minutos de validez
- **Limpieza automática**: Tokens se eliminan después del uso
- **Mensajes uniformes**: Por seguridad, mismo mensaje para emails existentes/no existentes
- **Validaciones estrictas**: Contraseñas deben cumplir criterios de seguridad

---

## 💎 Sistema de Brazaletes (`/api/brazaletes`)

> **Nota:** Todas las rutas requieren autenticación. Las rutas marcadas con 🔒 requieren rol CONANP.

### 📦 Gestión de Inventario

#### 1. Obtener Inventario Actual

```http
GET /api/brazaletes/inventario
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "inventario": {
      "total_disponibles": 250,
      "por_tipo": {
        "isla": 150,
        "arrecife": 100
      },
      "stock_bajo": false,
      "lotes_activos": 5,
      "valor_inventario": 125000.0
    }
  }
}
```

#### 2. Crear Lote de Brazaletes 🔒

```http
POST /api/brazaletes/lotes
```

**Headers:** `Authorization: Bearer <token>`

**Opciones de creación:**

- **Generación automática**: Especifica solo `cantidad_total`
- **Rango personalizado**: Especifica `primer_numero` y `ultimo_numero` (se calcula automáticamente `cantidad_total`)

**Body (Generación automática):**

```json
{
  "numero_lote": "LOTE-2024-001",
  "cantidad_total": 100,
  "tipo": "universal",
  "fecha_compra": "2024-09-29T00:00:00.000Z",
  "fecha_vencimiento": "2025-09-29T00:00:00.000Z",
  "costo_unitario": 250.0,
  "precio_venta": 500.0,
  "proveedor": "Proveedor Brazaletes SA",
  "observaciones": "Lote para temporada alta"
}
```

**Body (Rango personalizado):**

```json
{
  "numero_lote": "LOTE-2024-002",
  "primer_numero": 1000,
  "ultimo_numero": 1099,
  "tipo": "universal",
  "fecha_compra": "2024-09-29T00:00:00.000Z",
  "fecha_vencimiento": "2025-09-29T00:00:00.000Z",
  "costo_unitario": 250.0,
  "precio_venta": 500.0,
  "proveedor": "Proveedor Brazaletes SA",
  "observaciones": "Lote con numeración específica"
}
```

**Respuesta Exitosa (201):**

```json
{
  "success": true,
  "data": {
    "lote": {
      "id": "uuid",
      "numero_lote": "LOTE-2024-001",
      "cantidad_total": 100,
      "cantidad_disponibles": 100,
      "cantidad_vendidos": 0,
      "cantidad_utilizados": 0,
      "tipo": "universal",
      "fecha_compra": "2024-09-29T00:00:00.000Z",
      "fecha_vencimiento": "2025-09-29T00:00:00.000Z",
      "costo_unitario": 250.0,
      "precio_venta": 500.0,
      "proveedor": "Proveedor Brazaletes SA",
      "estado": "activo",
      "observaciones": "Lote para temporada alta",
      "created_at": "2024-09-29T12:00:00.000Z",
      "updated_at": "2024-09-29T12:00:00.000Z"
    },
    "brazaletes_generados": 100,
    "rango_numeros": {
      "primer_numero": 1000,
      "ultimo_numero": 1099,
      "año": 2024
    },
    "message": "Lote creado exitosamente"
  }
}
```

#### 3. Listar Lotes

```http
GET /api/brazaletes/lotes?page=1&limit=10&tipo=isla&estado=activo
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "lotes": [
      {
        "id": "uuid",
        "numero_lote": "LOTE-2024-001",
        "cantidad_total": 100,
        "cantidad_disponibles": 75,
        "cantidad_vendidos": 25,
        "cantidad_utilizados": 15,
        "tipo": "universal",
        "fecha_compra": "2024-09-29T00:00:00.000Z",
        "fecha_vencimiento": "2025-09-29T00:00:00.000Z",
        "costo_unitario": 250.0,
        "precio_venta": 500.0,
        "proveedor": "Proveedor Brazaletes SA",
        "estado": "activo",
        "observaciones": "Lote para temporada alta",
        "created_at": "2024-09-29T12:00:00.000Z",
        "updated_at": "2024-09-29T12:00:00.000Z",
        "brazaletes": [
          {
            "id": "uuid-brazalete",
            "estado": "asignado"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

### 💰 Venta a Prestadores

#### 4. Vender Brazaletes a Prestador 🔒

```http
POST /api/brazaletes/venta
```

**Headers:** `Authorization: Bearer <token>`

**Nota importante:** Las ventas de brazaletes solo pueden ser realizadas por personal de CONANP, ya que el pago debe procesarse mediante formatos gubernamentales oficiales. Los prestadores no tienen acceso directo a esta funcionalidad.

**Body:**

```json
{
  "prestador_id": "uuid-prestador",
  "cantidad": 10,
  "tipo": "universal",
  "metodo_pago": "transferencia"
}
```

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "venta": {
      "id": "uuid",
      "prestador_id": "uuid-prestador",
      "lote_id": "uuid-lote",
      "cantidad": 10,
      "precio_unitario": 500.0,
      "total": 5000.0,
      "fecha_venta": "2024-09-29T12:00:00.000Z",
      "metodo_pago": "transferencia",
      "estado_pago": "pendiente"
    },
    "rango_brazaletes": {
      "numero_inicial": 1001,
      "numero_final": 1010,
      "cantidad_total": 10,
      "primer_codigo": "BRZ-2024-001001",
      "ultimo_codigo": "BRZ-2024-001010"
    },
    "brazaletes_asignados": [
      "BRZ-2024-001001",
      "BRZ-2024-001002",
      "BRZ-2024-001003",
      "BRZ-2024-001004",
      "BRZ-2024-001005",
      "BRZ-2024-001006",
      "BRZ-2024-001007",
      "BRZ-2024-001008",
      "BRZ-2024-001009",
      "BRZ-2024-001010"
    ],
    "prestador": {
      "id": "uuid-prestador",
      "nombre": "Juan Pérez",
      "email": "juan@prestador.com"
    },
    "lote": {
      "numero_lote": "LOTE-2024-001",
      "tipo": "universal"
    },
    "message": "Venta realizada exitosamente"
  }
}
```

#### 5. Obtener Brazaletes de un Prestador

```http
GET /api/brazaletes/prestador/:id
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "prestador": {
      "id": "uuid-prestador",
      "nombre": "Juan Pérez",
      "email": "juan@prestador.com"
    },
    "brazaletes": {
      "disponibles": 25,
      "asignados": 25,
      "utilizados": 15,
      "por_tipo": {
        "isla": 20,
        "arrecife": 20
      }
    },
    "detalle": [
      {
        "id": "uuid-brazalete",
        "codigo": "BRZ-2024-000001",
        "tipo": "universal",
        "estado": "asignado",
        "precio": 500.0,
        "fecha_creacion": "2024-09-29T00:00:00.000Z",
        "fecha_asignacion": "2024-09-29T12:00:00.000Z",
        "fecha_uso": null,
        "turista_nacionalidad": null,
        "turista_edad": null,
        "lote": {
          "numero_lote": "LOTE-2024-001",
          "tipo": "isla"
        },
        "salida": null
      }
    ]
  }
}
```

#### 6. Mis Brazaletes (Prestador Autenticado)

```http
GET /api/brazaletes/mis-brazaletes
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "prestador": {
      "id": "uuid-prestador",
      "nombre": "Juan Pérez",
      "email": "juan@prestador.com"
    },
    "brazaletes": {
      "disponibles": 25,
      "asignados": 25,
      "utilizados": 15,
      "por_tipo": {
        "isla": 20,
        "arrecife": 20
      }
    },
    "detalle": [
      {
        "id": "uuid-brazalete",
        "codigo": "BRZ-2024-000001",
        "tipo": "universal",
        "estado": "asignado",
        "precio": 500.0,
        "fecha_creacion": "2024-09-29T00:00:00.000Z",
        "fecha_asignacion": "2024-09-29T12:00:00.000Z",
        "fecha_uso": null,
        "turista_nacionalidad": null,
        "turista_edad": null,
        "lote": {
          "numero_lote": "LOTE-2024-001",
          "tipo": "isla"
        },
        "salida": null
      }
    ]
  }
}
```

### 🚢 Uso en Salidas

#### 7. Registrar Uso de Brazaletes en Salida

```http
POST /api/brazaletes/uso
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "salida_id": "uuid-salida",
  "brazaletes": [
    {
      "codigo": "BRZ-2024-000001",
      "turista_nacionalidad": "nacional",
      "turista_edad": 35
    },
    {
      "codigo": "BRZ-2024-000002",
      "turista_nacionalidad": "internacional",
      "turista_edad": 42
    }
  ]
}
```

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "salida_id": "uuid-salida",
    "brazaletes_utilizados": 2,
    "errores": null,
    "message": "2 brazaletes utilizados exitosamente"
  }
}
```

#### 8. Obtener Brazaletes Utilizados en una Salida

```http
GET /api/brazaletes/uso/salida/:id
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "salida": {
      "id": "uuid-salida",
      "fecha": "2024-09-29",
      "numero_pasajeros": 25
    },
    "brazaletes_utilizados": [
      {
        "id": "uuid-brazalete",
        "codigo": "BRZ-2024-000001",
        "tipo": "universal",
        "estado": "utilizado",
        "precio": 500.0,
        "fecha_uso": "2024-09-29T14:00:00.000Z",
        "turista_nacionalidad": "nacional",
        "turista_edad": 35,
        "lote": {
          "numero_lote": "LOTE-2024-001",
          "tipo": "isla"
        },
        "prestador": {
          "nombre": "Juan Pérez",
          "email": "juan@prestador.com"
        }
      }
    ],
    "estadisticas": {
      "total_brazaletes": 2,
      "por_nacionalidad": {
        "locales": 0,
        "nacionales": 1,
        "internacionales": 1
      }
    }
  }
}
```

### 📊 Estadísticas y Reportes

#### 9. Obtener Estadísticas Generales

```http
GET /api/brazaletes/estadisticas?fecha_inicio=2024-09-01&fecha_fin=2024-09-30
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "periodo": {
      "fecha_inicio": "2024-09-01",
      "fecha_fin": "2024-09-30"
    },
    "inventario": {
      "total_comprados": 500,
      "total_disponibles": 250,
      "total_vendidos": 200,
      "total_utilizados": 150
    },
    "ingresos": {
      "ventas_totales": 100000.0,
      "por_mes": [
        {
          "mes": "2024-09",
          "cantidad": 200,
          "monto": 100000.0
        }
      ]
    },
    "utilizacion": {
      "por_tipo": {
        "isla": 90,
        "arrecife": 60
      },
      "por_nacionalidad": {
        "locales": 50,
        "nacionales": 70,
        "internacionales": 30
      }
    }
  }
}
```

#### 10. Obtener Alertas del Sistema

```http
GET /api/brazaletes/alertas
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "alertas": [
      {
        "tipo": "stock_bajo",
        "severidad": "alta",
        "mensaje": "Solo quedan 25 brazaletes disponibles (5% del inventario)",
        "fecha": "2024-09-29T12:00:00.000Z"
      },
      {
        "tipo": "lote_por_vencer",
        "severidad": "media",
        "mensaje": "Lote LOTE-2024-001 vence en 15 días",
        "fecha": "2024-09-29T12:00:00.000Z"
      },
      {
        "tipo": "prestador_sin_stock",
        "severidad": "media",
        "mensaje": "Juan Pérez tiene solo 3 brazaletes disponibles",
        "fecha": "2024-09-29T12:00:00.000Z"
      }
    ]
  }
}
```

#### 11. Generar Reporte de Ventas

```http
GET /api/brazaletes/reportes/ventas?fecha_inicio=2024-09-01&fecha_fin=2024-09-30&prestador_id=uuid
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "periodo": {
      "fecha_inicio": "2024-09-01",
      "fecha_fin": "2024-09-30"
    },
    "resumen": {
      "total_ventas": 15,
      "total_brazaletes": 200,
      "total_ingresos": 100000.0
    },
    "ventas_detalle": [
      {
        "id": "uuid-venta",
        "prestador_id": "uuid-prestador",
        "lote_id": "uuid-lote",
        "cantidad": 10,
        "precio_unitario": 500.0,
        "total": 5000.0,
        "fecha_venta": "2024-09-15T12:00:00.000Z",
        "metodo_pago": "transferencia",
        "estado_pago": "pagado",
        "prestador": {
          "nombre": "Juan Pérez",
          "email": "juan@prestador.com",
          "telefono": "+52 229 123 4567"
        },
        "lote": {
          "numero_lote": "LOTE-2024-001",
          "tipo": "isla"
        }
      }
    ],
    "ventas_por_prestador": [
      {
        "prestador": {
          "nombre": "Juan Pérez",
          "email": "juan@prestador.com"
        },
        "total_ventas": 3,
        "total_brazaletes": 30,
        "total_ingresos": 15000.0
      }
    ]
  }
}
```

#### 12. Generar Reporte de Utilización

```http
GET /api/brazaletes/reportes/utilizacion?fecha_inicio=2024-09-01&fecha_fin=2024-09-30&tipo=isla
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "periodo": {
      "fecha_inicio": "2024-09-01",
      "fecha_fin": "2024-09-30"
    },
    "resumen": {
      "total_utilizados": 150,
      "por_nacionalidad": {
        "locales": 50,
        "nacionales": 70,
        "internacionales": 30,
        "sin_especificar": 0
      },
      "por_tipo": {
        "isla": 90,
        "arrecife": 60
      },
      "estadisticas_edad": {
        "promedio": 32,
        "minima": 18,
        "maxima": 65,
        "total_con_edad": 140
      }
    },
    "utilizacion_detalle": [
      {
        "id": "uuid-brazalete",
        "codigo": "BRZ-2024-000001",
        "tipo": "universal",
        "estado": "utilizado",
        "precio": 500.0,
        "fecha_uso": "2024-09-15T14:00:00.000Z",
        "turista_nacionalidad": "nacional",
        "turista_edad": 35,
        "prestador": {
          "nombre": "Juan Pérez",
          "email": "juan@prestador.com"
        },
        "lote": {
          "numero_lote": "LOTE-2024-001",
          "tipo": "isla"
        }
      }
    ]
  }
}
```

### 🔧 Utilidades

#### 13. Dashboard para CONANP 🔒

```http
GET /api/brazaletes/dashboard
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "inventario": {
      "total_disponibles": 250,
      "por_tipo": {
        "isla": 150,
        "arrecife": 100
      },
      "stock_bajo": false,
      "lotes_activos": 5,
      "valor_inventario": 125000.0
    }
  }
}
```

#### 14. Búsqueda de Brazaletes

```http
GET /api/brazaletes/search?codigo=BRZ-2024&tipo=isla&estado=asignado&prestador_id=uuid
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "message": "Funcionalidad de búsqueda - Por implementar",
  "data": {
    "filtros": {
      "codigo": "BRZ-2024",
      "tipo": "universal",
      "estado": "asignado",
      "prestador_id": "uuid"
    }
  }
}
```

#### 15. Health Check del Sistema

```http
GET /api/brazaletes/health
```

**Headers:** `Authorization: Bearer <token>`

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "message": "Sistema de brazaletes operativo",
  "timestamp": "2024-09-29T12:00:00.000Z"
}
```

### Estados y Enumeraciones

#### Estados de Lotes

- `activo` - Lote disponible para venta
- `agotado` - Lote sin brazaletes disponibles
- `vencido` - Lote expirado por fecha de vencimiento
- `cancelado` - Lote cancelado manualmente

#### Estados de Brazaletes

- `disponible` - Brazalete en inventario de CONANP
- `asignado` - Brazalete vendido a prestador
- `utilizado` - Brazalete usado en una salida
- `perdido` - Brazalete reportado como perdido

#### Estados de Pago (Ventas)

- `pendiente` - Venta pendiente de pago
- `pagado` - Venta pagada completamente
- `cancelado` - Venta cancelada

#### Tipos de Brazaletes

- `universal` - Brazaletes universales para todas las actividades (isla y arrecife)

#### Métodos de Pago

- `efectivo` - Pago en efectivo
- `transferencia` - Transferencia bancaria
- `credito` - Tarjeta de crédito
- `debito` - Tarjeta de débito

#### Nacionalidades de Turistas

- `local` - Turista local (Veracruz)
- `nacional` - Turista nacional (México)
- `internacional` - Turista extranjero

### Códigos de Brazaletes

Los códigos de brazaletes siguen el formato: `BRZ-YYYY-NNNNNN`

- **BRZ**: Prefijo identificador
- **YYYY**: Año de creación
- **NNNNNN**: Número secuencial de 6 dígitos

**Ejemplos:**

- `BRZ-2024-000001`
- `BRZ-2024-000025`
- `BRZ-2025-000001`

---

**Última actualización:** 1 de Octubre, 2025  
**Versión:** 4.0.0 - Sistema de destinos múltiples con bloques predefinidos

### 🆕 Novedades en v4.0.0

#### **Sistema de Destinos Múltiples**

- ✅ Soporte para Isla de Lobos + 3 Arrecifes
- ✅ Validación condicional según destino
- ✅ Bloques predefinidos permanentes
- ✅ Capacidad calculada en tiempo real

#### **Bloques Predefinidos**

- ✅ 3 bloques siempre disponibles
- ✅ No más "No hay bloques para esta fecha"
- ✅ Capacidad dinámica basada en salidas registradas
- ✅ Estados automáticos (activo/lleno/cerrado)

#### **Flujos Diferenciados**

- ✅ **Isla de Lobos**: Con bloques horarios y validación de capacidad
- ✅ **Arrecifes**: Con hora libre y sin restricciones de bloques
- ✅ Backend maneja toda la lógica de negocio automáticamente

#### **Mejoras de UX**

- ✅ Endpoints más intuitivos y consistentes
- ✅ Respuestas estructuradas con información completa
- ✅ Validaciones robustas con mensajes claros
- ✅ Soporte completo para múltiples tipos de salidas
