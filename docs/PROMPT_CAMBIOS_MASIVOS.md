# Prompt Template para Cambios Masivos en el Proyecto

## Prompt Base para Cambios Masivos

```
Eres un asistente experto en refactorización de código React/JavaScript. 
Necesito que realices un cambio masivo en mi proyecto COMERECO WEBAPP.

CONTEXTO DEL PROYECTO:
- Stack: React 18 + Vite + TypeScript/JavaScript
- Framework UI: Radix UI + Tailwind CSS
- Estado: React Query (@tanstack/react-query)
- Autenticación: Supabase
- Estructura: src/components, src/pages, src/hooks, src/services, src/context

CAMBIOS REQUERIDOS:
[DESCRIBE AQUÍ EL CAMBIO ESPECÍFICO QUE NECESITAS]

EJEMPLOS DE CAMBIOS COMUNES:

1. CAMBIAR IMPORTS:
   - Buscar: import { X } from '@/components/ui/use-toast'
   - Reemplazar: import { X } from '@/components/ui/useToast'
   - Alcance: Todos los archivos .js, .jsx, .ts, .tsx

2. RENOMBRAR FUNCIONES/VARIABLES:
   - Buscar: función `nombreViejo`
   - Reemplazar: función `nombreNuevo`
   - Alcance: Todo el proyecto

3. ACTUALIZAR PATRONES DE CÓDIGO:
   - Buscar: [patrón antiguo]
   - Reemplazar: [patrón nuevo]
   - Alcance: [archivos específicos o todo el proyecto]

INSTRUCCIONES:
1. Primero busca TODOS los archivos afectados usando búsqueda semántica o grep
2. Lista todos los archivos que necesitan cambios
3. Realiza los cambios de forma sistemática, archivo por archivo
4. Verifica que no haya errores de sintaxis después de cada cambio
5. Asegúrate de mantener la consistencia en todo el proyecto
6. No elimines archivos sin confirmar primero

ARCHIVOS EXCLUIDOS (no modificar):
- node_modules/
- dist/
- build/
- .git/
- package.json y package-lock.json (a menos que se especifique)

¿Puedes ayudarme a realizar este cambio masivo de forma segura y sistemática?
```

---

## Ejemplos de Prompts Específicos

### Ejemplo 1: Cambiar imports de un componente

```
Eres un asistente experto en refactorización de código React.

Necesito cambiar TODOS los imports de un componente en mi proyecto COMERECO WEBAPP.

CAMBIO REQUERIDO:
- Buscar: import { useToast } from '@/components/ui/use-toast'
- Reemplazar: import { useToast } from '@/components/ui/useToast'
- También buscar variaciones como:
  - '@/components/ui/use-toast.js'
  - '@/components/ui/use-toast.jsx'
  - '@/components/ui/use-toast.ts'
  - '@/components/ui/use-toast.tsx'

INSTRUCCIONES:
1. Busca TODOS los archivos (.js, .jsx, .ts, .tsx) que contengan 'use-toast'
2. Lista todos los archivos encontrados
3. Reemplaza los imports en cada archivo
4. Verifica que no haya errores de sintaxis
5. Asegúrate de que el archivo destino (useToast.js) existe y tiene el contenido correcto

¿Puedes ayudarme a realizar este cambio?
```

### Ejemplo 2: Renombrar una función en todo el proyecto

```
Eres un asistente experto en refactorización de código React/JavaScript.

Necesito renombrar una función en TODO mi proyecto COMERECO WEBAPP.

CAMBIO REQUERIDO:
- Función antigua: `fetchUserData`
- Función nueva: `getUserData`
- Alcance: Todo el proyecto (definiciones, llamadas, imports, exports)

INSTRUCCIONES:
1. Busca TODAS las ocurrencias de `fetchUserData` en el proyecto
2. Identifica:
   - Definiciones de función
   - Llamadas a la función
   - Exports/imports
   - Comentarios que mencionen la función
3. Reemplaza sistemáticamente en cada archivo
4. Verifica que la lógica funcional no cambie, solo el nombre
5. Asegúrate de mantener la consistencia en todos los archivos

¿Puedes ayudarme a realizar este cambio masivo?
```

### Ejemplo 3: Actualizar patrón de manejo de errores

```
Eres un asistente experto en refactorización de código React/JavaScript.

Necesito actualizar el patrón de manejo de errores en TODO mi proyecto COMERECO WEBAPP.

CAMBIO REQUERIDO:
- Patrón antiguo: 
  ```javascript
  catch (error) {
    console.error(error);
    toast.error('Error occurred');
  }
  ```

- Patrón nuevo:

  ```javascript
  catch (error) {
    logger.error('Error description', error);
    toast({
      title: 'Error',
      description: error.message || 'An error occurred',
      variant: 'destructive'
    });
  }
  ```

INSTRUCCIONES:

1. Busca TODOS los bloques catch en el proyecto
2. Identifica los que usan el patrón antiguo
3. Actualiza cada uno manteniendo el contexto específico de cada error
4. Asegúrate de importar `logger` donde sea necesario
5. Verifica que el patrón de `toast` sea consistente con el hook useToast del proyecto

¿Puedes ayudarme a realizar este cambio masivo?

```

### Ejemplo 4: Migrar de un contexto a otro

```

Eres un asistente experto en refactorización de código React.

Necesito migrar el uso de un contexto a otro en TODO mi proyecto COMERECO WEBAPP.

CAMBIO REQUERIDO:

- Contexto antiguo: import { useAuth } from '@/context/AuthContext'
- Contexto nuevo: import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext'
- Métodos antiguos: user, login, logout
- Métodos nuevos: user, signIn, signOut

INSTRUCCIONES:

1. Busca TODOS los imports de '@/context/AuthContext'
2. Reemplaza por '@/contexts/SupabaseAuthContext'
3. Actualiza todas las llamadas:
   - `login()` → `signIn()`
   - `logout()` → `signOut()`
4. Verifica que el hook useSupabaseAuth devuelva la misma estructura que useAuth
5. Actualiza TODOS los componentes que usan este contexto

¿Puedes ayudarme a realizar esta migración masiva?

```

---

## Checklist para Cambios Masivos

Antes de ejecutar un cambio masivo, verifica:

- [ ] He identificado TODOS los archivos afectados
- [ ] Tengo un backup del proyecto
- [ ] He probado el cambio en un archivo de prueba
- [ ] El cambio es consistente con el estilo del proyecto
- [ ] No romperá dependencias existentes
- [ ] He documentado el cambio para referencia futura

## Comandos Útiles para Verificar Cambios

```bash
# Buscar todas las ocurrencias de un patrón
grep -r "patrón" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"

# Verificar imports después del cambio
grep -r "import.*use-toast" src/

# Verificar errores de linting
npm run lint

# Verificar que el proyecto compile
npm run build
```
