from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://noted:noted@db:5432/noted"
    gemini_api_key: str = ""
    data_dir: str = "/data"


settings = Settings()
