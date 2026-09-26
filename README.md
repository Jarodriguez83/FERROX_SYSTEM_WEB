# FERROX SYSTEM

FERROX es una plataforma web de apoyo a la supervisión de un cruce ferroviario. Reúne información del proyecto, monitoreo, acceso a cámara para administradores y herramientas para registrar evaluaciones del funcionamiento del sistema.

El proyecto está construido con **FastAPI**, plantillas **Jinja2**, JavaScript y una base local **SQLite**. La interfaz de monitoreo ya presenta los espacios para los conteos aproximados de personas y vehículos, pero la conexión de la cámara al procesamiento de visión artificial todavía debe integrarse y validarse.

## Contenido

- [Funciones y estado actual](#funciones-y-estado-actual)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Instalación y ejecución local](#instalación-y-ejecución-local)
- [Configuración](#configuración)
- [Páginas y rutas](#páginas-y-rutas)
- [API](#api)
- [Base de datos](#base-de-datos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Alcance, seguridad y limitaciones](#alcance-seguridad-y-limitaciones)

## Funciones y estado actual

- **Sitio web:** páginas para inicio, monitoreo, cámara, barrera/prototipo, semáforos ferroviarios, perfil y proceso de diseño de FERROX.
- **Registro e inicio de sesión:** altas de usuario y validación de credenciales mediante endpoints de FastAPI. El perfil se consulta desde la base local.
- **Roles:** al registrarse, el servidor asigna `ADMINISTRADOR` si el correo está incluido en `ADMIN_EMAILS`; a los demás usuarios les asigna `USUARIO`.
- **Cámara:** el servidor se conecta a la A9 V720 usando el SDK de `semaforos_ia`, recibe los frames JPEG y los publica como MJPEG en el visor existente. La conexión y el endpoint de video están restringidos a administradores autenticados.
- **Monitoreo:** muestra tarjetas para los conteos de personas y vehículos y un formulario para generar un informe de evaluación en PDF desde el navegador.
- **Proceso del proyecto:** documenta contexto, usuario, matriz de empatía, POV, prototipado, maqueta y validación.
- **Guía de semáforos:** presenta información educativa sobre señales ferroviarias y el contexto FERROX.

### Funciones que requieren integración o validación

- Los contadores de personas y vehículos son una interfaz preparada: **la API que recibe o procesa resultados de MediaPipe aún no está conectada**. Los valores no deben interpretarse como conteos reales mientras no se complete esa integración.
- La aplicación no implementa el procesamiento de video ni un modelo de detección dentro de FastAPI. La integración deberá definir cómo se captura el video, dónde se procesa y cómo se entregan las lecturas al navegador.
- La cámara debe estar encendida y el equipo que ejecuta FastAPI debe poder alcanzar su red Wi-Fi (`192.168.169.1:6123`). La cámara se conecta desde el servidor, no desde el navegador del usuario.
- La experiencia de cámara se controla desde la interfaz de administrador, pero la configuración de acceso y el endpoint por sí solos no sustituyen los mecanismos de seguridad ferroviaria ni los procedimientos del operador.

## Tecnologías

- **Python**, **FastAPI** y **Uvicorn** para el servidor web y la API.
- **SQLModel** y **SQLAlchemy** para modelos y acceso a datos.
- **SQLite** para la base de datos local.
- **Jinja2** para renderizar plantillas HTML.
- **HTML**, **CSS** y **JavaScript** para las páginas e interacciones del navegador.
- **PyJWT** para crear y verificar tokens de sesión.
- **jsPDF** cargado desde CDN para generar informes PDF en el navegador.
- **Supabase Storage** desde el formulario web para subir fotos de perfil cuando se selecciona un archivo.

## Requisitos

- Python 3.10 o posterior.
- `pip`.
- Conexión a Internet para instalar dependencias y cargar recursos externos (por ejemplo, bibliotecas, imágenes o fuentes servidas por CDN).
- Opcional: cámara IP y fuente de video web compatible para mostrar una transmisión en la pestaña de cámara.

## Instalación y ejecución local

Abre una terminal en la carpeta raíz del repositorio.

### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Si PowerShell bloquea la activación del entorno, puedes ejecutar Uvicorn directamente desde el entorno:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Con el entorno activado, inicia el servidor:

```powershell
python main.py
```

También puedes iniciarlo con Uvicorn:

```powershell
python -m uvicorn main:app --reload
```

Abre [http://127.0.0.1:8000](http://127.0.0.1:8000). La documentación interactiva de la API está en [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) y el estado básico del servicio en [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health).

En macOS o Linux, crea y activa el entorno con:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python main.py
```

## Configuración

La aplicación carga variables desde un archivo `.env` en la raíz mediante `python-dotenv`. Para desarrollo, crea ese archivo a partir de este ejemplo y reemplaza los valores:

```env
SECRET_KEY=CAMBIA_POR_UN_SECRETO_LARGO_Y_ALEATORIO
ADMIN_EMAILS=admin@ejemplo.com
A9_CAMERA_SDK_PATH=C:\\Users\\cjuan\\Downloads\\semaforos_ia
A9_CAMERA_HOST=192.168.169.1
A9_CAMERA_PORT=6123
```

| Variable | Uso |
| --- | --- |
| `SECRET_KEY` | Clave de firma de los tokens JWT. Define una clave privada y aleatoria. El valor predeterminado del código es solo para desarrollo. |
| `ADMIN_EMAILS` | Correos separados por comas que recibirán el rol `ADMINISTRADOR` al registrarse. La asignación se realiza en el servidor. |
| `A9_CAMERA_SDK_PATH` | Carpeta `semaforos_ia` que contiene `a9-v720/src`. Por defecto se usa `Downloads/semaforos_ia` del usuario que ejecuta el servidor. |
| `A9_CAMERA_HOST` | Dirección de la cámara A9 V720 en su red Wi-Fi. Por defecto, `192.168.169.1`. |
| `A9_CAMERA_PORT` | Puerto TCP del protocolo de la cámara. Por defecto, `6123`. |

No subas `.env` al repositorio. El archivo `.gitignore` excluye `.env`, bases locales y entornos virtuales.

### Configuración de video

El servidor importa el SDK local desde `A9_CAMERA_SDK_PATH`, inicia la cámara y publica los frames en `/api/camara/video` como MJPEG. El equipo donde corre FastAPI debe tener instaladas las dependencias del proyecto y estar conectado a la red Wi-Fi de la cámara. El navegador consume el stream del propio servidor; no necesita acceso directo a la cámara.

Si la carpeta del SDK está en otra ubicación, ajusta `A9_CAMERA_SDK_PATH` en el archivo `.env` antes de iniciar FastAPI.

## Páginas y rutas

| Página | Ruta | Función |
| --- | --- | --- |
| Inicio / acceso | `/` | Presentación, registro, inicio de sesión y recuperación de contraseña. |
| Inicio de usuario | `/home` | Página principal de la plataforma. |
| Monitoreo | `/monitoreo` | Indicadores de personas y vehículos, información de lectura aproximada y formulario de evaluación con generación de informe PDF. |
| Cámara | `/camara` | Visor de transmisión e información del punto; la transmisión está restringida a administradores autenticados. |
| Barrera / prototipo | `/prototipo` | Sección visual relacionada con el prototipo del sistema. |
| Semáforo | `/semaforo` | Guía del proyecto sobre semáforos y seguridad en pasos a nivel. |
| Proceso | `/proceso` | Contexto, usuario, empatía, POV, pregunta de diseño, prototipado y búsqueda/validación final. |
| Perfil | `/perfil` | Consulta los datos del usuario almacenados en el sistema. |
| Recuperar contraseña | `/restablecer-pass` | Interfaz de recuperación de contraseña. |

Las rutas anteriores `/ubicacion`, `/cultivos` y `/asistente` se conservan como redirecciones a `/camara`, `/semaforo` y `/proceso`, respectivamente.

## API

La documentación completa de OpenAPI está disponible en `/docs` cuando el servidor está activo.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/health` | Comprueba que el servicio responde. |
| `POST` | `/registration` | Crea un usuario y asigna el rol desde la configuración del servidor. |
| `POST` | `/login` | Valida correo y contraseña; devuelve un JWT y datos básicos de la cuenta. |
| `GET` | `/perfil/usuario/{usuario_id}` | Devuelve los datos del perfil indicado. |
| `GET` | `/api/camara/stream` | Devuelve el estado y URL de la fuente de cámara; requiere `Authorization: Bearer <token>` y rol administrador. |
| `GET` | `/api/camara/video` | Transmite los frames MJPEG; requiere `Authorization: Bearer <token>` y rol administrador. |
| `GET` | `/verificar-usuario?correo=...` | Comprueba si hay una cuenta con ese correo. |
| `PUT` | `/actualizar-pass` | Actualiza la contraseña de una cuenta. |

## Base de datos

La aplicación utiliza SQLite en el archivo **`ferrox-database.db`**, ubicado junto a `database.py`. El archivo se crea al iniciar el servicio y está excluido del control de versiones.

La tabla principal `usuario` contiene:

- Identificador (`id`).
- Nombres y apellidos.
- Correo y teléfono.
- Tipo y número de identificación.
- Rol y punto de control.
- Contraseña y URL de foto de perfil.

El correo y el número de identificación tienen índices únicos. `database.py` crea las tablas que faltan y contiene compatibilidad puntual para migrar campos de una tabla de usuario antigua. No es un sistema general de migraciones de esquema.

`models.py` también define la tabla `proyecto`, que sirve como modelo de proyecto genérico.

> **Nota de configuración:** aunque `config.py` declara `DATABASE_URL`, la conexión SQLite activa se construye directamente en `database.py` con la ruta `ferrox-database.db`. Cambiar `DATABASE_URL` por sí sola no cambia la base que usa actualmente la aplicación.

## Estructura del proyecto

```text
.
├── main.py                  # Aplicación FastAPI, páginas y API
├── config.py                # Variables de entorno y configuración
├── database.py              # Motor SQLite, creación y compatibilidad de tablas
├── models.py                # Modelos SQLModel: Usuario y Proyecto
├── requirements.txt         # Dependencias de Python
├── ferrox-database.db       # Base local creada en ejecución (ignorada por Git)
├── templates/               # Páginas HTML renderizadas con Jinja2
│   ├── inicio.html
│   ├── home.html
│   ├── monitoreo.html
│   ├── camara.html
│   ├── prototipo.html
│   ├── semaforo.html
│   ├── proceso.html
│   ├── perfil.html
│   ├── restablecer_pass.html
│   ├── header.html
│   └── footer.html
└── static/
    └── scripts/             # Registro, login, perfil, cámara y generación PDF
```

## Alcance, seguridad y limitaciones

- El proyecto está preparado para desarrollo local; no se debe exponer a Internet sin revisar autenticación, autorización, almacenamiento de secretos y despliegue.
- En el código actual, las contraseñas se reciben y comparan como texto sin hash. Antes de usar cuentas reales, debe implementarse almacenamiento seguro de contraseñas y recuperación autenticada.
- Los endpoints de perfil, verificación de correo y actualización de contraseña no aplican actualmente una autorización completa basada en el usuario autenticado. Deben reforzarse antes de un uso productivo.
- `SECRET_KEY` tiene un valor predeterminado de desarrollo. Configura una clave privada propia antes de usar JWT fuera de un entorno local.
- La carga de la foto de perfil usa Supabase Storage desde el navegador. La URL y clave de publicación están configuradas en el script de registro; revisa las políticas del bucket y no coloques claves de servicio o administrativas en código cliente.
- El informe PDF es generado en el navegador y registra una observación de campo; no demuestra por sí mismo la precisión de la IA ni certifica la seguridad ferroviaria.
- La cámara, las cifras de visión artificial y los controles físicos (semáforo o barrera) requieren integración, pruebas y aprobación del personal responsable. La web no sustituye los sistemas certificados de señalización, enclavamiento ni operación ferroviaria.

## Licencia

Este repositorio no declara una licencia de distribución. Define una licencia antes de publicar, redistribuir o permitir reutilización formal del código.
