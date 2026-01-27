import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# 도커 환경에서는 DB_HOST가 'db'여야 하고, 포트는 내부 포트인 '3306'이어야 합니다.
DB_USER = os.getenv("DB_USER", "appuser")
DB_PASSWORD = os.getenv("DB_PASSWORD", "apppassword")
DB_HOST = os.getenv("DB_HOST", "db")   # '127.0.0.1' 대신 'db'
DB_PORT = os.getenv("DB_PORT", "3306") # '3307' 대신 '3306'
DB_NAME = os.getenv("DB_NAME", "admin_assistant")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()