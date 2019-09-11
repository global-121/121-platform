import json
import os
import pprint
import hashlib
from base64 import b64encode

import aiohttp

from indy import anoncreds, wallet, pool, did, ledger
from indy.error import IndyError, ErrorCode

from . import ServiceError
from .server import Server


def sha256(data):
    return hashlib.sha256(data.encode()).hexdigest()


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
        self._credential_definitions = {}

    async def setup(self):
        await self._connect_to_pool()
        wallet_path = os.path.join(self._config.wallet_path, self._config.wallet_name)
        if os.path.exists(wallet_path):
            # Fresh run every time for demo purpose
            await self._delete_wallet()
        await self._create_wallet()
        await self._open_wallet()
        await self._obtain_trust_anchor()

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
            await pool.create_pool_ledger_config('pool-config-org', pool_config_json)
        except IndyError as e:
            if e.error_code != ErrorCode.PoolLedgerConfigAlreadyExistsError:
                raise ServiceError('Failed to create pool ledger config') from e

        try:
            self._pool_handle = await pool.open_pool_ledger('pool-config-org', None)
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

    async def _obtain_trust_anchor(self):
        self._logger.debug('Assuming Trust Anchor role. Creating DID/Verkey pair')


        try:
            new_did, new_verkey = await did.create_and_store_my_did(self._wallet_handle, '{}')
        except IndyError as e:
            raise ServiceError('Failed to get DID') from e

        self._logger.debug(f'Trust Anchor DID: {new_did}. Verkey: {new_verkey}')

        self._did = new_did
        self._verkey = new_verkey

        url = f'http://{self._config.tykn_service_address}:{self._config.tykn_service_port}/api/trust_anchor'

        data = {
            'did': self._did,
            'verkey': self._verkey,
        }

        self._logger.debug(f'Calling Tykn service. URL: {url}')

        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                async with session.post(url, json=data) as resp:
                    resp.raise_for_status()
        except aiohttp.ClientError as e:
            raise ServiceError('Failed to call Tykn service') from e

        self._logger.info(f'Obtained Trust Anchor role. DID: {new_did}')

    async def create_credential_definition(self, name, schema_id):
        self._logger.info(f'Creating credential definition {name}. Schema ID: {schema_id}')
        self._logger.debug('Obtaining schema')

        try:
            get_schema_request = await ledger.build_get_schema_request(submitter_did=self._did,
                                                                       id_=schema_id)
            self._logger.debug(f'GET_SCHEMA request: {_format_data(get_schema_request)}')
            schema_response = await ledger.submit_request(pool_handle=self._pool_handle,
                                                          request_json=get_schema_request)
            self._logger.debug(f'GET_SCHEMA response: {_format_data(schema_response)}')
            retrieved_schema_id, schema_json = await ledger.parse_get_schema_response(schema_response)
            self._logger.debug(f'Schema {retrieved_schema_id}: {_format_data(schema_json)}')
        except IndyError as e:
            raise ServiceError('Failed to get schema') from e

        cred_def_config = {
            'support_revocation': False,
        }
        cred_def_config_json = json.dumps(cred_def_config)

        self._logger.debug(f'Issuing Credential Definition')

        try:
            cred_def_id, cred_def_json = await anoncreds.issuer_create_and_store_credential_def(wallet_handle=self._wallet_handle,
                                                                                                issuer_did=self._did,
                                                                                                schema_json=schema_json,
                                                                                                tag=name,
                                                                                                signature_type='CL',
                                                                                                config_json=cred_def_config_json)
            self._logger.debug(f'Credential Definition {cred_def_id}: {_format_data(cred_def_json)}')
            cred_def_request = await ledger.build_cred_def_request(self._did, cred_def_json)
            self._logger.debug(f'Credential Definition request: {_format_data(cred_def_request)}')
            cred_def_response = await ledger.sign_and_submit_request(pool_handle=self._pool_handle,
                                                                     wallet_handle=self._wallet_handle,
                                                                     submitter_did=self._did,
                                                                     request_json=cred_def_request)
            self._logger.debug(f'Credential Definition response: {_format_data(cred_def_response)}')
        except IndyError as e:
            raise ServiceError('Failed to issue and store credential definition') from e

        self._credential_definitions[name] = cred_def_id, cred_def_json
        return cred_def_id

    async def create_credential_offer(self, credential_definition_id):
        self._logger.info(f'Creating credential offer for credential definition {credential_definition_id}')

        try:
            credential_offer_json = await anoncreds.issuer_create_credential_offer(wallet_handle=self._wallet_handle,
                                                                                   cred_def_id=credential_definition_id)
            self._logger.debug(f'Credential Offer: {_format_data(credential_offer_json)}')
        except IndyError as e:
            raise ServiceError('Failed to create credential offer') from e

        return credential_offer_json

    async def issue_credential(self, credential_offer, credential_request, attributes):
        self._logger.info(f'Creating credential. Attributes: {attributes}')

        prepared_attributes = {}

        for name, value in attributes.items():
            if isinstance(value, int):
                value = str(value)
                encoded_value = value
            else:
                encoded_value = str(int.from_bytes(b64encode(name.encode()), 'big'))

            prepared_attributes[name] = {
                'raw': value,
                'encoded': encoded_value,
            }

        self._logger.debug(f'Prepared attributes: {prepared_attributes}')

        try:
            credential_json, revoc_reg_id, revoc_reg_delta_json = \
                await anoncreds.issuer_create_credential(wallet_handle=self._wallet_handle,
                                                         cred_offer_json=credential_offer,
                                                         cred_req_json=credential_request,
                                                         cred_values_json=json.dumps(prepared_attributes),
                                                         rev_reg_id=None,
                                                         blob_storage_reader_handle=None)
            self._logger.debug(f'Credential: {_format_data(credential_json)}. Revoc reg id: {revoc_reg_id}. '
                               f'Revoc reg delta: {revoc_reg_delta_json}')
        except IndyError as e:
            self._logger.error(f'Failed to issue credential with prepared attributes: {prepared_attributes}')
            raise ServiceError('Failed to issue credential') from e

        return credential_json

    async def verify_proof(self, proof_request_json, proof_json, schema_ids, credential_definition_ids):
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
                raise ServiceError('Failed to get credential definition') from e

            credential_definitions[credential_definition_id] = json.loads(cred_def_json)

        try:
            verified = await anoncreds.verifier_verify_proof(proof_request_json=proof_request_json,
                                                             proof_json=proof_json,
                                                             schemas_json=json.dumps(schemas),
                                                             credential_defs_json=json.dumps(credential_definitions),
                                                             rev_reg_defs_json=json.dumps({}),
                                                             rev_regs_json=json.dumps({}))
        except IndyError as e:
            # it seems that common invalid structure error is raise when proof is invalid. TODO - investigate
            if e.error_code in (ErrorCode.AnoncredsProofRejected, ErrorCode.CommonInvalidStructure):
                return False
            raise ServiceError('Failed to verify proof') from e

        proof = json.loads(proof_json)
        requested_proof = proof['requested_proof']
        revealed_attrs = requested_proof['revealed_attrs']
        attr_values = {}
        for revealed_attr_name, revealed_attr in revealed_attrs.items():
            attr_values[revealed_attr_name] = revealed_attr['raw']

        return attr_values

def _format_data(data):
    return pprint.pformat(json.loads(data))