#!/bin/bash
echo "🚀 Iniciando verificación Supabase + WebApp..."

# 1️⃣ Asegurar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
  echo "🐳 Iniciando Docker..."
  open -a Docker || sudo systemctl start docker
  sleep 10
fi

# 2️⃣ Iniciar Supabase si no está activo
if ! supabase status | grep -q "Running"; then
  echo "🧱 Levantando entorno Supabase..."
  supabase start --debug
fi

# 3️⃣ Sincronizar migraciones
echo "📦 Verificando migraciones..."
supabase db push

# 4️⃣ Ejecutar tests RLS
echo "🧪 Ejecutando pruebas RLS..."
npm run test:rls

# 5️⃣ Generar diff si hay cambios no aplicados
echo "🔍 Buscando cambios locales..."
supabase db diff || echo "No hay cambios pendientes."

# 6️⃣ Ejecutar auditoría IA (si estás en Cursor o Claude)
echo "🤖 Ejecutando auditoría con IA (si está disponible)..."
echo "@auditor ejecuta revisión Supabase y WebApp completa" > .audit-prompt.txt

echo "✅ Verificación completa."
