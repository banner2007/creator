# Creator Shopy — Plataforma SaaS Comercial

Creator Shopy es una aplicación web SaaS profesional de arquitectura desacoplada moderna que permite crear imágenes comerciales mediante Inteligencia Artificial, construir y administrar landing pages visualmente, y publicar páginas listas para vender productos con estadísticas en tiempo real.

## 🚀 Arquitectura Tecnológica

La plataforma está construida utilizando un esquema desacoplado y escalable:

*   **Core Backend**: Node.js + Express (API REST modular).
*   **Seguridad y Optimización**: Helmet, CORS, Rate Limiting, Compresión Gzip, y validación estricta de payloads con Zod.
*   **Core Frontend**: React (Vite SPA) + Zustand para el estado global y autoguardado + React Router v6 + Lucide React + TailwindCSS + Framer Motion para un diseño Glassmorphism premium.
*   **BaaS (Supabase)**: Base de datos PostgreSQL, Supabase Auth (Magic Links, Login), Supabase Storage para assets y compilaciones estáticas de landing pages, y Supabase Realtime para sincronizaciones.
*   **Orquestación IA**: Integración nativa con la API de **Kie.ai** (modelo Flux Kontext) para generación de fotografías publicitarias premium.
*   **Automatizaciones**: Integraciones vía webhook con Make.com al publicar y capturar leads.

---

## 📁 Estructura del Directorio

```
/CREATOR_SHOPY
├── /backend            # Servidor API REST Express (NodeJS)
│   ├── /ai             # Integración con Kie.ai e imágenes
│   ├── /analytics      # Registro de visitas y conversiones
│   ├── /auth           # Middleware y validación JWT de Supabase
│   ├── /landing        # CRUD de proyectos y secciones del editor
│   ├── /middleware     # Manejo de errores y guardas de seguridad
│   └── /publish        # Motor compilador estático HTML
├── /frontend           # Cliente React SPA (Vite)
│   ├── /public         # Archivos estáticos de navegador
│   └── /src
│       ├── /components # Componentes de UI y bloques del builder
│       ├── /pages      # Vistas (Dashboard, AI Studio, Editor Canvas)
│       ├── /store       # Estado Zustand global (autosave debounce)
│       └── /styles      # Hojas de estilo TailwindCSS y Glassmorphic
├── /supabase           # Scripts y migraciones PostgreSQL
│   └── schema.sql      # Definición de tablas y políticas RLS
├── /scripts            # Scripts bash de compilación y despliegue
├── docker-compose.yml  # Orquestador de contenedores Docker
└── README.md           # Documentación principal
```

---

## 🛠️ Configuración e Inicialización

### 1. Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto basándote en la plantilla `.env.example`:

```env
PORT=3000
NODE_ENV=development

# Credenciales Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-publica
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-privada

# Kie.ai API Key
KIE_API_KEY=tu-kie-ai-api-key # O la variable 'ap' en el env existente

# Webhooks Automatización Make.com
MAKE_PUBLISH_WEBHOOK_URL=https://hook.make.com/tu-id-de-publicacion
MAKE_LEAD_WEBHOOK_URL=https://hook.make.com/tu-id-de-leads
```

### 2. Base de Datos (Supabase)

Para inicializar la base de datos de Supabase, copia y pega el contenido del archivo [`supabase/schema.sql`](file:///g:/Mi%20unidad/___NEGOCIOS/VOTO_NACIONAL/_ANTIGRAVITY/CREATOR_SHOPY/supabase/schema.sql) dentro del **SQL Editor** del Panel de Supabase. Este script:
1. Creará las tablas: `users`, `projects`, `products`, `landing_pages`, `sections`, `ai_images`, `publications`, `analytics` y `audit_logs`.
2. Habilitará **RLS (Row Level Security)** en cada una para garantizar aislamiento entre usuarios.
3. Creará un **Trigger en Postgres** que sincronizará automáticamente los nuevos registros de `auth.users` hacia la tabla pública `public.users` con 20 créditos iniciales de regalo.

### 3. Configuración de Storage Buckets

Crea los siguientes buckets en la sección **Storage** del Panel de Supabase y configúralos como **Públicos** (acceso de lectura libre para visualización de imágenes):
*   `generated-images` (Fotografías creadas mediante la IA).
*   `exports` (Código HTML estático de las landing pages publicadas).
*   `products` (Portadas de catálogo).
*   `logos` (Marca del proyecto).
*   `landing-assets` (Imágenes subidas por el usuario).

---

## 🖥️ Despliegue Local (Desarrollo)

### Instalación de dependencias
Puedes instalar las dependencias de ambos proyectos ejecutando:
```bash
npm install --prefix backend
npm install --prefix frontend
```

### Ejecutar Servidores de Desarrollo
1.  **Backend** (API Express en el puerto 3000):
    ```bash
    cd backend
    npm run dev
    ```
2.  **Frontend** (Client Vite React en el puerto 5173 con proxy automático):
    ```bash
    cd frontend
    npm run dev
    ```

Accede al cliente en: [http://localhost:5173](http://localhost:5173)

---

## 🐳 Despliegue con Docker (Producción)

Para empaquetar y ejecutar la aplicación de forma contenerizada (Backend en el puerto 3000, Frontend servido por Nginx en el puerto 80):

```bash
# Otorgar permisos a los scripts de ayuda
chmod +x scripts/build.sh scripts/deploy.sh

# Compilar y desplegar
./scripts/deploy.sh
```

O directamente usando Docker Compose:
```bash
docker-compose up --build -d
```

---

## 📝 Documentación de APIs (Endpoints Clave)

### Autenticación (`/api/auth`)
*   `POST /register`: Registro de nuevos usuarios y sincronización.
*   `POST /login`: Inicio de sesión, devuelve JWT de Supabase Auth y perfil detallado.
*   `GET /profile` [Autenticado]: Devuelve los detalles del perfil del usuario (plan y créditos).

### Inteligencia Artificial (`/api/ai`)
*   `POST /generate` [Autenticado]: Generación de imágenes usando la API de **Kie.ai** (modelo Flux Kontext) o fallback visual. Descuenta créditos del saldo del usuario y sube el asset directamente al bucket `generated-images` en Supabase.
*   `POST /remove-bg` / `POST /upscale` [Autenticado]: Acciones complementarias del Estudio IA.

### Constructor y Guardado (`/api/landing`)
*   `POST /project`: Registra un nuevo proyecto comercial.
*   `POST /`: Crea una nueva landing page con 4 secciones predeterminadas listas para editar.
*   `PUT /:id` [Autenticado]: Endpoint de **Autoguardado** que sincroniza las secciones reordenadas o modificadas.
*   `POST /duplicate`: Duplica una página entera y sus bloques con un nuevo slug.

### Compilador y Publicador (`/api/publish`)
*   `POST /` [Autenticado]: Toma las secciones del editor, las compila a un archivo HTML estático optimizado y minificado con metaetiquetas SEO enriquecidas y scripts de tracking, sube el archivo a Supabase Storage y dispara webhooks de Make.com.
*   `GET /published/:slug` (Middleware de Servidor): Sirve el archivo estático compilado del bucket exports respondiendo a la ruta del subdominio.
