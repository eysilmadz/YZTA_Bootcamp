from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import router as api_router
from app.db.base import engine, Base

# Import models to ensure they are registered with the metadata
import app.db.models  # noqa: F401

# Create tables if they do not exist (useful for fast SQLite onboarding/dev)
Base.metadata.create_all(bind=engine)

def run_auto_migrations():
    from sqlalchemy import text
    with engine.begin() as conn:
        # Add password_hash column to users table if missing
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR;"))
            print("Successfully added password_hash column to users table.")
        except Exception:
            pass

        # Add profile_picture column to users table if missing
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN profile_picture VARCHAR;"))
            print("Successfully added profile_picture column to users table.")
        except Exception:
            pass

        # Add user_id column to cv_profiles table if missing
        try:
            conn.execute(text("ALTER TABLE cv_profiles ADD COLUMN user_id INTEGER;"))
            print("Successfully added user_id column to cv_profiles table.")
        except Exception:
            pass

        # Add europass_data column to cv_profiles table if missing
        try:
            conn.execute(text("ALTER TABLE cv_profiles ADD COLUMN europass_data JSON;"))
            print("Successfully added europass_data column to cv_profiles table.")
        except Exception:
            pass

        # Check and migrate cv_profiles session_id constraint if not null
        try:
            res = conn.execute(text("PRAGMA table_info(cv_profiles);")).fetchall()
            session_id_col = next((r for r in res if r[1] == "session_id"), None)
            if session_id_col and session_id_col[3] == 1:  # 1 means NOT NULL is enabled
                conn.execute(text("PRAGMA foreign_keys=off;"))
                conn.execute(text("ALTER TABLE cv_profiles RENAME TO _cv_profiles_old;"))
                conn.execute(text("""
                    CREATE TABLE cv_profiles (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id INTEGER UNIQUE,
                        user_id INTEGER,
                        level VARCHAR,
                        tech_stack JSON,
                        strengths_weaknesses JSON,
                        raw_analysis VARCHAR,
                        europass_data JSON,
                        FOREIGN KEY(session_id) REFERENCES interview_sessions(id),
                        FOREIGN KEY(user_id) REFERENCES users(id)
                    );
                """))
                conn.execute(text("""
                    INSERT INTO cv_profiles (id, session_id, user_id, level, tech_stack, strengths_weaknesses, raw_analysis, europass_data)
                    SELECT id, session_id, user_id, level, tech_stack, strengths_weaknesses, raw_analysis, NULL FROM _cv_profiles_old;
                """))
                conn.execute(text("DROP TABLE _cv_profiles_old;"))
                conn.execute(text("PRAGMA foreign_keys=on;"))
                print("Successfully migrated cv_profiles table to make session_id nullable.")
        except Exception as e:
            print(f"Error during cv_profiles nullable migration: {e}")

run_auto_migrations()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": f"Welcome to {settings.PROJECT_NAME} Backend API. Swagger documentation is available at /docs.",
    }
