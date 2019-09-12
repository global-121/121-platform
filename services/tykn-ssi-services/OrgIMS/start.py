import asyncio
import logging

from orgims import Service, Config


svc = None

async def setup():
    global svc
    service_logger = logging.getLogger('orgims')
    service_logger.addHandler(logging.StreamHandler())
    service_logger.setLevel(logging.DEBUG)

    with open('config.json', 'r') as f:
        config_data = f.read()

    config = Config.load(config_data)
    loop = asyncio.get_event_loop()
    svc = Service(config, service_logger, loop)

    await svc.setup()

def run():
    svc.start()


if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(setup())
    run()