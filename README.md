# ComerECO – WebApp

Aplicación web interna para gestionar requisiciones de compra. El repositorio ahora sólo contiene lo necesario para desarrollar y desplegar la interfaz en Vercel; todo el material operativo (scripts de base de datos, seeds, documentación extensa, etc.) vive localmente y está ignorado en `.gitignore`.

## Requisitos

- Node.js 20+
- npm 10+
- Cuenta de Supabase con URL y anon key vigentes

## Configuración Rápida

1. Clona el repositorio y entra a la carpeta:
   ```bash
   git clone <repo-url>
   cd COMERECO-WEBAPP
   ```
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Copia el ejemplo de variables y agrega tus credenciales de Supabase:
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
   VITE_SUPABASE_ANON_KEY=<tu_anon_key>
   ```
4. Arranca el entorno local:
   ```bash
   npm run dev
   ```
   La app queda disponible en `http://localhost:5173`.
5. Para generar el build de producción:
   ```bash
   npm run build
   ```

## Scripts Disponibles

| Comando           | Descripción                                  |
|-------------------|----------------------------------------------|
| `npm run dev`     | Servidor de desarrollo Vite                  |
| `npm run build`   | Build de producción + fix de orden de scripts |
| `npm run build:clean` | Limpia caches (`dist`, `.vite`) y reconstruye |
| `npm run preview` | Sirve el build local para validar            |
| `npm run lint`    | Ejecuta ESLint sobre `src/`                  |

## Variables de Entorno

| Variable                | Descripción                              |
|-------------------------|------------------------------------------|
| `VITE_SUPABASE_URL`     | URL del proyecto Supabase                |
| `VITE_SUPABASE_ANON_KEY`| Clave anon de Supabase (rol `anon`)      |

Sin estas variables la app no puede autenticarse ni cargar datos.

## Despliegue en Vercel

1. Conecta el repo a Vercel (Framework detectado: Vite).
2. Configura las variables anteriores en **Project Settings → Environment Variables**.
3. Usa los comandos por defecto del proyecto (`npm install`, `npm run build`, output `dist/`).  
   Ya existe `vercel.json` con rewrites y headers de seguridad, no hay que tocarlo.
4. Haz push a la rama deseada y Vercel generará el deploy automático.

Si Vercel muestra pantalla en blanco, revisa que las variables estén correctamente cargadas y vuelve a desplegar.

## Estructura del Proyecto

```
.
├── src/                # Código fuente de la aplicación (componentes, páginas, contextos, hooks, utils)
├── public/             # Assets estáticos
├── plugins/            # Plugins personalizados usados por Vite (dev tooling)
├── fix-html-order.cjs  # Script post-build que asegura el orden de los bundles
├── index.html          # Entry point de Vite
├── jsconfig.json       # Alias para imports absolutos
├── package.json        # Dependencias y scripts
├── postcss.config.js   # Configuración de PostCSS/Tailwind
├── tailwind.config.js  # Tokens y presets de Tailwind
├── vercel.json         # Configuración del deploy en Vercel
└── vite.config.js      # Configuración avanzada de Vite
```

## Notas Operativas

- Directorios como `docs/`, `supabase/`, `integrations/`, `scripts/`, `tests/`, `tools/`, etc. permanecen en tu máquina pero están ignorados porque no son necesarios para publicar la webapp.
- Si necesitas volver a versionar alguno, elimínalo de `.gitignore` de forma explícita y súbelo en un commit separado.

Mantén este repositorio ligero para que los despliegues sean rápidos y predecibles. Cualquier proceso adicional (migraciones, seeds, integraciones) vive fuera o en repos con permisos distintos.
