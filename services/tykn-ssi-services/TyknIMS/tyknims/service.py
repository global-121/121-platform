import json
import os
import pprint

from indy import anoncreds, wallet, pool, did, ledger
from indy.error import IndyError, ErrorCode

from . import ServiceError
from .server import Server


def _get_wallet_config_and_credentials(wallet_name, wallet_passphrase, wallet_path):
    wallet_config = {
        'id': wallet_name,
        'storage_config': {
            'path': wallet_path,
        }
    }
    wallet_credentials = {
        'key': wallet_passphrase,
    }

    return json.dumps(wallet_config), json.dumps(wallet_credentials)


class Service:
    def __init__(self, config, logger, loop):
        self._logger = logger
        self._config = config
        self._loop = loop
        self._server = None
        self._wallet_handle = None
        self._pool_handle = None
        self._did = None
        self._verkey = None

    async def setup(self):
        await self._connect_to_pool()
        wallet_path = os.path.join(self._config.wallet_path, self._config.wallet_name)
        if os.path.exists(wallet_path):
            # Fresh run every time for demo purpose
            await self._delete_wallet()
        await self._create_wallet()
        await self._open_wallet()
        await self._assume_stewardship()

    def start(self):
        self._server = Server(self._config.address, self._config.port, self, self._logger, self._loop)
        self._server.start()

    async def _connect_to_pool(self):
        try:
            await pool.set_protocol_version(2)
        except IndyError as e:
            raise ServiceError('Failed to setup protocol version') from e

        self._logger.debug('Creating pool ledger config and connecting to pool')

        pool_config = {
            'genesis_txn': self._config.genesis_tx_path,
        }
        pool_config_json = json.dumps(pool_config)

        try:
            await pool.create_pool_ledger_config('pool-config-tykn', pool_config_json)
        except IndyError as e:
            if e.error_code != ErrorCode.PoolLedgerConfigAlreadyExistsError:
                raise ServiceError('Failed to create pool ledger config') from e

        try:
            self._pool_handle = await pool.open_pool_ledger('pool-config-tykn', None)
        except IndyError as e:
            raise ServiceError('Failed to connect to pool') from e

        self._logger.debug('Connected to pool')

    async def _delete_wallet(self):
        self._logger.debug('Deleting wallet')

        config, credentials = _get_wallet_config_and_credentials(self._config.wallet_name,
                                                                 self._config.wallet_passphrase,
                                                                 self._config.wallet_path)

        try:
            await wallet.delete_wallet(config, credentials)
        except IndyError as e:
            raise ServiceError('Failed to delete wallet') from e

        self._logger.debug('Deleted wallet')

    async def _create_wallet(self):
        self._logger.debug(f'Creating wallet. Name: {self._config.wallet_name}. Path: {self._config.wallet_path}')

        config, credentials = _get_wallet_config_and_credentials(self._config.wallet_name,
                                                                 self._config.wallet_passphrase,
                                                                 self._config.wallet_path)

        try:
            await wallet.create_wallet(config, credentials)
        except IndyError as e:
            raise ServiceError('Failed to create wallet') from e

        self._logger.debug(f'Wallet {self._config.wallet_name} created')

    async def _open_wallet(self):
        self._logger.debug('Opening wallet')

        config, credentials = _get_wallet_config_and_credentials(self._config.wallet_name,
                                                                 self._config.wallet_passphrase,
                                                                 self._config.wallet_path)

        try:
            self._wallet_handle = await wallet.open_wallet(config, credentials)
        except IndyError as e:
            raise ServiceError('Failed to open wallet') from e

        self._logger.debug('Wallet opened')

    async def _assume_stewardship(self):
        self._logger.debug('Assuming stewardship. Creating DID/Verkey pair')

        did_info = {
            'seed': '000000000000000000000000Steward1',
        }
        did_info_json = json.dumps(did_info)

        try:
            steward_did, steward_verkey = await did.create_and_store_my_did(self._wallet_handle, did_info_json)
        except IndyError as e:
            raise ServiceError('Failed to get DID') from e

        self._did = steward_did
        self._verkey = steward_verkey

        self._logger.debug(f'DID: {self._did}. Verkey: {self._verkey}')

    async def create_trust_anchor(self, trust_anchor_did, trust_anchor_verkey, alias=None):
        self._logger.info(f'Creating Trust Anchor. DID: {trust_anchor_did}.'
                          f' Verkey: {trust_anchor_verkey}')

        try:
            nym_request_json = await ledger.build_nym_request(submitter_did=self._did,
                                                              target_did=trust_anchor_did,
                                                              ver_key=trust_anchor_verkey,
                                                              alias=alias,
                                                              role='TRUST_ANCHOR')
            self._logger.debug(f'Nym transaction request: {_format_data(nym_request_json)}')
            print('Pool handle: ', self._pool_handle)
            nym_response_json = await ledger.sign_and_submit_request(pool_handle=self._pool_handle,
                                                                     wallet_handle=self._wallet_handle,
                                                                     submitter_did=self._did,
                                                                     request_json=nym_request_json)
            self._logger.debug(f'Nym transaction response: {_format_data(nym_response_json)}')
        except IndyError as e:
            raise ServiceError('Failed to add TrustAnchor') from e

        nym_response = json.loads(nym_response_json)
        if nym_response['op'] != 'REPLY':
            return False

        self._logger.debug('Added Trust Anchor')

        return True

    async def create_schema(self, name, version, attributes):
        self._logger.info(f'Creating schema. Name: {name}. Version: {version}. '
                          f'Attribute: {attributes}')

        attributes_str = json.dumps(attributes)
        try:
            schema_id, schema_json = await anoncreds.issuer_create_schema(issuer_did=self._did,
                                                                          name=name,
                                                                          version=version,
                                                                          attrs=attributes_str)
            self._logger.debug(f'Schema id: {schema_id}. Schema json: {_format_data(schema_json)}')
        except IndyError as e:
            raise ServiceError('Failed to create schema') from e

        self._logger.info('Adding schema to the ledger')

        try:
            schema_request_json = await ledger.build_schema_request(self._did, schema_json)
            self._logger.debug(f'Schema request: {_format_data(schema_request_json)}')
            schema_response_json = await ledger.sign_and_submit_request(pool_handle=self._pool_handle,
                                                                        wallet_handle=self._wallet_handle,
                                                                        submitter_did=self._did,
                                                                        request_json=schema_request_json)
            self._logger.debug(f'Schema response: {_format_data(schema_response_json)}')
        except IndyError as e:
            raise ServiceError(f'Failed to add schema to the ledger') from e

        schema_response = json.loads(schema_response_json)
        if schema_response['op'] != 'REPLY':
            return None

        self._logger.debug('Added schema to the ledger')

        return schema_id


def _format_data(data):
    return pprint.pformat(json.loads(data))