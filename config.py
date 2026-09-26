"""
Configuración de la aplicación usando variables de entorno
"""
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()


class Settings:
    """
    Configuración centralizada de la aplicación
    """
    # Base de datos
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./biokuam.db"
    )
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "BIOKUAM Web Service"
    VERSION: str = "0.1.0"
    
    # Seguridad (para JWT, etc.)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tu-clave-secreta-aqui-cambiar-en-produccion")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: list = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:8000"
    ).split(",")
    
    # Entorno
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"


# Instancia global de configuración
settings = Settings()

