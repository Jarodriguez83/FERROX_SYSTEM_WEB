
from fastapi import FastAPI, Depends, HTTPException, Request, APIRouter, Header
from fastapi.responses import HTMLResponse, RedirectResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates  # Agrega esto para plantillas
from httpx import request
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import jwt
from pathlib import Path
import uvicorn
import sqlite3
# IMPORTAR CONFIGURACIÓN DE LAS BASES DE DATOS
from database import create_db_and_tables, get_session, sqlite_file_name
from models import Proyecto, Usuario
from config import settings
from camera_stream import camera_stream

# INSTANCIAS DE FASTAPI
app = FastAPI(
    title="BIOKUAM - WEB SERVICE",
    description="Servicio Web de 'BIOKUAM' proyecto relacionado acerca del prototipo de una embarcación para la medición del pH y temperatura del agua determinando que tan óptima es la fuente hídrica para el riego de cultivos de maíz, en el municipio de Simijaca, Cundinamarca, Colombia.",
    version="0.1.0"
)

# CONFIGURAR EL CORS QUE PERMITE LAS PETICIONES DESDE EL FRONTEND
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# INICIALIZAR LAS BASES DE DATOS
@app.on_event("startup")
def on_startup():
    """
    EN CASO DE QUE NO EXISTAN LAS TABLAS PARA LA BASE DE DATOS LAS CREA.
    """
    create_db_and_tables()
    camera_stream.start()
    print("✅ LA BASE DE DATOS HA SIDO INICIALIZADA")


@app.on_event("shutdown")
def on_shutdown():
    camera_stream.stop()


# ENDPOINT RAÍZ 
@app.get("/", response_class=HTMLResponse, tags=["INICIO"])
def read_root(request: Request):  # Agrega request como parámetro
    """
    ENDPOINT DE BIENVENIDA AL PROYECTO EN DONDE SE RESPONDE CON UN HTML DE INICIO
    """
    return templates.TemplateResponse("inicio.html", {"request": request})  # Usa TemplateResponse

# ENDPOINT DE VERIFICACIÓN DE ESTADO DEL SERVICIO
@app.get("/health")
def health_check():
    return {"- THE STATUS SERVICE IS HEALTHY ": True}


@app.get("/api/monitoreo/conteos", tags=["MONITOREO"])
def obtener_conteos_en_vivo():
    """Devuelve la última lectura estabilizada del detector de la cámara."""
    return camera_stream.metrics()


# ========== RUTAS (ENDPOINTS) DEL PROYECTO: ==========

@app.get("/home", response_class=HTMLResponse, tags=["INICIO"])
def read_home(request: Request): # Agrega request como parámetro
    """
    ENDPOINT DE BIENVENIDA AL PROYECTO EN DONDE SE RESPONDE CON UN HTML DE INICIO
    Renderiza la plantilla home.html con Jinja2
    """
    return templates.TemplateResponse("home.html", {"request": request})  # Usa TemplateResponse

@app.get("/proceso", response_class=HTMLResponse, tags=["PROCESO DEL PROYECTO"])
def read_proceso(request: Request):
    """Presenta el proceso de diseño, evaluación y prototipado de FERROX."""
    return templates.TemplateResponse("proceso.html", {"request": request})

@app.get("/asistente", include_in_schema=False)
def asistente_legacy():
    """Mantiene la ruta anterior y dirige a la sección de proceso del proyecto."""
    return RedirectResponse(url="/proceso", status_code=307)

@app.get("/camara", response_class=HTMLResponse, tags=["CÁMARA"])
def read_camara(request: Request):
    """Pantalla de monitoreo en vivo del cruce ferroviario."""
    return templates.TemplateResponse("camara.html", {"request": request})

@app.get("/ubicacion", include_in_schema=False)
def ubicacion_legacy():
    """Conserva los enlaces antiguos y los dirige a la nueva pestaña de cámara."""
    return RedirectResponse(url="/camara", status_code=307)

