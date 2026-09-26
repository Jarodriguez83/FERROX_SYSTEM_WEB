# FERROX SYSTEM

Plataforma web para supervisar y organizar información relacionada con el cruce ferroviario de Simijaca, Cundinamarca. El proyecto combina una interfaz web, servicios construidos con FastAPI y almacenamiento local de usuarios con SQLite. La sección de cámara está preparada para mostrar la transmisión de una cámara IP cuando se configure una fuente compatible con navegadores.

## Objetivos

- Reunir en un solo sitio las secciones de supervisión del cruce ferroviario.
- Permitir a los usuarios iniciar sesión y consultar su perfil.
- Dar acceso administrativo a la fuente de video del cruce.
- Presentar las secciones de monitoreo, semáforo, barrera y eventos del sistema.

## Funcionalidades y estado

| Sección | Ruta | Descripción |
| --- | --- | --- |
| Inicio | `/` y `/home` | Registro, inicio de sesión y página de presentación del sistema. |
| Monitoreo | `/monitoreo` | Panel con gráficas y generación de reportes. Algunas gráficas se obtienen de ThingSpeak. |
| Semáforo | `/cultivos` | Sección enlazada desde la navegación como semáforo. Su plantilla conserva contenido anterior sobre cultivos y requiere adaptación al sistema ferroviario. |
| Barrera | `/prototipo` | Sección enlazada como barrera. La plantilla conserva contenido anterior sobre un prototipo y requiere adaptación. |
| Cámara | `/camara` | Visor amplio con controles de recarga y pantalla completa, información del cruce y verificación administrativa. Requiere configurar la URL de transmisión. |
| Eventos | `/asistente` | Página de asistente; el contenido actual todavía conserva referencias a BIOKUAM/Gemini. |
| Perfil | `/perfil` | Datos del usuario que inició sesión. |
| Documentación de API | `/docs` | Documentación interactiva de FastAPI. |

La ruta antigua `/ubicacion` redirige a `/camara` para mantener funcionando enlaces anteriores.

## Tecnologías

- Python y FastAPI para el servidor y la API.
- SQLModel y SQLAlchemy para los modelos y el acceso a datos.
- SQLite como base de datos local.
- Jinja2 para renderizar las páginas HTML.
- JavaScript, HTML y CSS para la interfaz y sus interacciones.
- ThingSpeak para algunas gráficas de monitoreo.

## Requisitos

- Python 3.10 o posterior.
- `pip`.
- Una fuente de video de cámara accesible desde el navegador, o un gateway que convierta el video de la cámara.

## Instalación local

Desde la carpeta raíz del repositorio, crea y activa un entorno virtual.

### Windows PowerShell

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### macOS o Linux

```bash
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Configuración

Crea un archivo `.env` en la raíz del proyecto. No subas ese archivo al repositorio ni compartas sus secretos.

```env
SECRET_KEY=reemplaza-esto-por-una-clave-larga-y-aleatoria
ADMIN_EMAILS=admin@ejemplo.com
CAMERA_STREAM_URL=http://direccion-de-la-camara/video
CAMERA_STREAM_TYPE=mjpeg
```

### Variables

| Variable | Uso |
| --- | --- |
| `SECRET_KEY` | Firma los tokens de acceso. Debe ser una clave privada, larga y aleatoria. |
| `ADMIN_EMAILS` | Lista de correos separados por comas que reciben privilegios de administrador al registrarse y pueden abrir la fuente de cámara. |
| `CAMERA_STREAM_URL` | URL de video accesible desde el navegador o desde el equipo donde se abre la aplicación. |
| `CAMERA_STREAM_TYPE` | Tipo de fuente: por ejemplo `mjpeg` o `hls`. |

Si no defines `CAMERA_STREAM_URL`, la página de cámara muestra el estado de configuración pendiente.

### Compatibilidad de la cámara

Los navegadores no reproducen directamente una dirección RTSP. Si la cámara solo ofrece RTSP, configura un gateway que la convierta a MJPEG o HLS y utiliza la URL web del gateway. La reproducción HLS depende de que el navegador la soporte de forma nativa. WebRTC requeriría integrar un reproductor y su señalización, lo cual aún no está implementado. El formato y la URL dependen del modelo de cámara y de su configuración de red.

## Ejecución

Con el entorno virtual activo, inicia el servidor desde la raíz del proyecto:

```powershell
python main.py
```

También puedes iniciarlo con Uvicorn y recarga automática:

```powershell
python -m uvicorn main:app --reload
```

Abre [http://localhost:8000](http://localhost:8000). La documentación de la API se encuentra en [http://localhost:8000/docs](http://localhost:8000/docs), y el estado del servicio en [http://localhost:8000/health](http://localhost:8000/health).

## Base de datos

La configuración actual crea o abre `ferrox-database.db` en la misma carpeta que `database.py`. La tabla `usuario` almacena nombres, apellidos, correo, teléfono, tipo y número de identificación, rol, punto de control, contraseña y foto de perfil. La base SQLite y el archivo `.env` están excluidos del control de versiones.

Las tablas se crean al iniciar la aplicación. `create_all` no realiza migraciones generales de esquema; `database.py` incluye una adaptación puntual para el esquema de usuario anterior.

## API principal

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/health` | Comprueba el estado del servidor. |
| `POST` | `/registration` | Registra una cuenta; las cuentas nuevas solo reciben rol administrativo si el correo está en `ADMIN_EMAILS`. |
| `POST` | `/login` | Valida las credenciales y devuelve un token de acceso. |
| `GET` | `/perfil/usuario/{usuario_id}` | Devuelve la información del perfil. |
| `GET` | `/api/camara/stream` | Devuelve la URL de video con un token válido y privilegios administrativos. |

## Estructura del repositorio

```text
.
├── main.py                    # Aplicación FastAPI y rutas
├── config.py                  # Configuración y variables de entorno
├── database.py                # Motor SQLite y creación de tablas
├── models.py                  # Modelos SQLModel
├── requirements.txt           # Dependencias Python
├── templates/                 # Páginas HTML con Jinja2
│   ├── camara.html
│   ├── header.html
│   ├── footer.html
│   └── ...
└── static/
    └── scripts/                # JavaScript de formularios y módulos
```

## Seguridad y consideraciones

- Configura un `SECRET_KEY` propio antes de cualquier despliegue.
- La URL y credenciales de la cámara deben mantenerse fuera del código fuente.
- La configuración actual de usuarios es una base de desarrollo; revisa el almacenamiento de contraseñas, la gestión de sesiones y la protección de las claves de integraciones externas antes de exponer el sistema a Internet.
- La configuración predeterminada usa SQLite local y no es una configuración de alta disponibilidad.

## Licencia

No se identifica una licencia de distribución en la configuración actual del repositorio. Define una licencia antes de publicar o redistribuir el proyecto.
