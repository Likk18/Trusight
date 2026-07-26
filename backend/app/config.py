"""Pydantic Settings configuration for TruSight backend."""
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Application
    app_name: str = Field(default="TruSight API", description="Application name")
    app_version: str = Field(default="1.0.0", description="API version")
    debug: bool = Field(default=False, description="Enable debug mode")

    # Database
    database_url: str = Field(
        default="sqlite+aiosqlite:///./storage/trusight.db",
        description="Async SQLAlchemy database URL",
    )

    # CORS
    cors_origins: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
        description="Allowed CORS origins",
    )

    # WebSocket
    ws_telemetry_interval: float = Field(
        default=1.0, description="WebSocket telemetry push interval in seconds (1Hz)"
    )

    # Simulation
    simulation_base_truth_score: float = Field(
        default=84.0, description="Base truth likelihood for simulation"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
