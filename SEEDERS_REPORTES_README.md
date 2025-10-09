# 🚀 Guía Rápida - Seeders de Reportes

## 📋 Resumen

Seeders creados para generar datos de prueba del período **5 de Septiembre - 5 de Octubre de 2025** para pruebas de reportes en el frontend.

## ⚡ Uso Rápido

### Crear datos de prueba:

```bash
npm run seed:reportes
```

### Limpiar datos de prueba:

```bash
npm run seed:reportes:clean
```

## 📊 ¿Qué se crea?

- **~93 bloques horarios** (3 por día durante 31 días)
- **~113 salidas** con diferentes estados y destinos
- **Múltiples escenarios**: clima adverso, alta demanda, cancelaciones, etc.

## 📅 Datos Generados

### Bloques Horarios

- Matutino: 08:00 - 10:00
- Intermedio: 10:00 - 12:00
- Vespertino: 12:00 - 14:00
- Capacidad: 65 personas/bloque

### Salidas

- **Destinos**: Isla de Lobos, Arrecife Tuxpan, Arrecife de en Medio, Arrecife Tanhuijo
- **Estados**: programada, en_curso, completada, cancelada, cancelada_por_clima, cancelada_capitaria
- **Pasajeros**: 5-50 por salida

## 🎯 Casos de Prueba Especiales

| Fecha     | Evento        | Descripción                       |
| --------- | ------------- | --------------------------------- |
| 15-16 Sep | Huracán       | Múltiples cancelaciones por clima |
| 16 Sep    | Día Patrio    | Máxima ocupación (bloques llenos) |
| 20 Sep    | Fin de Semana | Alta actividad turística          |
| 22 Sep    | Mantenimiento | Puerto con restricciones          |
| 28 Sep    | Mantenimiento | Isla cerrada                      |

## ⚠️ Requisitos Previos

Antes de ejecutar estos seeders, asegúrate de tener:

- ✅ Base de datos creada
- ✅ Migraciones ejecutadas
- ✅ Usuarios (prestadores) creados
- ✅ Embarcaciones registradas

### Si no tienes datos base:

```bash
# Crear base de datos y ejecutar migraciones
npm run db:create
npm run db:migrate

# Crear datos demo (usuarios, embarcaciones, etc.)
npm run seed:demo
```

## 📖 Documentación Completa

Para más detalles, consulta: `documentation/SEEDERS_REPORTES_SEPTIEMBRE_OCTUBRE.md`

## 🔍 Verificar Datos

### Ver bloques creados:

```bash
psql -d isla_lobos_db -c "SELECT fecha, COUNT(*) as total, AVG(capacidad_registrada) as ocupacion_promedio FROM bloques WHERE fecha BETWEEN '2025-09-05' AND '2025-10-05' GROUP BY fecha ORDER BY fecha;"
```

### Ver salidas creadas:

```bash
psql -d isla_lobos_db -c "SELECT DATE(fecha) as fecha, estado, COUNT(*) as total FROM salidas WHERE fecha BETWEEN '2025-09-05' AND '2025-10-05' GROUP BY DATE(fecha), estado ORDER BY fecha;"
```

## 🐛 Troubleshooting

### Error: No se encontraron prestadores

```bash
npm run seed:demo
```

### Error: Foreign key constraint

Ejecuta los seeders demo primero:

```bash
npm run seed:demo
```

### Limpiar todo y empezar de nuevo:

```bash
npm run seed:reportes:clean
npm run seed:clean
npm run seed:demo
npm run seed:reportes
```

## 💡 Consejos

- Los scripts tienen confirmación de 5 segundos, usa `--yes` para saltarla
- Los datos solo afectan el período Sep-Oct 2025
- Puedes ejecutar múltiples veces sin problemas
- Los seeders son idempotentes (se pueden ejecutar varias veces)

---

**¿Necesitas ayuda?** Consulta la documentación completa en `documentation/SEEDERS_REPORTES_SEPTIEMBRE_OCTUBRE.md`

