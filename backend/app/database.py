import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import get_settings

logger = logging.getLogger("hackathon_app")
settings = get_settings()

db_url = settings.DATABASE_URL
engine_kwargs = {"echo": settings.DEBUG}

if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production-ready PostgreSQL / MySQL connection pool configuration
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
    engine_kwargs["pool_recycle"] = settings.DB_POOL_RECYCLE

try:
    engine = create_engine(db_url, **engine_kwargs)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info(f"Connected to database engine: {db_url.split('://')[0]}")
except Exception as e:
    logger.warning(f"Could not connect to {db_url}: {e}")
    logger.warning("Falling back to local SQLite engine (sqlite:///./hackathon.db) for local execution...")
    fallback_url = "sqlite:///./hackathon.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False}, echo=settings.DEBUG)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
