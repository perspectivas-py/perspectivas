# Guía paso a paso para aplicar los cambios

## 📋 Resumen de cambios realizados

Se corrigió el problema de que las notas nuevas no aparecían en el home. Los cambios incluyen:

1. **Nuevo endpoint API** (`api/content.js`) que genera content.json dinámicamente desde GitHub
2. **Configuración de Vercel** actualizada para ejecutar el build correctamente
3. **Script de build mejorado** que mapea correctamente los campos
4. **Package.json** actualizado con soporte para ES modules

## 🚀 Pasos para aplicar los cambios

### Paso 1: Abrir PowerShell en la carpeta del proyecto

1. Abre PowerShell
2. Navega a la carpeta del proyecto:
```powershell
cd C:\Users\user\perspectivas\temp_repo
```

### Paso 2: Verificar el estado del repositorio

```powershell
git status
```

Deberías ver los archivos modificados:
- `api/content.js` (nuevo)
- `vercel.json` (modificado)
- `package.json` (modificado)
- `scripts/build-content.js` (modificado)

### Paso 3: Agregar los archivos al staging

```powershell
git add .
```

### Paso 4: Hacer commit de los cambios

```powershell
git commit -m "Fix: Corregir carga de notas nuevas en el home - Agregar endpoint API dinámico"
```

### Paso 5: Hacer push a GitHub

```powershell
git push origin main
```

Si te pide credenciales de GitHub:
- Usuario: tu usuario de GitHub
- Contraseña: usa un Personal Access Token (no tu contraseña normal)
  - Para crear un token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token
  - Permisos necesarios: `repo`

### Paso 6: Verificar el deploy en Vercel

1. Ve a https://vercel.com/dashboard
2. Busca tu proyecto "perspectivas"
3. Deberías ver un nuevo deploy iniciándose automáticamente
4. Espera a que termine (1-2 minutos)
5. Visita https://perspectivaspy.vercel.app
6. Verifica que las notas nuevas aparezcan en el home

## ✅ Verificación

Después del deploy, deberías ver:
- Todas las notas de `content/noticias/posts/` apareciendo en el home
- Las notas más recientes primero
- El contenido actualizado automáticamente

## 🔧 Si algo sale mal

Si el push falla:
- Verifica que tengas permisos de escritura en el repositorio
- Asegúrate de estar en la rama `main`
- Verifica tu conexión a internet

Si el deploy falla en Vercel:
- Revisa los logs en el dashboard de Vercel
- Verifica que `package.json` tenga todas las dependencias necesarias
- Asegúrate de que el build command esté configurado correctamente

## 📞 Soporte

Si necesitas ayuda adicional, revisa:
- Los logs de Vercel en el dashboard
- La consola del navegador (F12) para ver errores
- Los logs de la función API en Vercel

