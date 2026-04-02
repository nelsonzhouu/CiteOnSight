from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""
    # Populated at deploy time with the actual extension ID.
    # During local development, you can add http://localhost:* here as well.
    allowed_origins: list[str] = []

    class Config:
        env_file = ".env"


settings = Settings()

app = FastAPI(title="CiteOnSight API")

# Restrict cross-origin requests to the Chrome extension only.
# chrome-extension://<id> is the origin Chrome assigns to extension pages.
# Leaving this open would allow any website to call the API on behalf of a user.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}
