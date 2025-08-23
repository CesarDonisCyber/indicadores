# Indicadores (Next.js + Tailwind)

Esta carpeta ya está lista para desplegar en **Vercel** sin usar la terminal.

## Pasos (solo con el navegador)
1. Descarga este proyecto y descomprímelo en tu computadora.
2. Crea una cuenta en **GitHub** (si no tienes).
3. Entra a tu perfil de GitHub → **New repository** → Nombre: `indicadores` → **Create repository**.
4. En el repositorio vacío, haz clic en **Add file → Upload files**.
5. Arrastra **TODAS** las carpetas/archivos dentro de esta carpeta (por ejemplo `src/`, `package.json`, etc.) a la página de GitHub y pulsa **Commit changes**.
6. Entra a **https://vercel.com** con tu cuenta (puede ser con GitHub).
7. **New Project → Import** tu repo `indicadores` → Framework: Next.js (lo detecta solo) → **Deploy**.
8. Obtendrás una **URL pública**. Úsala para **Insertar (Embed)** en SharePoint.

> Si GitHub no te deja arrastrar carpetas, usa **GitHub Desktop**:
> - Instálalo desde https://desktop.github.com/
> - **File → New repository** (elige una carpeta vacía)
> - Copia el contenido de este proyecto dentro de esa carpeta
> - En GitHub Desktop pulsa **Commit to main** y luego **Publish repository**

## Insertar en SharePoint
- En tu sitio: ⚙️ **Configuración** → **Contenido del sitio** → **Configuración del sitio** → **Seguridad del campo HTML** → permitir `https://*.vercel.app`.
- Crea **Nueva página** → agrega el web part **Insertar (Embed)** → pega la URL pública → Publicar.
