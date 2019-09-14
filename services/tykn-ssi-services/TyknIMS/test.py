import asyncio
import logging
import pprint
import json
import requests

from indy import wallet, did, pool, ledger

from tims import Service, Config

logging.getLogger().setLevel(logging.DEBUG)

async def setup_pool(genesis_txn_path):
    await pool.set_protocol_version(2)
    try:
        await pool.delete_pool_ledger_config('client-pool')
    except:
        pass

    await pool.create_pool_ledger_config('client-pool', json.dumps({'genesis_txn': genesis_txn_path}))
    return await pool.open_pool_ledger('client-pool', None)


async def setup_wallet():
    wallet_config = {
        'id': 'client-wallet',
    }
    wallet_credentials = {
        'key': 'some_key',
    }
    wallet_config_json = json.dumps(wallet_config)
    wallet_credentials_json = json.dumps(wallet_credentials)

    try:
        await wallet.create_wallet(wallet_config_json, wallet_credentials_json)
    except:
        await wallet.delete_wallet(wallet_config_json, wallet_credentials_json)
        await wallet.create_wallet(wallet_config_json, wallet_credentials_json)

    return await wallet.open_wallet(wallet_config_json, wallet_credentials_json)


async def create_trust_anchor_did_verkey(wallet_handle):
    new_did, new_verkey = await did.create_and_store_my_did(wallet_handle, '{}')

    return new_did, new_verkey


def register_trust_anchor_did_verkey(host, port, did, verkey):
    data = {
        'did': did,
        'verkey': verkey,
    }
    resp = requests.post(f'http://{host}:{port}/trust_anchor', json=data)
    resp.raise_for_status()


async def get_verkey_from_ledger(pool_handle, target_did):
    get_nym_req = await ledger.build_get_nym_request(target_did, target_did)
    get_nym_resp = await ledger.submit_request(pool_handle, get_nym_req)
    return json.loads(get_nym_resp)


def create_schema(host, port, name, version, attributes):
    data = {
        'name': name,
        'version': version,
        'attributes': attributes,
    }
    resp = requests.post(f'http://{host}:{port}/schema', json=data)
    resp.raise_for_status()
    resp_json = resp.json()
    return resp_json['schema_id']


async def get_schema_from_ledger(pool_handle, schema_id):
    get_schema_request = await ledger.build_get_schema_request(None, schema_id)
    get_schema_response = await ledger.submit_request(pool_handle, get_schema_request)
    assert json.loads(get_schema_response)['result']['data'] is not None


async def main():
    service_logger = logging.getLogger('tyknims')
    service_logger.addHandler(logging.StreamHandler())
    service_logger.setLevel(logging.DEBUG)

    with open('config.json', 'r') as f:
        config_data = f.read()

    config = Config.load(config_data)

    pool_handle = await setup_pool('/src/indy-sdk/cli/docker_pool_transactions_genesis')
    wallet_handle = await setup_wallet()

    trust_anchor_did, trust_anchor_verkey = await create_trust_anchor_did_verkey(wallet_handle)

    resp1 = await get_verkey_from_ledger(pool_handle, trust_anchor_did)
    assert resp1['result']['data'] is None

    register_trust_anchor_did_verkey(config.address, config.port, trust_anchor_did, trust_anchor_verkey)

    resp2 = await get_verkey_from_ledger(pool_handle, trust_anchor_did)
    assert resp2['result']['data'] is not None

    schema_id = create_schema(config.address, config.port, 'test-schema', '0.2', ['name', 'surname', 'sex'])

    await get_schema_from_ledger(pool_handle, schema_id)

def _format_data(data):
    return pprint.pformat(json.loads(data))


if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())