# Sistema de Banner de Alertas

## Descripción General

Sistema completo de alertas transversales para la aplicación, diseñado para proporcionar feedback visual consistente a los usuarios en múltiples escenarios. Incluye 4 tipos de alertas con colores optimizados para light y dark mode, cumpliendo con estándares de accesibilidad WCAG AA.

## Archivos Creados

### Componentes
- **`/src/components/AlertBanner.jsx`** - Componente base de alerta
- **`/src/components/AlertContainer.jsx`** - Contenedor para alertas globales
- **`/src/components/AlertBanner.example.jsx`** - Ejemplos de uso y documentación

### Contexto y Hooks
- **`/src/context/AlertContext.jsx`** - Proveedor de contexto y hook useAlerts

### Modificaciones
- **`/src/context/AppProviders.jsx`** - Agregado AlertProvider
- **`/src/App.jsx`** - Agregado AlertContainer en el layout

## Tipos de Alertas

### 1. Info (Información)
- **Color:** Azul
- **Icono:** Info (i en círculo)
- **Uso:** Notificaciones generales, actualizaciones, información nueva

**Light Mode:**
- Background: `bg-blue-50`
- Border: `border-blue-200`
- Text: `text-blue-900`
- Icon: `text-blue-600`

**Dark Mode:**
- Background: `bg-blue-950/30` (30% opacity)
- Border: `border-blue-800`
- Text: `text-blue-100`
- Icon: `text-blue-400`

### 2. Warning (Advertencia)
- **Color:** Amarillo
- **Icono:** AlertTriangle (triángulo con exclamación)
- **Uso:** Advertencias, confirmaciones requeridas, acciones que requieren atención

**Light Mode:**
- Background: `bg-yellow-50`
- Border: `border-yellow-200`
- Text: `text-yellow-900`
- Icon: `text-yellow-600`

**Dark Mode:**
- Background: `bg-yellow-950/30` (30% opacity)
- Border: `border-yellow-800`
- Text: `text-yellow-100`
- Icon: `text-yellow-400`

### 3. Error (Error)
- **Color:** Rojo
- **Icono:** AlertCircle (círculo con X)
- **Uso:** Errores, fallos en operaciones, validaciones fallidas

**Light Mode:**
- Background: `bg-red-50`
- Border: `border-red-200`
- Text: `text-red-900`
- Icon: `text-red-600`

**Dark Mode:**
- Background: `bg-red-950/30` (30% opacity)
- Border: `border-red-800`
- Text: `text-red-100`
- Icon: `text-red-400`

### 4. Success (Éxito)
- **Color:** Verde
- **Icono:** CheckCircle (círculo con check)
- **Uso:** Confirmaciones exitosas, operaciones completadas

**Light Mode:**
- Background: `bg-green-50`
- Border: `border-green-200`
- Text: `text-green-900`
- Icon: `text-green-600`

**Dark Mode:**
- Background: `bg-green-950/30` (30% opacity)
- Border: `border-green-800`
- Text: `text-green-100`
- Icon: `text-green-400`

## Características

### ✅ Diseño y UX
- Border izquierdo de 4px como indicador visual principal
- Iconos apropiados para cada tipo de alerta (lucide-react)
- Espaciado consistente (padding: 1rem / 16px)
- Transición suave en hover del botón cerrar
- Bordes redondeados (rounded-lg)

### ✅ Accesibilidad
- Contraste WCAG AA cumplido en todos los modos
- Atributos ARIA apropiados (`role="alert"`, `aria-live`)
- Botón de cerrar con `aria-label` descriptivo
- Focus ring visible en elementos interactivos
- Iconos con `aria-hidden="true"` (decorativos)

### ✅ Funcionalidad
- Alertas globales (aparecen en la parte superior)
- Alertas locales (dentro de componentes específicos)
- Auto-cierre configurable por duración
- Opción de cerrar manualmente (dismissible)
- Stack de múltiples alertas simultáneas

### ✅ Consistencia Visual
- Colores coherentes entre light y dark mode
- Opacidad 30% en backgrounds de dark mode para no saturar
- Sistema de colores basado en la paleta Tailwind estándar

## Uso

### Método 1: Alertas Globales

Ideal para notificaciones que deben aparecer en la parte superior de la aplicación:

```jsx
import { useAlerts } from '@/context/AlertContext';

function MyComponent() {
  const { addSuccessAlert, addErrorAlert, addWarningAlert, addInfoAlert } = useAlerts();

  const handleSave = async () => {
    try {
      await saveData();
      // Auto-cierre en 3 segundos
      addSuccessAlert('Datos guardados exitosamente.', 3000);
    } catch (error) {
      // Permanece hasta que el usuario la cierre
      addErrorAlert('Error al guardar los datos.');
    }
  };

  return (
    <button onClick={handleSave}>Guardar</button>
  );
}
```

### Método 2: Alertas Locales

Ideal para alertas específicas de una página o sección:

```jsx
import { AlertBanner } from '@/components/AlertBanner';
import { useState } from 'react';

function MyPage() {
  const [showAlert, setShowAlert] = useState(true);

  return (
    <div>
      {showAlert && (
        <AlertBanner
          type="warning"
          message="Tu sesión expirará en 5 minutos."
          onDismiss={() => setShowAlert(false)}
        />
      )}

      {/* Alerta persistente (no se puede cerrar) */}
      <AlertBanner
        type="info"
        message="Sistema en mantenimiento programado."
        isDismissible={false}
      />
    </div>
  );
}
```

### Método 3: Uso Avanzado con addAlert

Para mayor control sobre la configuración:

