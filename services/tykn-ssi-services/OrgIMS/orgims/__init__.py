class ServiceError(Exception):
    pass


from .service import Service
from .config import Config, ConfigError
