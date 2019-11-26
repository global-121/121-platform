import json
import pprint

from indy import pool, wallet, anoncreds, did, ledger
from indy.error import IndyError, ErrorCode

from . import ServiceError, WalletAlreadyExists, WalletDoesNotExist, InvalidWalletCredentials
from .server import Server


def _get_wallet_config_and_creds(wallet_name, wallet_key, wallet_path, new_wallet_key=None):
    wallet_config = {
        'id': wallet_name,
        'storage_config': {
            'path': wallet_path,
        }
    }
    wallet_credentials = {
        'key': wallet_key,
    }
    if new_wallet_key:
        wallet_credentials['rekey'] = new_wallet_key

    return json.dumps(wallet_config), json.dumps(wallet_credentials)


class Service:
    @staticmethod
    def _wallet_name(wallet_id):
        return f'{wallet_id}-wallet'

    def __init__(self, config, logger, loop):
        self._logger = logger
        self._config = config
        self._loop = loop
        self._server = None
        self._pool_handle = None

    async def setup(self):
        await self._connect_to_pool()

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
            await pool.create_pool_ledger_config('pool-config-user', pool_config_json)
        except IndyError as e:
            if e.error_code != ErrorCode.PoolLedgerConfigAlreadyExistsError:
                raise ServiceError('Failed to create pool ledger config') from e

        try:
            self._pool_handle = await pool.open_pool_ledger('pool-config-user', None)
        except IndyError as e:
            raise ServiceError('Failed to connect to pool') from e

        self._logger.debug('Connected to pool')

    # Creates the wallet and creates master secret
    async def create_wallet(self, wallet_id, wallet_key):
        wallet_name = Service._wallet_name(wallet_id)
        self._logger.debug(f'Creating wallet {wallet_id}')

        wallet_config_json, wallet_credentials_json = \
            _get_wallet_config_and_creds(wallet_name, wallet_key, self._config.wallet_path)

        try:
            await wallet.create_wallet(wallet_config_json, wallet_credentials_json)
        except IndyError as e:
            if e.error_code == ErrorCode.WalletAlreadyExistsError:
                raise WalletAlreadyExists
            raise ServiceError('Failed to create wallet') from e

        self._logger.debug(f'Opening wallet {wallet_name} and creating master secret')

        try:
            wallet_handle = await wallet.open_wallet(wallet_config_json, wallet_credentials_json)
            await anoncreds.prover_create_master_secret(wallet_handle, 'secret')
        except IndyError as e:
            try:
                await wallet.delete_wallet(wallet_config_json, wallet_credentials_json)
            except IndyError as e:
                self._logger.error(f'Failed to cleanup wallet {wallet_name}. Exception: {e}')

            raise ServiceError('Failed to open wallet and create master secret') from e

        try:
            await wallet.close_wallet(wallet_handle)
        except IndyError as e:
            self._logger.error(f'Failed to close wallet {wallet_name}: {e}')

        self._logger.debug(f'Wallet {wallet_name} ready')

    async def rotate_wallet_key(self, wallet_id, wallet_key, wallet_new_key):
        wallet_name = Service._wallet_name(wallet_id)
        self._logger.debug(f'Rotating wallet key for {wallet_name}')

        wallet_handle = await self._open_wallet(wallet_name, wallet_key, wallet_new_key)

        try:
            await wallet.close_wallet(wallet_handle)
        except IndyError as e:
            self._logger.error(f'Failed to close wallet {wallet_name}: {e}')

        self._logger.debug(f'Rotated key for {wallet_name}')

    async def generate_did(self, wallet_id, wallet_key):
        wallet_name = Service._wallet_name(wallet_id)
        self._logger.debug(f'Generating DID for {wallet_name}')

        wallet_handle = await self._open_wallet(wallet_name, wallet_key)

        try:
            new_did, new_verkey = await did.create_and_store_my_did(wallet_handle, "{}")
        except IndyError as e:
            raise ServiceError('Failed to generate DID') from e
        finally:
            try:
                await wallet.close_wallet(wallet_handle)
            except IndyError as e:
                self._logger.error(f'Failed to close wallet {wallet_name}: {e}')

        self._logger.debug(f'Generated DID: {new_did} and Verkey: {new_verkey} in wallet {wallet_name}')

        return new_did, new_verkey

    async def create_credential_request(self, wallet_id, wallet_key, did, cred_def_id, cred_offer_json):
        wallet_name = Service._wallet_name(wallet_id)
        self._logger.debug(f'Creating credential request for {wallet_name}')

        wallet_handle = await self._open_wallet(wallet_name, wallet_key)

        self._logger.debug(f'Obtaining credential definition {cred_def_id}')

        try:
            try:
                get_cred_def_request_json = await ledger.build_get_cred_def_request(did, cred_def_id)
                self._logger.debug(f'Get Credential Definition request: {_format_data(get_cred_def_request_json)}')
                get_cred_def_response_json = await ledger.submit_request(self._pool_handle, get_cred_def_request_json)
                self._logger.debug(f'Get Credential Definition response: {_format_data(get_cred_def_response_json)}')
                _, cred_def_json = await ledger.parse_get_cred_def_response(get_cred_def_response_json)
                self._logger.debug(f'Credential Definition for id: {cred_def_id}: {_format_data(cred_def_json)}')
            except IndyError as e:
                raise ServiceError('Failed to get Credential Definition') from e

            try:
                cred_request_json, cred_request_metadata_json = \
                    await anoncreds.prover_create_credential_req(wallet_handle=wallet_handle,
                                                                 prover_did=did,
                                                                 cred_offer_json=cred_offer_json,
                                                                 cred_def_json=cred_def_json,
                                                                 master_secret_id='secret')
                self._logger.debug(f'Credential Request metadata: {_format_data(cred_request_metadata_json)}')
            except IndyError as e:
                raise ServiceError('Failed to create credential request') from e
        finally:
            try:
                await wallet.close_wallet(wallet_handle)
            except IndyError as e:
                self._logger.error(f'Failed to close wallet {wallet_name}: {e}')

        return cred_request_json, cred_request_metadata_json

    async def store_credential(self, wallet_id, wallet_key, cred_def_id, cred_request_json, cred_json):
        wallet_name = Service._wallet_name(wallet_id)
        self._logger.debug(f'Storing credential in {wallet_name}')

        wallet_handle = await self._open_wallet(wallet_name, wallet_key)

        try:
            try:
                get_cred_def_request_json = await ledger.build_get_cred_def_request(None, cred_def_id)
                get_cred_def_response_json = await ledger.submit_request(self._pool_handle, get_cred_def_request_json)
                _, cred_def_json = await ledger.parse_get_cred_def_response(get_cred_def_response_json)
            except IndyError as e:
                raise ServiceError('Failed to get Credential Definition') from e

            try:
                await anoncreds.prover_store_credential(wallet_handle=wallet_handle,
                                                        cred_id=None,
                                                        cred_req_metadata_json=cred_request_json,
                                                        cred_def_json=cred_def_json,
                                                        cred_json=cred_json,
                                                        rev_reg_def_json=None)
            except IndyError as e:
                raise ServiceError('Failed to store credential') from e
        finally:
            try:
                await wallet.close_wallet(wallet_handle)
            except IndyError as e:
                self._logger.error(f'Failed to close wallet {wallet_name}: {e}')

        self._logger.info(f'Stored credential in {wallet_name}')

    async def create_proof(self, wallet_id, wallet_key, proof_request):
        wallet_name = Service._wallet_name(wallet_id)
        self._logger.debug(f'Creating proof from {wallet_name}')

        wallet_handle = await self._open_wallet(wallet_name, wallet_key)

        try:
            res = await self._create_proof(wallet_handle, proof_request)
        finally:
            try:
                await wallet.close_wallet(wallet_handle)
            except IndyError as e:
                self._logger.error(f'Failed to close wallet {wallet_name}: {e}')

        self._logger.debug(f'Created proof from {wallet_name}')

        return res

    async def _create_proof(self, wallet_handle, proof_request):
        proof_request_json = json.dumps(proof_request)

        try:
            credentials_for_proof_request_json = await anoncreds.prover_get_credentials_for_proof_req(wallet_handle,
                                                                                                      proof_request_json)
            self._logger.info(f'Credentials for proof request: {_format_data(credentials_for_proof_request_json)}')
            credentials_for_proof_request = json.loads(credentials_for_proof_request_json)
        except IndyError as e:
            raise ServiceError('Failed to get credentials for proof request') from e

        # No revocation support

        options_for_attributes = credentials_for_proof_request['attrs']
        options_for_predicates = credentials_for_proof_request['predicates']

        requested_attributes = proof_request['requested_attributes']
        requested_predicates = proof_request['requested_predicates']

        credential_attribute_referents = {}
        schema_ids = []
        credential_definition_ids = []
        for attr_name in requested_attributes:
            cred_options = options_for_attributes[attr_name]
            if not cred_options:
                return None

            cred = cred_options[0]['cred_info']
            referent = cred['referent']
            schema_id = cred['schema_id']
            schema_ids.append(schema_id)
            credential_definition_id = cred['cred_def_id']
            credential_definition_ids.append(credential_definition_id)
            credential_attribute_referents[attr_name] = {
                'cred_id': referent,
                'revealed': True,
            }

        credential_predicate_referents = {}
        for pred_name in requested_predicates:
            cred_options = options_for_predicates[pred_name]
            if not cred_options:
                return None

            cred = cred_options[0]['cred_info']
            referent = cred['referent']
            schema_id = cred['schema_id']
            schema_ids.append(schema_id)
            credential_definition_id = cred['cred_def_id']
            credential_definition_ids.append(credential_definition_id)
            credential_predicate_referents[pred_name] = {
                'cred_id': referent,
            }

        credentials = {
            'self_attested_attributes': {},
            'requested_attributes': credential_attribute_referents,
            'requested_predicates': credential_predicate_referents,
        }

        schemas = {}

        for schema_id in schema_ids:
            try:
                schema_request_json = await ledger.build_get_schema_request(None, schema_id)
                schema_response_json = await ledger.submit_request(self._pool_handle, schema_request_json)
                _, schema_json = await ledger.parse_get_schema_response(schema_response_json)
            except IndyError as e:
                raise ServiceError('Failed to get schema') from e

            schemas[schema_id] = json.loads(schema_json)

        credential_definitions = {}

        for credential_definition_id in credential_definition_ids:
            try:
                cred_def_request_json = await ledger.build_get_cred_def_request(None, credential_definition_id)
                cred_def_response_json = await ledger.submit_request(self._pool_handle, cred_def_request_json)
                _, cred_def_json = await ledger.parse_get_cred_def_response(cred_def_response_json)
            except IndyError as e:
                raise ServiceError(f'Failed to get credential definition for ID {credential_definition_id}') from e

            credential_definitions[credential_definition_id] = json.loads(cred_def_json)

        try:
            proof = await anoncreds.prover_create_proof(wallet_handle=wallet_handle,
                                                        proof_req_json=proof_request_json,
                                                        requested_credentials_json=json.dumps(credentials),
                                                        master_secret_name='secret',
                                                        schemas_json=json.dumps(schemas),
                                                        credential_defs_json=json.dumps(credential_definitions),
                                                        rev_states_json=json.dumps({}))
        except IndyError as e:
            raise ServiceError('Failed to create proof') from e

        proof_with_meta = {
            'proof': proof,
            'schemas': schema_ids,
            'credential_definitions': credential_definition_ids,
        }

        return proof_with_meta

    async def _open_wallet(self, wallet_name, wallet_key, new_wallet_key=None):
        wallet_config_json, wallet_creds_json = \
            _get_wallet_config_and_creds(wallet_name, wallet_key, self._config.wallet_path, new_wallet_key)

        try:
           wallet_handle = await wallet.open_wallet(wallet_config_json, wallet_creds_json)
        except IndyError as e:
            if e.error_code == ErrorCode.WalletNotFoundError:
                raise WalletDoesNotExist
            elif e.error_code == ErrorCode.WalletAccessFailed:
                raise InvalidWalletCredentials
            raise ServiceError('Failed to open wallet') from e

        return wallet_handle
    async def backup_wallet(self, backup_file_storage_path,wallet_id, wallet_key):
        try:
            wallet_export_config = {
            "path": backup_file_storage_path,
            "key" : wallet_key
            }
            wallet_name = Service._wallet_name(wallet_id)
            self._logger.debug(f'Creating backup with config >>>')
            self._logger.debug(json.dumps(wallet_export_config))

            wallet_handle = await self._open_wallet(wallet_name, wallet_key)
            await wallet.export_wallet(wallet_handle,json.dumps(wallet_export_config))
            self._logger.debug(f'Wallet backup created at {backup_file_storage_path}')
            return True
        except IndyError as e:
            self._logger.error(f'Failed to create backup of the wallet with config: {wallet_export_config}')
            raise ServiceError('Failed to create backup of wallet') from e
        finally:
            try:
                await wallet.close_wallet(wallet_handle)
            except IndyError as e:
                self._logger.error(f'Failed to close wallet {wallet_name}: {e}')
        return False

    async def restore_wallet(self, wallet_id, old_wallet_key, new_wallet_key, backup_file_storage_path):
        wallet_import_config = {
        'path': backup_file_storage_path,
        'key' : old_wallet_key
        }
        wallet_name = Service._wallet_name(wallet_id)
        wallet_config_json, wallet_credentials_json = \
            _get_wallet_config_and_creds(wallet_name, new_wallet_key, self._config.wallet_path)
        self._logger.debug(f'creating new wallet with config >>>')
        self._logger.debug(wallet_config_json)
        self._logger.debug(f'Restoring backup with config >>>')
        self._logger.debug(json.dumps(wallet_import_config))
        try:
            await wallet.import_wallet(
                wallet_config_json,
                wallet_credentials_json, 
                json.dumps(wallet_import_config)
                )
            self._logger.debug(f'Wallet restored successfully!')
            return True
        except IndyError as e:
            self._logger.error(f'Failed to retore wallet from backup with config: {wallet_import_config}')
            raise ServiceError('Failed to restore wallet from backup') from e
        return False
    
    async def delete_wallet(self, wallet_id, wallet_key):
        wallet_name = Service._wallet_name(wallet_id)
        wallet_config_json, wallet_credentials_json = \
            _get_wallet_config_and_creds(wallet_name, wallet_key, self._config.wallet_path)
            
        try:
            await wallet.delete_wallet(
                wallet_config_json,
                wallet_credentials_json
                )
            self._logger.debug(f'Wallet deleted successfully!')
            return True
        except IndyError as e:
            raise ServiceError('Failed to delete wallet') from e
        return False

def _format_data(data):
    return pprint.pformat(json.loads(data))