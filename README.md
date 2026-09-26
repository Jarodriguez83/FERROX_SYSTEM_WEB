# BIOKUAM WEB SERVICE

Servicio web desarrollado con FastAPI, SQLModel y SQLAlchemy para gestión de desarrollo de software.

## 🚀 CARACTERÍSTICAS

- **FastAPI**: Framework moderno y rápido para APIs
- **SQLModel**: Combina SQLAlchemy y Pydantic
- **SQLAlchemy**: ORM potente para bases de datos
- **PostgreSQL/SQLite**: Soporte para múltiples bases de datos
- **Documentación**: Swagger UI en `/docs`

## 📋 REQUISITOS PREVIOS 

- Python 3.8+
- PostgreSQL (opcional, puede usar SQLite para desarrollo)

## 🔧 INSTALACIÓN

1. **CLONAR EL REPOSITORIO** (SI APLICA)

2. **CREAR ENTORNO VIRTUAL**:
```bash
python -m venv venv
```

3. **ACTIVAR ENTORNO VIRTUAL**:
   - WINDOWS: `venv\Scripts\activate`
   - LINUX/MAC: `source venv/bin/activate`

4. **INSTALAR DEPENDENCIAS**:
```bash
pip install -r requirements.txt
```

5. **CONFIGURAR VARIABLES DE ENTORNO**:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

## 🏃 EJECUCIÓN 

### DESARROLLO
```bash
python main.py
```

O usando uvicorn directamente:
```bash
uvicorn main:app --reload
```

### PRODUCCIÓN 
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 📚 DOCUMENTACIÓN 

Una vez ejecutando el servidor, accede a:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🗂️ ESTRUCTURA DEL PROYECTO

```
.
├── main.py              # Aplicación FastAPI principal
├── database.py          # Configuración de base de datos
├── models.py            # Modelos SQLModel
├── config.py            # Configuración de la aplicación
├── requirements.txt     # Dependencias
├── .env.example         # Ejemplo de variables de entorno
└── README.md            # Este archivo
```

## 🔐 VARIABLES DE ENTORNO

Crea un archivo `.env` basado en `.env.example`:

- `DATABASE_URL`: URL de conexión a la base de datos
- `SECRET_KEY`: Clave secreta para JWT (cambiar en producción)
- `CORS_ORIGINS`: Orígenes permitidos para CORS

## 📝 PRÓXIMOS AVANCES

1. Crear más modelos según tus necesidades
2. Implementar autenticación y autorización
3. Agregar validaciones y manejo de errores
4. Crear tests unitarios e integración
5. Configurar CI/CD
6. Documentar endpoints adicionales

## 🤝 CONTRIBUIR 

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 LICENCIA

Este proyecto está bajo la Licencia MIT.


