import json


class ConfigError(Exception):
    pass


class Config:
    @classmethod
    def load(cls, raw_config):
        try:
            data = json.loads(raw_config)
        except ValueError as e:
            raise ConfigError('Failed to load JSON') from e

        try:
            address = data['address']
            port = data['port']
            wallet_path = data['wallet_path']
            genesis_tx_path = data['genesis_tx_path']
        except KeyError as e:
            raise ConfigError(f'Missing required configuration field {e}')

        return cls(address, port, wallet_path, genesis_tx_path)

    def __init__(self, address, port, wallet_path, genesis_tx_path):
        self.address = address
        self.port = port
        self.wallet_path = wallet_path
        self.genesis_tx_path = genesis_tx_path