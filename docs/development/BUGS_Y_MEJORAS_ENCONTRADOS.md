# 🐛 Bugs y Mejoras Encontrados

Este documento lista los bugs y mejoras detectados mediante tests automatizados y revisión de código.

## 🐛 Bugs Críticos Encontrados

### 1. **Falta validación de duplicados al editar turno**
**Ubicación**: `components/ModalTurno.tsx` líneas 63-74

**Problema**: Al editar un turno y cambiar su horario, no se valida si el nuevo horario ya está ocupado por otro turno.

**Impacto**: Puede crear turnos duplicados en el mismo horario.

**Solución sugerida**:
```typescript
// Antes de actualizar, verificar que el nuevo horario no esté ocupado
if (turno) {
  const { data: turnoExistente } = await supabase
    .from('turnos')
    .select('id')
    .eq('fecha', fechaStr)
    .eq('hora', hora)
    .neq('id', turno.id)
    .single();
  
  if (turnoExistente) {
    throw new Error('Ya existe un turno en este horario');
  }
  // ... resto del código
}
```

---

### 2. **Falta importación de FileText en ModalPaciente**
**Ubicación**: `components/ModalPaciente.tsx` línea 250

**Problema**: Se usa `FileText` pero no está importado de `lucide-react`.

**Impacto**: Error de compilación o componente que no se renderiza.

**Solución**: Agregar a los imports:
```typescript
import { X, FileText } from 'lucide-react';
```

---

### 3. **No se valida fecha de nacimiento futura**
**Ubicación**: `components/ModalPaciente.tsx` línea 207-213

**Problema**: Permite ingresar fechas de nacimiento futuras.

**Impacto**: Datos inválidos en la base de datos.

**Solución sugerida**:
```typescript
<input
  id="fechaNacimiento"
  type="date"
  max={new Date().toISOString().split('T')[0]}
  value={fechaNacimiento}
  onChange={(e) => setFechaNacimiento(e.target.value)}
/>
```

---

### 4. **Uso de `as any` en código TypeScript**
**Ubicación**: Múltiples archivos

**Problema**: 
- `components/ModalTurno.tsx` línea 44: `setPago((turno as any).pago || 'impago');`
- `components/SeguimientoPacientes.tsx` línea 97: `const paciente = p as any;`

**Impacto**: Pérdida de type safety, posibles errores en runtime.

**Solución**: Definir tipos correctos o usar tipos opcionales:
```typescript
// En lugar de (turno as any).pago
type TurnoConPago = Turno & { pago?: 'pagado' | 'impago' };
```

---

## ⚠️ Mejoras Sugeridas

### 1. **Validación de formato de email en frontend**
**Ubicación**: `components/ModalPaciente.tsx` línea 194-200

**Problema**: Solo confía en la validación HTML5 del navegador.

**Mejora**: Agregar validación explícita:
```typescript
const validarEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// En handleSubmit:
if (email && !validarEmail(email)) {
  setError('Por favor ingresa un email válido');
  return;
}
```

---

### 2. **Validación de longitud máxima de campos**
**Ubicación**: `components/ModalPaciente.tsx`, `components/ModalTurno.tsx`

**Problema**: No hay `maxlength` en inputs de texto.

**Mejora**: Agregar límites según el schema de la BD:
```typescript
<input
  id="nombre"
  type="text"
  maxLength={100}  // Según schema: VARCHAR(100)
  required
  value={nombre}
/>
```

---

### 3. **Manejo de errores de conexión/red**
**Ubicación**: Todos los componentes que hacen fetch

**Problema**: No hay manejo específico para errores de red.

**Mejora**: Agregar detección de errores de red:
```typescript
catch (err: any) {
  if (err.message?.includes('fetch') || err.message?.includes('network')) {
    setError('Error de conexión. Verifica tu internet e intenta nuevamente.');
  } else {
    setError(err.message || 'Error al guardar');
  }
}
```

---

### 4. **Prevenir múltiples submits**
**Ubicación**: Todos los formularios

**Problema**: Si el usuario hace click múltiples veces rápidamente, puede crear duplicados.

