# 🚀 Instrucciones Rápidas para Importar CSV desde Frontmy

## Pasos Simples (5 minutos)

### 1️⃣ Colocar el Archivo CSV
- Coloca el archivo CSV exportado de Frontmy en la **raíz del proyecto** (donde está `package.json`)
- Puede tener cualquier nombre (ej: `pacientes.csv`, `ReportePacientes.csv`, etc.)

### 2️⃣ Configurar Variables de Entorno

Abre `.env.local` y agrega:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

**¿Dónde obtener la Service Role Key?**
- Supabase Dashboard > Settings > API > `service_role` key (secret)

### 3️⃣ Analizar el CSV (Opcional pero Recomendado)

```bash
npm run migrate:analyze
```

Esto te mostrará qué columnas tiene tu CSV y si necesita ajustes.

### 4️⃣ Ejecutar la Migración

```bash
npm run migrate:run
```

El script:
- ✅ Busca automáticamente el archivo CSV en la raíz
- ✅ Mapea las columnas automáticamente
- ✅ Limpia y normaliza los datos
- ✅ Elimina duplicados
- ✅ Inserta en lotes seguros
- ✅ Muestra progreso en tiempo real

### 5️⃣ Validar

```bash
npm run migrate:validate
```

## ✅ ¡Listo!

Los pacientes ya estarán en Supabase y podrás verlos en la aplicación.

---

## 🔧 Si el CSV tiene Columnas Diferentes

Si el script no encuentra las columnas automáticamente:

1. Ejecuta `npm run migrate:analyze` para ver las columnas
2. Edita `scripts/migrate-frontmy-data.ts`
3. Agrega los nombres de tus columnas en la función `normalizeField()`

Por ejemplo, si tu CSV tiene "Nombre Completo" en lugar de "Nombre" y "Apellido" separados, puedes agregar lógica para separarlos.

---

## 📞 ¿Problemas?

- **CSV no encontrado:** Verifica que esté en la raíz del proyecto
- **Variables faltantes:** Verifica `.env.local`
- **Errores de mapeo:** Ejecuta `npm run migrate:analyze` y comparte el output

