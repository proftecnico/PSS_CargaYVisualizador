# Sistema de Registro PSS | Jorge Garavagno®

Este es un sistema de gestión documental y control de acceso para proveedores, personal y flota, diseñado específicamente para procesos de registro PSS.

## 🚀 Funcionalidades
- **Dashboard de Control**: Vista rápida del estado de cumplimiento de todos los proveedores.
- **Gestión de Proveedores**: Alta, baja y edición de empresas y su CUIT.
- **Control Documental**: Seguimiento de fechas de vencimiento de AFIP, ART, Seguros, etc.
- **Gestión de Personal**: Registro de trabajadores autorizados y seguimiento de aptos médicos y capacitaciones.
- **Control de Flota**: Registro de vehículos con vencimiento de VTV y Seguro.
- **Búsqueda Avanzada**: Filtro en tiempo real por nombre o CUIT.
- **Roles de Usuario**:
  - **Consulta**: Vista de lectura.
  - **Administrador**: Gestión total (Contraseña por defecto: `admin`).

## 🛠️ Tecnología
- HTML5 / CSS3 (Vanilla)
- JavaScript (ES6+)
- [Lucide Icons](https://lucide.dev/) para la iconografía.
- **Persistencia**: Los datos se guardan localmente en el navegador (`localStorage`).

## 🌐 Despliegue en GitHub Pages
Para que cualquier persona pueda usar este sistema desde una URL:
1. Sube estos archivos a un repositorio de GitHub.
2. Ve a **Settings** > **Pages**.
3. En la sección "Build and deployment", selecciona la rama `main` (o `master`) y la carpeta `/root`.
4. Haz clic en **Save**. En unos minutos, tendrás una URL pública.

> [!IMPORTANT]
> **Nota sobre los datos**: En esta versión actual, los datos se guardan en el navegador de cada usuario. Si el usuario limpia su historial o usa otro dispositivo, empezará desde cero. Para un sistema compartido con una base de datos centralizada, se requeriría integrar un backend (como Firebase o Supabase).

---
*Desarrollado para el Sistema de registro PSS.*
