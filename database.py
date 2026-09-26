"""
CONFIGURACIÓN DE LA BASE DE DATOS
"""
from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path
import models

#DEFINIR EL NOMBRE DEL ARCHIVO DE LAS BASES DE DATOS
sqlite_file_name = Path(__file__).resolve().parent / "ferrox-database.db"
sqlite_url = f"sqlite:///{sqlite_file_name.as_posix()}"

#CREAR EL ENGINE  
engine = create_engine(sqlite_url, echo=True)

#DEFINIR UNA FUNCIÓN PARA LA CREACIÓN DE LAS TABLAS  
def create_db_and_tables():  
    # Si la tabla antigua tiene campos obligatorios que ya no existen en el formulario,
    # reconstruirla conservando los usuarios y sus datos compatibles.
    with engine.begin() as connection:
        tables = {row[0] for row in connection.exec_driver_sql("SELECT name FROM sqlite_master WHERE type='table'")}
        if "usuario" in tables:
            columns = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(usuario)")}
            if "crear_contrasena" in columns:
                connection.exec_driver_sql("ALTER TABLE usuario RENAME TO usuario_legacy")
                indexes = connection.exec_driver_sql("PRAGMA index_list(usuario_legacy)").fetchall()
                for index in indexes:
                    connection.exec_driver_sql(f'DROP INDEX "{index[1]}"')
    #HEREDAR DESDE SQLMODEL Y CREAR LAS TABLAS EN EL MOTOR
    SQLModel.metadata.create_all(engine)
    with engine.begin() as connection:
        tables = {row[0] for row in connection.exec_driver_sql("SELECT name FROM sqlite_master WHERE type='table'")}
        if "usuario_legacy" in tables:
            old = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(usuario_legacy)")}
            new = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(usuario)")}
            shared = [name for name in ("id", "nombres", "apellidos", "correo", "tipo_identificacion", "numero_identificacion", "vereda", "nombre_finca", "folio_finca", "referencia_prototipo", "contrasena", "foto_perfil") if name in old and name in new]
            destinations = shared + ["telefono", "rol", "punto_control"]
            expressions = [f'"{name}"' for name in shared] + ["''", "'USUARIO'", "''"]
            connection.exec_driver_sql(f'INSERT INTO usuario ({", ".join(destinations)}) SELECT {", ".join(expressions)} FROM usuario_legacy')
            connection.exec_driver_sql("DROP TABLE usuario_legacy")
    # Agrega columnas nuevas a bases existentes; create_all por sí solo no altera tablas.
    with engine.begin() as connection:
        columns = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(usuario)")}
        additions = {
            "telefono": "VARCHAR",
            "rol": "VARCHAR",
            "punto_control": "VARCHAR",
        }
        for name, sql_type in additions.items():
            if columns and name not in columns:
                connection.exec_driver_sql(f'ALTER TABLE usuario ADD COLUMN "{name}" {sql_type}')

#FUNCIÓN PARA OBTENER LA SESIÓN DE LA BASE DE DATOS
def get_session():  
    with Session(engine) as session:  
        yield session 
    
