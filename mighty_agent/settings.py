from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

APP_ROOT = Path(__file__).parent.parent


class Settings(BaseSettings):
    """
    Application settings.

    These parameters can be configured
    with environment variables.
    """

    host: str = "127.0.0.1"
    port: int = 8000
    # quantity of workers for uvicorn
    workers_count: int = 1
    # Enable uvicorn reloading
    reload: bool = False

    # Current environment
    environment: str = "dev"

    log_level: str = "INFO"

    # Variables for the database
    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "lemonai"
    db_pass: str = "lemonai"
    db_base: str = "lemonai"
    db_echo: bool = False

    # This variable is used to define
    # connections to remote databases
    # It has the following format:
    # postgresql://user:password@host:port/database
    db_url: str | None = None

    # Sentry's configuration.
    sentry_dsn: str | None = None
    sentry_sample_rate: float = 1.0

    # Grpc endpoint for opentelemetry.
    opentelemetry_endpoint: str | None = None

    # This variable is used to define the path to the public key
    # used for JWT verification.
    jwt_public_key_path: Path | None = None

    # This variable is used to define the path to the private key
    # used for JWT generation.
    jwt_private_key_path: Path | None = None

    # This variable is used to define the algorithm for JWT.
    jwt_algorithm: str = "RS256"

    @property
    def db_url_internal(self) -> str:
        """
        Assemble database URL from settings.

        :return: database URL.
        """
        if self.db_url:
            return self.db_url
        return (
            f"postgresql+asyncpg://{self.db_user}:{self.db_pass}@"
            f"{self.db_host}:{self.db_port}/{self.db_base}"
        )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