```jsx
import { useAlerts } from '@/context/AlertContext';

function MyComponent() {
  const { addAlert } = useAlerts();

  const handleAction = () => {
    addAlert({
      type: 'info',
      message: 'Procesando solicitud...',
      duration: 10000, // 10 segundos
    });
  };

  return <button onClick={handleAction}>Procesar</button>;
}
```

## API Reference

### AlertBanner Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `type` | `'info' \| 'warning' \| 'error' \| 'success'` | `'info'` | Tipo de alerta |
| `message` | `string` | - | Mensaje a mostrar (requerido) |
| `onDismiss` | `() => void` | - | Función llamada al cerrar |
| `isDismissible` | `boolean` | `true` | Si se puede cerrar la alerta |

### useAlerts Hook

| Método | Parámetros | Retorno | Descripción |
|--------|-----------|---------|-------------|
| `addAlert` | `{ type, message, duration? }` | `string` (id) | Agrega una alerta genérica |
| `addInfoAlert` | `(message, duration?)` | `string` (id) | Agrega alerta tipo info |
| `addWarningAlert` | `(message, duration?)` | `string` (id) | Agrega alerta tipo warning |
| `addErrorAlert` | `(message, duration?)` | `string` (id) | Agrega alerta tipo error |
| `addSuccessAlert` | `(message, duration?)` | `string` (id) | Agrega alerta tipo success |
| `removeAlert` | `(id: string)` | `void` | Remueve una alerta específica |
| `clearAlerts` | `()` | `void` | Limpia todas las alertas |
| `alerts` | - | `Alert[]` | Array de alertas activas |

## Ejemplos de Uso Común

### Formulario con Validación

```jsx
const { addWarningAlert, addSuccessAlert } = useAlerts();

const handleSubmit = (data) => {
  if (!data.email) {
    addWarningAlert('Por favor ingresa un email válido.');
    return;
  }

  addSuccessAlert('Formulario enviado correctamente.', 3000);
};
```

### Operaciones Asíncronas

```jsx
const { addInfoAlert, addErrorAlert, addSuccessAlert } = useAlerts();

const handleUpload = async (file) => {
  const alertId = addInfoAlert('Subiendo archivo...', 0);

  try {
    await uploadFile(file);
    removeAlert(alertId);
    addSuccessAlert('Archivo subido exitosamente.', 3000);
  } catch (error) {
    removeAlert(alertId);
    addErrorAlert('Error al subir el archivo.');
  }
};
```

### Alertas de Sistema

```jsx
const { addWarningAlert } = useAlerts();

// En un useEffect para sesión próxima a expirar
useEffect(() => {
  const timer = setTimeout(() => {
    addWarningAlert('Tu sesión expirará en 5 minutos.', 60000);
  }, 25 * 60 * 1000); // 25 minutos

  return () => clearTimeout(timer);
}, []);
```

## Checklist de Validación

- ✅ 4 tipos de alertas bien diferenciadas (info, warning, error, success)
- ✅ Colores consistentes en light y dark mode
- ✅ Iconos apropiados para cada tipo (lucide-react)
- ✅ Botón cerrar funcional y accesible
- ✅ Border-left de 4px como indicador visual
- ✅ Contraste WCAG AA en todos los tipos
- ✅ Backgrounds con opacidad 30% en dark mode
- ✅ Transición suave en hover del botón cerrar
- ✅ Atributos ARIA para accesibilidad
- ✅ Sistema de alertas globales implementado
- ✅ Documentación y ejemplos completos

## Consideraciones de Implementación

### Performance
- Las alertas usan React Context para estado global
- Los callbacks están memoizados con `useCallback`
- El contexto usa `useMemo` para evitar re-renders innecesarios

### Accesibilidad
- `role="alert"` en el contenedor principal
- `aria-live="assertive"` para errores (prioridad alta)
- `aria-live="polite"` para otros tipos (prioridad normal)
- Focus ring visible en botón de cerrar

### Responsive
- Padding y márgenes consistentes en todos los tamaños
- Ancho máximo de 7xl (max-w-7xl) en el container
- Sistema de spacing adaptativo (px-4 sm:px-6 lg:px-8)

## Integración con el Proyecto

El sistema de alertas está completamente integrado en el proyecto:

1. **AlertProvider** envuelve toda la aplicación en `/src/context/AppProviders.jsx`
2. **AlertContainer** está montado en el layout principal en `/src/App.jsx`
3. Las alertas aparecen sticky en la parte superior (z-50) sobre todo el contenido
4. Compatible con el sistema de temas (ThemeProvider) existente

## Próximos Pasos (Opcional)

### Mejoras Futuras
- [ ] Agregar animaciones de entrada/salida (framer-motion)
- [ ] Soporte para múltiples líneas de texto
- [ ] Botones de acción dentro de alertas
- [ ] Alertas con progreso (para operaciones largas)
- [ ] Persistencia de alertas críticas en localStorage
- [ ] Toast notifications como alternativa a alertas globales

### Testing
- [ ] Tests unitarios para AlertBanner
- [ ] Tests de integración para AlertContext
- [ ] Tests de accesibilidad (axe-core)
- [ ] Tests E2E para flujos con alertas

## Soporte

Para preguntas o problemas con el sistema de alertas:
1. Revisa los ejemplos en `/src/components/AlertBanner.example.jsx`
2. Consulta este documento (ALERT_BANNER_SYSTEM.md)
3. Verifica que AlertProvider esté correctamente montado

---

**Versión:** 1.0.0
**Fecha de creación:** 2025-11-07
**Última actualización:** 2025-11-07