@app.get("/api/camara/stream", tags=["CÁMARA"])
def obtener_stream_camara(authorization: Optional[str] = Header(default=None), session: Session = Depends(get_session)):
    """Entrega la fuente de video solo a cuentas con rol administrador."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="INICIA SESIÓN PARA CONTINUAR.")
    try:
        payload = jwt.decode(
            authorization.split(" ", 1)[1],
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        usuario_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="SESIÓN INVÁLIDA O EXPIRADA.")
    usuario = session.get(Usuario, usuario_id)
    is_admin = usuario and (
        str(usuario.rol or "").strip().upper() == "ADMINISTRADOR"
        or usuario.correo.strip().lower() in settings.ADMIN_EMAILS
    )
    if not is_admin:
        raise HTTPException(status_code=403, detail="ACCESO RESTRINGIDO A ADMINISTRADORES.")
    return {
        "configured": True,
        "stream_url": "/api/camara/video",
        "stream_type": "mjpeg",
        "camera": camera_stream.status(),
    }


@app.get("/api/camara/video", tags=["CÁMARA"])
def video_camara(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    """Entrega el MJPEG únicamente a administradores autenticados."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="INICIA SESIÓN PARA CONTINUAR.")
    try:
        payload = jwt.decode(
            authorization.split(" ", 1)[1],
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        usuario_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="SESIÓN INVÁLIDA O EXPIRADA.")
    usuario = session.get(Usuario, usuario_id)
    is_admin = usuario and (
        str(usuario.rol or "").strip().upper() == "ADMINISTRADOR"
        or usuario.correo.strip().lower() in settings.ADMIN_EMAILS
    )
    if not is_admin:
        raise HTTPException(status_code=403, detail="ACCESO RESTRINGIDO A ADMINISTRADORES.")

    def frames():
        sequence = 0
        while True:
            next_frame = camera_stream.wait_for_frame(sequence, timeout=10)
            if next_frame is None:
                # Keep the HTTP stream alive while the camera reconnects.
                yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n\xff\xd8\xff\xd9\r\n"
                continue
            sequence, jpeg = next_frame
            yield b"--frame\r\nContent-Type: image/jpeg\r\nContent-Length: " + str(len(jpeg)).encode() + b"\r\n\r\n" + jpeg + b"\r\n"

    return StreamingResponse(
        frames(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"},
    )

@app.get("/semaforo", response_class=HTMLResponse, tags=["SEMÁFORO"])
def read_semaforo(request: Request):
    """Guía FERROX sobre semáforos y seguridad en pasos a nivel ferroviarios."""
    return templates.TemplateResponse("semaforo.html", {"request": request})

@app.get("/cultivos", include_in_schema=False)
def cultivos_legacy():
    """Mantiene operativo el enlace anterior y lo dirige a la guía de semáforos."""
    return RedirectResponse(url="/semaforo", status_code=307)

@app.get("/prototipo", response_class=HTMLResponse, tags=["PROTOTIPO"])
def read_prototipo(request: Request): # Agrega request como parámetro
    """
    ENDPOINT DEL PROTOTIPO DEL PROYECTO EN DONDE SE RESPONDE CON UN HTML DEL PROTOTIPO
    Renderiza la plantilla prototipo.html con Jinja2
    """
    return templates.TemplateResponse("prototipo.html", {"request": request})  # Usa TemplateResponse

@app.get("/monitoreo", response_class=HTMLResponse, tags=["MONITOREO"])
def read_monitoreo(request: Request): # Agrega request como parámetro
    """
    ENDPOINT DEL MONITOREO DEL PROYECTO EN DONDE SE RESPONDE CON UN HTML DEL MONITOREO
    Renderiza la plantilla monitoreo.html con Jinja2
    """
    return templates.TemplateResponse("monitoreo.html", {"request": request})  # Usa TemplateResponse

@app.get("/perfil", response_class=HTMLResponse, tags=["PERFIL"])
def read_perfil(request: Request): # Agrega request como parámetro
    """
    ENDPOINT DEL PERFIL DEL PROYECTO EN DONDE SE RESPONDE CON UN HTML DEL PERFIL
    Renderiza la plantilla perfil.html con Jinja2
    """
    return templates.TemplateResponse("perfil.html", {"request": request})  # Usa TemplateResponse

@app.post("/registration", tags=["REGISTRO"])
def registro_usuario(usuario: Usuario, session: Session = Depends(get_session)):  
    try:  
        # El alta pública no puede conceder privilegios administrativos.
        usuario.rol = "ADMINISTRADOR" if usuario.correo.strip().lower() in settings.ADMIN_EMAILS else "USUARIO"
        session.add(usuario)  
        session.commit()
        session.refresh(usuario)
        return {"status": "success", "usuario_id": usuario.id, "message": "EL USUARIO SE REGISTRO EXITOSAMENTE."}
    except Exception as e:  
        session.rollback()
        raise HTTPException(status_code=400, detail=f"ERROR AL REGISTRAR EL USUARIO: {str(e)}")

@app.post("/login", tags=["LOGIN"])
def login_usuario(datos: dict, session: Session = Depends(get_session)): 
    correo = datos.get("correo").strip() if datos.get("correo") else ""
    contrasena = datos.get("contrasena").strip() if datos.get("contrasena") else ""
    #BUSCAR AL USUARIO POR CORREO  
    statement = select(Usuario).where(Usuario.correo == correo)
    usuario = session.exec(statement).first()
      
    if not usuario:  
        raise HTTPException(status_code=404, detail="USUARIO NO ENCONTRADO.")
    if (usuario.contrasena or "").strip() != contrasena:
        raise HTTPException(status_code=401, detail="CONTRASEÑA INCORRECTA.")
    access_token = jwt.encode(
        {
            "sub": str(usuario.id),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return {
        "status": "success",
        "usuario_id": usuario.id,
        "access_token": access_token,
        "token_type": "bearer",
        "nombres": usuario.nombres,
        "apellidos": usuario.apellidos,
        "foto_perfil": usuario.foto_perfil,
        "message": f"BIENVENIDO A BIOKUAM, {usuario.nombres} {usuario.apellidos}."
    }

@app.get("/perfil/usuario/{usuario_id}", tags=["PERFIL"])
def obtener_perfil_usuario(usuario_id: int, session: Session = Depends(get_session)):  
    usuario = session.get(Usuario, usuario_id)  
    if not usuario:  
        raise HTTPException(status_code=404, detail="USUARIO NO ENCONTRADO.")  
    return {
        "nombres": usuario.nombres,
        "apellidos": usuario.apellidos,
        "correo": usuario.correo,
        "telefono": usuario.telefono,
        "numero_identificacion": usuario.numero_identificacion, 
        "tipo_identificacion": usuario.tipo_identificacion,
        "rol": usuario.rol,
        "punto_control": usuario.punto_control,
        "foto_perfil": usuario.foto_perfil,
        }

@app.get("/restablecer-pass", response_class=HTMLResponse, tags=["RESTABLECER CONTRASEÑA"])
def read_restablecer_pass(request: Request): # Agrega request como parámetro
    """
    ENDPOINT DEL RESTABLECER CONTRASEÑA DEL PROYECTO EN DONDE SE RESPONDE CON UN HTML DEL RESTABLECER CONTRASEÑA
    Renderiza la plantilla restablecer_pass.html con Jinja2
    """
    return templates.TemplateResponse("restablecer_pass.html", {"request": request})  # USO DE TEMPLATERESPONSE

@app.get("/verificar-usuario")
async def verificar_usuario(correo: str):
    try: 
        #SE CONSULTA EN LA BASE DE DATOS SI ESTÁ EL CORREO QUE INGRESA EL USUARIO
        conn = sqlite3.connect(str(sqlite_file_name))
        cursor = conn.cursor()
        #BUSCAR AL USUARIO POR CORREO
        cursor.execute("SELECT nombres FROM usuario WHERE correo = ?", (correo,))
        resultado = cursor.fetchone()
        conn.close()

        if resultado:  
            return {
                "status": "encontrado",  
                "nombre": resultado[0], 
                "correo": correo
            }
        else:  
            raise HTTPException(status_code=404, detail="CORREO NO ESTÁ REGISTRADO.")
    except Exception as e: 
        print(f"ERROR LEYENDO LA DB: {e}")
        raise HTTPException(status_code=500, detail="ERROR AL LEER LA BASE DE DATOS")

@app.put("/actualizar-pass")
async def actualizar_pass(datos: dict):  
    #'DATOS' CONTIENE EL CORREO Y LA NUEVA CONTRASEÑA  
    correo = datos.get("correo")
    new_pass = datos.get("new_pass")
    if not correo or not new_pass:  
        raise HTTPException(status_code=400, detail="FALTAN DATOS.")
    try:  
        conn = sqlite3.connect(str(sqlite_file_name))
        cursor = conn.cursor()
        #VERIFICAR SI EL USUARIO SI EXISTE
        cursor.execute("UPDATE usuario SET contrasena = ? WHERE correo = ?", (new_pass, correo))
        conn.commit() #PARA GUARDAR DATOS EN DB
        conn.close()
        return{
            "status": "success", 
            "message": "CONTRASEÑA ACTUALIZADA CORRECTAMENTE"
        }
    except Exception as e: 
        print (f"ERROR AL ACTUALIZAR LA CONTRASEÑA: {e}")
        raise HTTPException (status_code=500, detail="ERROR AL ACTUALIZAR EN LA BASE DE DATOS")

# CONFIGURACIÓN DELAS PLANTILLAS JINJA2 
BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

