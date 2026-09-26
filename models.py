"""
Modelos de datos usando SQLModel
SQLModel combina SQLAlchemy y Pydantic en un solo modelo
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class BaseModel(SQLModel):
    """
    Modelo base con campos comunes
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


# Ejemplo de modelo - Puedes crear más modelos según tus necesidades
class Proyecto(BaseModel, table=True):
    """
    Modelo de ejemplo: Proyecto
    table=True crea la tabla en la base de datos
    """
    nombre: str = Field(index=True, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    estado: str = Field(default="activo", max_length=50)
    
    class Config:
        # Configuración adicional si es necesario
        pass

#MODELO DE USUARIO - BASE DE DATOS  
class Usuario(SQLModel, table=True): 
    #ID DEL USUARIO
    id: Optional[int] = Field(default=None, primary_key=True)
    #DATOS PERSONALES DEL USUARIO  
    nombres: str  
    apellidos: str  
    correo:str = Field(unique=True, index=True) #ESTO PERMITE QUE NO SE REPITAN CORREOS  
    #IDENTIFICACIÓN DEL USUARIO 
    tipo_identificacion: str
    numero_identificacion: str = Field(unique=True, index=True) #ESTO PERMITE QUE NO SE REPITAN NÚMEROS DE IDENTIFICACIÓN
    #DATOS DE LA FINCA 
    vereda: str  
    nombre_finca: Optional[str] = None
    folio_finca: Optional[str]= None
    #DATOS TÉCNICOS DEL USUARIO 
    referencia_prototipo: str 
    crear_contrasena: str 
    contrasena: str  
    foto_perfil: Optional[str] = Field(default="https://cdn-icons-png.flaticon.com/512/149/149071.png") #RUTA DE LA FOTO DE PERFIL 
       
    