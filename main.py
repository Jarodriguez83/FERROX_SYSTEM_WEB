
from fastapi import FastAPI, Depends, HTTPException, Request, APIRouter  # Agrega Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates  # Agrega esto para plantillas
from httpx import request
from sqlmodel import Session, select
from typing import List
from pathlib import Path
import uvicorn
import sqlite3
# IMPORTAR CONFIGURACIÓN DE LAS BASES DE DATOS
from database import create_db_and_tables, get_session
from models import Proyecto, Usuario

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
    print("✅ LA BASE DE DATOS HA SIDO INICIALIZADA")


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


# ========== RUTAS (ENDPOINTS) DEL PROYECTO: ==========

@app.get("/home", response_class=HTMLResponse, tags=["INICIO"])
def read_home(request: Request): # Agrega request como parámetro
    """
    ENDPOINT DE BIENVENIDA AL PROYECTO EN DONDE SE RESPONDE CON UN HTML DE INICIO
    Renderiza la plantilla home.html con Jinja2
    """
    return templates.TemplateResponse("home.html", {"request": request})  # Usa TemplateResponse

@app.get("/asistente", response_class=HTMLResponse, tags=["ASISTENTE IA"])
def read_asistente(request: Request): # Agrega request como parámetro
    """
    ENDPOINT DEL ASISTENTE IA DEL PROYECTO EN DONDE SE RESPONDE CON UN HTML DEL ASISTENTE IA
    Renderiza la plantilla asistente.html con Jinja2
    """
    return templates.TemplateResponse("asistente.html", {"request": request})  # Usa TemplateResponse

@app.get("/ubicacion", response_class=HTMLResponse, tags=["UBICACIÓN"])
def read_ubicacion(request: Request): # Agrega request como parámetro
    """
    ENDPOINT DE LA UBICACIÓN DEL PROYECTO EN DONDE SE RESPONDE CON UN HTML DE LA UBICACIÓN
    Renderiza la plantilla ubicacion.html con Jinja2
    """
    return templates.TemplateResponse("ubicacion.html", {"request": request})  # Usa TemplateResponse

@app.get("/cultivos", response_class=HTMLResponse, tags=["CULTIVOS"])
def read_cultivos(request: Request): # Agrega request como parámetro
    """
    ENDPOINT DE LOS CULTIVOS DEL PROYECTO EN DONDE SE RESPONDE CON UN HTML DE LOS CULTIVOS
    Renderiza la plantilla cultivos.html con Jinja2
    """
    return templates.TemplateResponse("cultivos.html", {"request": request})  # Usa TemplateResponse

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
    if usuario.contrasena.strip() != contrasena:
        raise HTTPException(status_code=401, detail="CONTRASEÑA INCORRECTA.")
    return {
        "status": "success",
        "usuario_id": usuario.id,
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
        "vereda": usuario.vereda,
        "foto_perfil": usuario.foto_perfil, 
        "nombre_finca": usuario.nombre_finca,     
        "numero_identificacion": usuario.numero_identificacion, 
        "tipo_identificacion": usuario.tipo_identificacion,
        "referencia_prototipo": usuario.referencia_prototipo
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
        conn = sqlite3.connect ('biokuam-database.db')
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
        conn = sqlite3.connect('biokuam-database.db')
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
app.mount("/static", StaticFiles(directory="static"), name="static")  # MONTAR LOS ARCHIVOS ESTÁTICOS
templates = Jinja2Templates(directory="templates")  # DIRECTORIO DE PLANTILLAS 