**Mejora**: Ya está parcialmente implementado con `loading`, pero se puede mejorar:
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isSubmitting) return; // Prevenir múltiples submits
  
  setIsSubmitting(true);
  // ... resto del código
  finally {
    setIsSubmitting(false);
  }
};
```

---

### 5. **Mensaje cuando no hay datos**
**Ubicación**: `components/ListaPacientes.tsx`, `components/AgendaDiaria.tsx`

**Problema**: Puede no ser claro cuando no hay datos.

**Mejora**: Agregar mensajes más descriptivos:
```typescript
{pacientesFiltrados.length === 0 && (
  <div className="p-8 text-center">
    <p className="text-gray-500 text-lg">
      {busqueda ? 'No se encontraron pacientes con ese criterio' : 'No hay pacientes registrados'}
    </p>
    {!busqueda && (
      <button onClick={() => onAbrirModalPaciente()}>
        Crear primer paciente
      </button>
    )}
  </div>
)}
```

---

### 6. **Indicadores de carga más visibles**
**Ubicación**: Todos los componentes que cargan datos

**Problema**: Los indicadores de carga pueden no ser suficientemente visibles.

**Mejora**: Usar skeleton loaders o spinners más prominentes:
```typescript
{loading ? (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    <span className="ml-3 text-gray-600">Cargando...</span>
  </div>
) : (
  // contenido
)}
```

---

### 7. **Mejorar accesibilidad (ARIA labels)**
**Ubicación**: Botones sin texto visible

**Problema**: Algunos botones solo tienen iconos sin aria-label.

**Mejora**: Agregar aria-labels a todos los botones:
```typescript
<button
  aria-label="Cerrar modal"
  onClick={onClose}
>
  <X className="w-5 h-5" />
</button>
```

---

### 8. **Validación de teléfono**
**Ubicación**: `components/ModalPaciente.tsx` línea 181-187

**Problema**: No hay validación de formato de teléfono.

**Mejora**: Agregar validación básica:
```typescript
const validarTelefono = (telefono: string): boolean => {
  // Remover espacios y caracteres especiales
  const limpio = telefono.replace(/[\s\-\(\)]/g, '');
  // Debe tener al menos 8 dígitos
  return /^\d{8,}$/.test(limpio);
};
```

---

### 9. **Limpiar formulario después de crear**
**Ubicación**: `components/ModalPaciente.tsx`, `components/ModalTurno.tsx`

**Problema**: Si el modal se vuelve a abrir después de crear, puede mantener datos anteriores.

**Mejora**: Asegurar que el useEffect limpie correctamente:
```typescript
useEffect(() => {
  if (!paciente) {
    // Limpiar todos los campos
    setNombre('');
    setApellido('');
    // ... resto de campos
  }
}, [paciente]);
```

---

### 10. **Manejo de errores más específico**
**Ubicación**: Todos los componentes

**Problema**: Los mensajes de error son genéricos.

**Mejora**: Mensajes más específicos según el tipo de error:
```typescript
if (error.code === '23505') {
  setError('Ya existe un registro con estos datos');
} else if (error.code === '23503') {
  setError('No se puede eliminar porque tiene registros relacionados');
} else if (error.message?.includes('timeout')) {
  setError('La operación tardó demasiado. Intenta nuevamente.');
} else {
  setError('Error inesperado. Contacta al administrador.');
}
```

---

## 📊 Resumen

### Bugs Críticos: 4
1. ✅ Falta validación de duplicados al editar turno
2. ✅ Falta importación de FileText
3. ✅ No valida fecha de nacimiento futura
4. ✅ Uso excesivo de `as any`

### Mejoras Sugeridas: 10
1. ✅ Validación de email más robusta
2. ✅ Validación de longitud de campos
3. ✅ Manejo de errores de red
4. ✅ Prevenir múltiples submits
5. ✅ Mensajes cuando no hay datos
6. ✅ Indicadores de carga más visibles
7. ✅ Mejorar accesibilidad
8. ✅ Validación de teléfono
9. ✅ Limpiar formularios correctamente
10. ✅ Mensajes de error más específicos

---

## 🧪 Tests Creados

Se creó el archivo `__tests__/e2e/bugs-y-mejoras.spec.ts` con tests que detectan estos problemas.

Para ejecutar:
```bash
npx playwright test __tests__/e2e/bugs-y-mejoras.spec.ts
```

