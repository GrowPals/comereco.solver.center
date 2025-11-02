# Prompt Corto para Cambios Masivos

## Versión Simplificada (Copia y Pega)

```
Eres un asistente experto en refactorización de código React/JavaScript. 

Necesito realizar un cambio masivo en mi proyecto COMERECO WEBAPP (React 18 + Vite + Supabase).

CAMBIO REQUERIDO:
[DESCRIBE AQUÍ EL CAMBIO ESPECÍFICO]

INSTRUCCIONES:
1. Busca TODOS los archivos afectados en src/ (incluye .js, .jsx, .ts, .tsx)
2. Lista los archivos encontrados antes de modificar
3. Realiza los cambios de forma sistemática
4. Verifica que no haya errores de sintaxis
5. Mantén la consistencia en todo el proyecto

¿Puedes ayudarme a realizar este cambio masivo?
```

---

## Ejemplo Real: Cambiar imports de useToast

```
Eres un asistente experto en refactorización de código React/JavaScript. 

Necesito realizar un cambio masivo en mi proyecto COMERECO WEBAPP (React 18 + Vite + Supabase).

CAMBIO REQUERIDO:
- Buscar TODOS los imports que contengan: '@/components/ui/use-toast'
- Reemplazar por: '@/components/ui/useToast'
- Incluir todas las variaciones: .js, .jsx, .ts, .tsx
- También buscar y reemplazar en imports relativos si existen

INSTRUCCIONES:
1. Busca TODOS los archivos en src/ que contengan 'use-toast' en imports
2. Lista los archivos encontrados antes de modificar
3. Reemplaza sistemáticamente cada import
4. Verifica que el archivo destino (useToast.js) existe
5. Asegúrate de que no queden referencias al archivo antiguo

¿Puedes ayudarme a realizar este cambio masivo?
```

