import asyncio
import logging
import logging.config

import loggly.handlers

from userims import Service, Config


# logging.config.fileConfig('python.conf')
logger = logging.getLogger('svc-logger')
logger.setLevel(logging.INFO)

svc = None

async def setup():
    global svc

    with open('config.json', 'r') as f:
        config_data = f.read()

    config = Config.load(config_data)
    loop = asyncio.get_event_loop()
    svc = Service(config, logger, loop)

    await svc.setup()

def run():
    svc.start()


if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(setup())
    run()