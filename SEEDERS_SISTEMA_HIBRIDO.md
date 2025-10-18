# Seeders del Sistema Híbrido de Bloques

## Orden de Ejecución Recomendado

Los seeders han sido actualizados para soportar el nuevo sistema híbrido de bloques con plantillas. **Es importante ejecutarlos en el orden correcto**.

### 1. Seeders Base (Requeridos)
```bash
# 1. Usuarios y prestadores
npm run seed -- --seed 20241225000001-demo-users.js

# 2. Invitaciones 
npm run seed -- --seed 20241225000002-demo-invitations.js

# 3. PLANTILLAS DE BLOQUES (NUEVO - EJECUTAR PRIMERO)
npm run seed -- --seed 20241225000003-plantillas-bloque.js

# 4. Embarcaciones
npm run seed -- --seed 20241225000003-demo-embarcaciones.js
```

### 2. Seeders de Bloques (Varios Enfoques)

Tienes **3 opciones** para crear bloques:

#### Opción A: Bloques Demo (7 días, basados en plantillas)
```bash
npm run seed -- --seed 20241225000004-demo-bloques.js
```
- **Características**: Bloques independientes (`es_plantilla=false`) 
- **Período**: Próximos 7 días
- **Destino**: Solo Isla de Lobos
- **Datos**: Copia los datos de las plantillas pero los almacena independientemente

#### Opción B: Bloques Híbridos Demo (14 días, referencias a plantillas) 
```bash
npm run seed -- --seed 20250105000002-bloques-hibridos-demo.js
```
- **Características**: Bloques híbridos (`es_plantilla=true`) ✨
- **Período**: Próximos 14 días  
- **Destinos**: Todos los destinos con plantillas activas
- **Datos**: Los campos `nombre`, `hora_inicio`, etc. son NULL y se obtienen de PlantillaBloque

#### Opción C: Dataset Grande (30 días, híbrido inteligente)
```bash
npm run seed -- --seed 20250105000000-bloques-septiembre-octubre-2025.js
```
- **Características**: Híbrido si encuentra plantillas, independiente si no
- **Período**: 05/09/2025 - 05/10/2025 
- **Destino**: Solo Isla de Lobos
- **Datos**: Detecta automáticamente si usar plantillas o modo clásico

### 3. Seeders Finales
```bash
# 5. Condiciones meteorológicas
npm run seed -- --seed 20241225000005-demo-condiciones-meteorologicas.js

# 6. Salidas (usar después de crear bloques)
npm run seed -- --seed 20241225000006-demo-salidas.js
```

## Diferencias entre Enfoques

### 🔧 Bloques Independientes (`es_plantilla=false`)
```json
{
  "id": "uuid",
  "nombre": "Snorkel Mañana",      // ← Valor copiado
  "hora_inicio": "08:00:00",       // ← Valor copiado  
  "hora_fin": "11:00:00",          // ← Valor copiado
  "capacidad_total": 24,           // ← Valor copiado
  "destino": "Isla de Lobos",      // ← Valor copiado
  "es_plantilla": false,           // ← Independiente
  "plantilla_id": null             // ← No referencia plantilla
}
```

### ✨ Bloques Híbridos (`es_plantilla=true`)
```json
{
  "id": "uuid", 
  "nombre": null,                  // ← Se obtiene de PlantillaBloque
  "hora_inicio": null,             // ← Se obtiene de PlantillaBloque
  "hora_fin": null,                // ← Se obtiene de PlantillaBloque
  "capacidad_total": null,         // ← Se obtiene de PlantillaBloque
  "destino": null,                 // ← Se obtiene de PlantillaBloque
  "es_plantilla": true,            // ← Híbrido
  "plantilla_id": "plantilla-uuid" // ← Referencia a PlantillaBloque
}
```

## Beneficios del Sistema Híbrido

### 🎯 Escalabilidad
```bash
# Cambiar nombre en 1 plantilla afecta automáticamente a 1000+ bloques
PUT /api/plantillas-bloque/123
{
  "nombre": "Snorkel Premium Mañana"  
}
# ↑ Todos los bloques con plantilla_id=123 reflejan el cambio inmediatamente
```

### 🔄 Compatibilidad Total
```bash
# El frontend sigue funcionando igual - misma respuesta
GET /api/bloques/456

# Respuesta híbrida (automática):
{
  "id": "456",
  "nombre": "Snorkel Premium Mañana",    // ← De PlantillaBloque
  "hora_inicio": "08:00:00",             // ← De PlantillaBloque  
  "capacidad_total": 24,                 // ← De PlantillaBloque
  "capacidad_registrada": 8,             // ← Del Bloque específico
  "es_plantilla": true,
  "plantilla_id": "123"
}
```

## Comandos de Limpieza

```bash
# Limpiar solo bloques híbridos
npx sequelize-cli db:seed:undo --seed 20250105000002-bloques-hibridos-demo.js

# Limpiar todo y empezar desde cero
npm run clean-seeders
```

## Pruebas Recomendadas

Después de ejecutar los seeders híbridos:

```bash
# 1. Ver plantillas disponibles
curl http://localhost:3000/api/plantillas-bloque

# 2. Ver bloque híbrido (datos vienen de plantilla)
curl http://localhost:3000/api/bloques/[ID]

# 3. Cambiar plantilla y ver efecto en bloques
curl -X PUT http://localhost:3000/api/plantillas-bloque/[PLANTILLA_ID] \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Nuevo Nombre", "capacidad_total": 30}'

# 4. Verificar que los bloques reflejan el cambio
curl http://localhost:3000/api/bloques/[ID]
```

## Migración Gradual

Puedes migrar gradualmente:
1. **Fase 1**: Mantener bloques independientes existentes
2. **Fase 2**: Crear nuevas plantillas  
3. **Fase 3**: Crear futuros bloques usando el sistema híbrido
4. **Fase 4**: Migrar bloques antiguos (opcional)

El sistema es totalmente retrocompatible y admite ambos enfoques simultáneamente.