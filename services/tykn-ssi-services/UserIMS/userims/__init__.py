class ServiceError(Exception):
    pass


class WalletAlreadyExists(Exception):
    pass


class WalletDoesNotExist(Exception):
    pass


class InvalidWalletCredentials(Exception):
    pass


from .service import Service
from .config import Config, ConfigError
