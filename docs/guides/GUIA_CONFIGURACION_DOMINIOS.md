# 🌐 Guía de Configuración de Dominios en Vercel

## 📋 Configuración de Dominio Personalizado

### Opción 1: Conectar un Dominio Personalizado (Recomendado)

Si ya tienes un dominio (ej: `comereco.com` o `comereco.solver.com`):

#### Paso 1: Agregar el Dominio

1. Haz clic en el botón **"Add Domain"** (arriba a la derecha)
2. En el campo **"Domain"**, escribe tu dominio completo:
   - Ejemplo: `comereco.solver.com` o `app.comereco.com`

#### Paso 2: Seleccionar Entorno

1. Asegúrate de que **"Connect to an environment"** esté seleccionado
2. En el menú desplegable, selecciona:
   - **Production** - Para el dominio principal/producción
   - **Preview** - Para previews de pull requests

#### Paso 3: Configurar DNS

Después de hacer clic en **"Save"**, Vercel te mostrará instrucciones de DNS:

**Para dominio raíz (ej: `comereco.solver.com`):**

```
Tipo: A
Nombre: @
Valor: 76.76.21.21
```

**Para subdominio (ej: `app.comereco.solver.com`):**

```
Tipo: CNAME
Nombre: app
Valor: cname.vercel-dns.com
```

**O usar el registro A de Vercel:**

```
Tipo: A
Nombre: @
Valor: 76.76.21.21
```

#### Paso 4: Guardar

1. Haz clic en **"Save"**
2. Espera a que Vercel verifique el DNS (puede tardar unos minutos)
3. El círculo azul con checkmark aparecerá cuando esté configurado correctamente

---

### Opción 2: Redirigir a Otro Dominio

Si quieres que un dominio redirija a otro:

1. En el campo **"Domain"**, escribe el dominio que quieres redirigir
2. Selecciona **"Redirect to Another Domain"**
3. En el menú desplegable, selecciona el dominio destino
4. Haz clic en **"Save"**

---

## 🔧 Configuración Recomendada para ComerECO

### Dominio Principal (Production)

```
Dominio: comereco.solver.com (o el que prefieras)
Entorno: Production
```

### Dominio de Preview (Opcional)

```
Dominio: preview.comereco.solver.com
Entorno: Preview
```

---

## 📝 Pasos Detallados

### 1. **Agregar Dominio**

- Click en **"Add Domain"**
- Escribe tu dominio en el campo

### 2. **Seleccionar Entorno**

- **Production**: Para usuarios finales
- **Preview**: Para revisar cambios antes de producción

### 3. **Configurar DNS en tu Proveedor**

Ejemplos por proveedor:

#### Cloudflare

1. Ve a DNS → Records
2. Agrega registro:
   - Tipo: `A` o `CNAME`
   - Nombre: `@` o `app`
   - Contenido: `76.76.21.21` o `cname.vercel-dns.com`

#### GoDaddy

1. Ve a DNS Management
2. Agrega registro:
   - Tipo: `A` o `CNAME`
   - Nombre: `@` o `app`
   - Valor: `76.76.21.21` o `cname.vercel-dns.com`

#### Namecheap

1. Ve a Advanced DNS
2. Agrega registro:
   - Tipo: `A Record` o `CNAME Record`
   - Host: `@` o `app`
   - Value: `76.76.21.21` o `cname.vercel-dns.com`

### 4. **Esperar Verificación**

- Vercel verificará automáticamente el DNS
- Puede tardar desde minutos hasta 24 horas
- El estado cambiará a "Valid Configuration" cuando esté listo

---

## ✅ Verificación

Después de configurar:

1. **Verifica el estado**: Debe mostrar círculo azul con checkmark
2. **Prueba el dominio**: Abre `https://tu-dominio.com` en el navegador
3. **Verifica SSL**: Vercel configura SSL automáticamente (HTTPS)

---

## 🆘 Solución de Problemas

### El dominio no se verifica

- Verifica que los registros DNS estén correctos
- Espera hasta 24 horas para propagación DNS
- Verifica en [whatsmydns.net](https://whatsmydns.net)

### Error de SSL

- Vercel configura SSL automáticamente
- Si hay problemas, espera unos minutos y verifica nuevamente

### Dominio no carga

- Verifica que el dominio esté conectado a "Production"
- Revisa los logs de Vercel
- Verifica que el build haya sido exitoso

---

## 📚 Información Adicional

- **Dominio por defecto**: `comereco-solver-center.vercel.app` ya está configurado
- **Dominios personalizados**: Mejoran la experiencia del usuario
- **SSL**: Vercel provee certificados SSL automáticos

---

## 🎯 Resumen Rápido

1. Click en **"Add Domain"**
2. Escribe tu dominio
3. Selecciona **"Production"** (o Preview si prefieres)
4. Configura DNS en tu proveedor de dominio
5. Click en **"Save"**
6. Espera verificación (círculo azul con checkmark)

**¡Listo!** Tu dominio personalizado estará funcionando.
