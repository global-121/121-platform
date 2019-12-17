import asyncio
import logging
import logging.config
from logging.handlers import RotatingFileHandler

import loggly.handlers

from userims import Service, Config


# logging.config.fileConfig('python.conf')
logger = logging.getLogger('userims')
logger.setLevel(logging.DEBUG)

svc = None

async def setup():
    global svc

    log_formatter = logging.Formatter('%(asctime)s %(levelname)s %(funcName)s(%(lineno)d) %(message)s')
    log_file = '/var/log/userims/userims.log'
    log_file_size = 2*1024*1024*1024 # 2 GB
    file_handler = RotatingFileHandler(log_file, mode='a', maxBytes= log_file_size, backupCount=1, encoding=None, delay=0)
    file_handler.setFormatter(log_formatter)
    file_handler.setLevel(logging.INFO)

    service_logger = logging.getLogger('userims')
    service_logger.addHandler(logging.StreamHandler())
    service_logger.addHandler(file_handler)
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