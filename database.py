"""
CONFIGURACIÓN DE LA BASE DE DATOS
"""
from sqlmodel import SQLModel, create_engine, Session
import models

#DEFINIR EL NOMBRE DEL ARCHIVO DE LAS BASES DE DATOS
sqlite_file_name = "biokuam-database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

#CREAR EL ENGINE  
engine = create_engine(sqlite_url, echo=True)

#DEFINIR UNA FUNCIÓN PARA LA CREACIÓN DE LAS TABLAS  
def create_db_and_tables():  
    #HEREDAR DESDE SQLMODEL Y CREAR LAS TABLAS EN EL MOTOR  
    SQLModel.metadata.create_all(engine)

#FUNCIÓN PARA OBTENER LA SESIÓN DE LA BASE DE DATOS
def get_session():  
    with Session(engine) as session:  
        yield session 
    