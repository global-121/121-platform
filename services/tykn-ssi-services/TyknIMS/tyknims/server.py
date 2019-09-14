import json

from aiohttp import web
from aiohttp_swagger import setup_swagger

from . import ServiceError


class Server:
    def __init__(self, address, port, service, logger, loop):
        self._app = web.Application(loop=loop)
        self._app.add_routes([
            web.post("/api/trust_anchor", self._trust_anchor_post_handler),
            web.post("/api/schema", self._schema_post_handler),
        ])
        self._address = address
        self._port = port
        self._service = service
        self._logger = logger

    def start(self):
        self._logger.info(f'Starting HTTP server on {self._address}:{self._port}')
        setup_swagger(self._app)
        web.run_app(self._app,
                    host=self._address,
                    port=self._port,
                    reuse_address=True,
                    reuse_port=True)

    async def _trust_anchor_post_handler(self, request):
        """
        ---
        summary: Add trust anchor to the ledger
        description: Add trust anchor to the ledger
        produces:
        - application/json
        parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
            properties:
              did:
                type: string
              verkey:
                type: string
        responses:
          "200":
            description: if trust anchor is added successfully
          "400":
            description: if input is invalid
          "500":
            description: if indy operation fails
        """
        try:
            request_content = await request.text()
        except Exception as e:
            self._logger.error(f'Failed to get request body: {e}')
            raise web.HTTPInternalServerError from e

        self._logger.debug(f'Got request at trust_anchor endpoint. Content: {request_content}')
        try:
            request_data = json.loads(request_content)
        except ValueError as e:
            self._logger.error(f'Failed to decode request as JSON: {e}')
            # TODO - differentiate if bad json, or wrong content-type
            raise web.HTTPBadRequest

        try:
            did = request_data['did']
            verkey = request_data['verkey']
        except KeyError as e:
            self._logger.error(f'Missing request field {e}')
            raise web.HTTPBadRequest

        if not isinstance(did, str):
            raise web.HTTPBadRequest

        if not isinstance(verkey, str):
            raise web.HTTPBadRequest

        try:
            success = await self._service.create_trust_anchor(did, verkey)
        except ServiceError as e:
            self._logger.error(f'Failed to create trust anchor. Returning 500. Exception: {e}')
            raise web.HTTPInternalServerError

        if not success:
            raise web.HTTPBadRequest

        return web.Response()

    async def _schema_post_handler(self, request):
        """
        ---
        summary: Create schema on the ledger
        description: Create schema on the ledger
        produces:
        - application/json
        parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
            properties:
              name:
                type: string
              version:
                type: string
              attributes:
                type: array
                items:
                  type: string
        responses:
          "200":
            produces:
            - application/json
            name: body
            required: true
            schema:
              type: object
              properties:
                schema_id:
                  type: string
          "400":
            description: if input is invalid
          "500":
            description: if indy operation fails
        """

        try:
            request_content = await request.text()
        except Exception as e:
            self._logger.error(f'Failed to get request body: {e}')
            raise web.HTTPInternalServerError from e

        self._logger.debug(f'Got request at trust_anchor endpoint. Content: {request_content}')
        try:
            request_data = json.loads(request_content)
        except ValueError as e:
            self._logger.error(f'Failed to decode request as JSON: {e}')
            # TODO - differentiate if bad json, or wrong content-type
            raise web.HTTPBadRequest

        try:
            name = request_data['name']
            version = request_data['version']
            attributes = request_data['attributes']
        except KeyError as e:
            self._logger.error(f'Missing request field {e}')
            raise web.HTTPBadRequest

        if not isinstance(name, str):
            self._logger.error(f'Invalid name field {name}')
            raise web.HTTPBadRequest

        if not isinstance(version, str):
            self._logger.error(f'Invalid version field {version}')
            raise web.HTTPBadRequest

        if not isinstance(attributes, list) and all(isinstance(attribute, str) for attribute in attributes):
            self._logger.error(f'Invalid attributes field {attributes}')
            raise web.HTTPBadRequest

        try:
            schema_id = await self._service.create_schema(name, version, attributes)
        except ServiceError as e:
            self._logger.error(f'Failed to create schema. Returning 500. Exception: {e}')
            raise web.HTTPInternalServerError

        if not schema_id:
            raise web.HTTPBadRequest

        response = {
            'schema_id': schema_id,
        }

        return web.json_response(response)