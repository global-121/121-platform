from setuptools import setup

setup(
    name='userims',
    version='0.01',
    packages=['userims'],
    install_requires=[
        'python3-indy==1.6.7',
        'aiohttp',
        'aiohttp-swagger',
        'aiohttp-cors',
        'loggly-python-handler'
    ],
    url='',
    license='',
    author='Tykn',
    author_email='hello@tykn.tech',
    description=''
)
