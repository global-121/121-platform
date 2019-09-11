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
            steward_did = data['steward_did']
            wallet_name = data['wallet_name']
            wallet_passphrase = data['wallet_passphrase']
            wallet_path = data['wallet_path']
            genesis_tx_path = data['genesis_tx_path']
        except KeyError as e:
            raise ConfigError(f'Missing required configuration field {e}')

        return cls(address, port, steward_did, wallet_name, wallet_passphrase, wallet_path, genesis_tx_path)

    def __init__(self, address, port, steward_did, wallet_name, wallet_passphrase, wallet_path, genesis_tx_path):
        self.address = address
        self.port = port
        self.steward_did = steward_did
        self.wallet_name = wallet_name
        self.wallet_passphrase = wallet_passphrase
        self.wallet_path = wallet_path
        self.genesis_tx_path = genesis_tx_path

