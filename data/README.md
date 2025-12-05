# 📊 Datos y Archivos Temporales

Esta carpeta contiene archivos de datos y logs temporales.

## 📝 Contenido

- **CSV de migración**: Archivos CSV exportados desde Frontmy para migración
- **Logs de migración**: Archivos de log con errores de migración

## ⚠️ Importante

- Estos archivos están en `.gitignore` y **NO se subirán a GitHub**
- Contienen información sensible de pacientes
- Solo se usan localmente para migración de datos

## 🗑️ Limpieza

Puedes eliminar estos archivos después de completar la migración:

```bash
# Eliminar todos los archivos de datos
rm -rf data/*
```

O manualmente desde el explorador de archivos.

