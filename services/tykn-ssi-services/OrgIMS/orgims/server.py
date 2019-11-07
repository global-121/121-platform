import json
import traceback

from aiohttp import web
from aiohttp_swagger import *

from . import ServiceError


class Server:
    def __init__(self, address, port, service, logger, loop, walletPath):
        self._app = web.Application(loop=loop)
        self._app.add_routes([
            web.post("/api/credential/definition", self._credential_definition_post_handler),
            web.post("/api/credential/credoffer", self._credential_offer_post_handler),
            web.post("/api/credential/issue", self._credential_issuance_post_handler),
            web.post("/api/proof/verify", self._verify_proof_handler),
            web.post("/api/wallet/backup", self._backup_wallet),
            web.post("/api/wallet/restore", self._restore_wallet),
        ])
        self._address = address
        self._port = port
        self._service = service
        self._logger = logger
        self._loop = loop
        self._walletPath = walletPath

    def start(self):
        self._logger.info(f'Starting HTTP server on {self._address}:{self._port}')
        setup_swagger(self._app)
        web.run_app(self._app,
                    host=self._address,
                    port=self._port,
                    reuse_address=True,
                    reuse_port=True)

    async def _credential_definition_post_handler(self, request):
        """
        ---
        summary: Create credential definition
        description: Create credential definition
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
              schema_id:
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
                credential_definition_id:
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

        self._logger.debug(f'Got request at credential_definition endpoint. Content: {request_content}')
        try:
            request_data = json.loads(request_content)
        except ValueError as e:
            self._logger.error(f'Failed to decode request as JSON: {e}')
            # TODO - differentiate if bad json, or wrong content-type
            raise web.HTTPBadRequest

        try:
            name = request_data['name']
            schema_id = request_data['schema_id']
        except KeyError as e:
            self._logger.error(f'Missing request field {e}')
            raise web.HTTPBadRequest

        if not isinstance(name, str):
            raise web.HTTPBadRequest

        if not isinstance(schema_id, str):
            raise web.HTTPBadRequest

        try:
            cred_def_id = await self._service.create_credential_definition(name, schema_id)
        except ServiceError as e:
            self._logger.error(f'Failed to create credential definition. Returning 500. Exception: {traceback.format_exc()}')
            raise web.HTTPInternalServerError

        if not cred_def_id:
            raise web.HTTPBadRequest

        response = {
            'credential_definition_id': cred_def_id,
        }

        return web.json_response(response)

    async def _credential_offer_post_handler(self, request):
        """
        ---
        summary: Create credential offer
        description: Create credential offer
        produces:
        - application/json
        parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
            properties:
              credDefID:
                type: string
              correlation:
                type: object
                properties:
                  correlationID:
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
                credOfferJsonData:
                  type: string
                correlation:
                  type: object
                  properties:
                    correlationID:
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

        self._logger.debug(f'Got request at credential_offer endpoint. Content: {request_content}')
        try:
            request_data = json.loads(request_content)
        except ValueError as e:
            self._logger.error(f'Failed to decode request as JSON: {e}')
            # TODO - differentiate if bad json, or wrong content-type
            raise web.HTTPBadRequest

        try:
            credential_definition_id = request_data['credDefID']
            correlation = request_data['correlation']
            correlation_id = correlation['correlationID']
        except KeyError as e:
            self._logger.error(f'Missing request field {e}')
            raise web.HTTPBadRequest

        if not isinstance(credential_definition_id, str):
            raise web.HTTPBadRequest

        try:
            credential_offer = await self._service.create_credential_offer(credential_definition_id)
        except ServiceError as e:
            self._logger.error(f'Failed to create credential offer. Returning 500. Exception: {traceback.format_exc()}')
            raise web.HTTPInternalServerError

        self._logger.debug(f'Created credential offer. Correlation ID: {correlation_id}')

        # This naming was requested
        response = {
            'credOfferJsonData': credential_offer,
            'correlation': correlation,
        }

        return web.json_response(response)

    async def _credential_issuance_post_handler(self, request):
        """
        ---
        summary: Create credential
        description: Create credential
        produces:
        - application/json
        parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
            properties:
              credOfferJsonData:
                type: string
              credentialRequest:
                type: string
              correlation:
                type: object
                properties:
                  correlationID:
                    type: string
              attributes:
                type: object
        responses:
          "200":
            produces:
            - application/json
            name: body
            required: true
            schema:
              type: object
              properties:
                credential:
                  type: string
                correlation:
                  type: object
                  properties:
                    correlationID:
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

        self._logger.debug(f'Got request at credential_issuance endpoint. Content: {request_content}')
        try:
            request_data = json.loads(request_content)
        except ValueError as e:
            self._logger.error(f'Failed to decode request as JSON: {e}')
            # TODO - differentiate if bad json, or wrong content-type
            raise web.HTTPBadRequest

        try:
            credential_offer = request_data['credOfferJsonData']
            credential_request = request_data['credentialRequest']
            attributes = request_data['attributes']

            correlation = request_data['correlation']
            correlation_id = correlation['correlationID']
        except KeyError as e:
            self._logger.error(f'Missing request field {e}')
            raise web.HTTPBadRequest

        if not isinstance(credential_offer, str):
            raise web.HTTPBadRequest

        if not isinstance(credential_request, str):
            raise web.HTTPBadRequest

        if not isinstance(attributes, dict):
            raise web.HTTPBadRequest

        for key, value in attributes.items():
            if not isinstance(value, (int, str)):
                raise web.HTTPBadRequest

        try:
            credential = await self._service.issue_credential(credential_offer, credential_request, attributes)
        except ServiceError as e:
            self._logger.error(f'Failed to issue credential. Returning 500. Exception: {traceback.format_exc()}')
            raise web.HTTPInternalServerError

        self._logger.debug(f'Issued credential. Correlation ID: {correlation_id}')

        response = {
            'credential': credential,
            'correlation': correlation,
        }

        return web.json_response(response)

    async def _verify_proof_handler(self, request):
        """
        ---
        summary: Verifying proof
        description: Verifying proof
        produces:
        - application/json
        parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
            properties:
              proofRequestJsonData:
                type: string
              proof:
                type: string
              correlation:
                type: object
                properties:
                  correlationID:
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
                attributes:
                  type: dict
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

        self._logger.debug(f'Got request at proof verification endpoint. Content: {request_content}')
        try:
            request_data = json.loads(request_content)
        except ValueError as e:
            self._logger.error(f'Failed to decode request as JSON: {e}')
            # TODO - differentiate if bad json, or wrong content-type
            raise web.HTTPBadRequest

        try:
            proof = json.loads(request_data['proof'])
            core_proof = proof['proof']
            proof_schemas = proof['schemas']
            proof_cred_defs = proof['credential_definitions']
            proof_request = request_data['proofRequestJsonData']
        except KeyError as e:
            self._logger.error(f'Missing request field {e}')
            raise web.HTTPBadRequest

        if not isinstance(proof_request, str):
            raise web.HTTPBadRequest

        if not isinstance(core_proof, str):
            raise web.HTTPBadRequest

        if not isinstance(proof_schemas, list):
            raise web.HTTPBadRequest

        for item in proof_schemas:
            if not isinstance(item, str):
                raise web.HTTPBadRequest

        if not isinstance(proof_cred_defs, list):
            raise web.HTTPBadRequest

        for item in proof_cred_defs:
            if not isinstance(item, str):
                raise web.HTTPBadRequest

        try:
            attributes = await self._service.verify_proof(proof_request, core_proof, proof_schemas, proof_cred_defs)
        except ServiceError as e:
            self._logger.error(f'Failed to verify proof. Returning 500. Exception: {traceback.format_exc()}')
            raise web.HTTPInternalServerError

        response = {
            'attributes': attributes,
        }

        return web.json_response(response)

    async def _backup_wallet(self, request):
      """
        ---
        summary: Create wallet backup
        description: Backs up the wallet to a specified location
        produces:
        - application/json
        parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
            properties:
              backupFileStoragePath:
                type: string
              walletKey:
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
                operation_result:
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

      self._logger.debug(f'Got request to create wallet backup. Content: {request_content}')
      try:
          request_data = json.loads(request_content)
      except ValueError as e:
          self._logger.error(f'Failed to decode request as JSON: {e}')
          # TODO - differentiate if bad json, or wrong content-type
          raise web.HTTPBadRequest

      try:
          # backup_request = json.loads(request_data['backup-wallet'])
          backup_file_storage_path = request_data['backupFileStoragePath']
          wallet_key = request_data['walletKey']
      except KeyError as e:
          self._logger.error(f'Missing request field {e}')
          raise web.HTTPBadRequest

      if not isinstance(backup_file_storage_path, str):
            raise web.HTTPBadRequest

      if not isinstance(wallet_key, str):
            raise web.HTTPBadRequest

      try:
            operation_result = await self._service.backup_wallet(backup_file_storage_path, wallet_key)
      except ServiceError as e:
            self._logger.error(f'Failed to craete backup. Returning 500. Exception: {traceback.format_exc()}')
            raise web.HTTPInternalServerError


      response = {
            'message': operation_result,
        }

      return web.json_response(response)
    
    async def _restore_wallet(self, request):
      """
        ---
        summary: Restore wallet from backup
        description: Restore wallet from the backup file
        produces:
        - application/json
        parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
            properties:
              walletName:
                type: string
              walletKey:
                type: string
              backupFileStoragePath:
                type: string
              walletPath:
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
                operation_result:
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

      self._logger.debug(f'Got request to create wallet backup. Content: {request_content}')
      try:
          request_data = json.loads(request_content)
      except ValueError as e:
          self._logger.error(f'Failed to decode request as JSON: {e}')
          # TODO - differentiate if bad json, or wrong content-type
          raise web.HTTPBadRequest

      try:
          wallet_name = request_data['walletName']
          wallet_key = request_data['walletKey']
          backup_file_storage_path = request_data['backupFileStoragePath']
          wallet_path = request_data['walletPath']
      except KeyError as e:
          self._logger.error(f'Missing request field {e}')
          raise web.HTTPBadRequest

      if not isinstance(backup_file_storage_path, str):
            raise web.HTTPBadRequest

      if not isinstance(wallet_key, str):
            raise web.HTTPBadRequest

      if not isinstance(wallet_name, str):
            raise web.HTTPBadRequest

      if not isinstance(wallet_path, str):
            raise web.HTTPBadRequest

      if wallet_path is "":
            wallet_path = self._walletPath
            
      try:
            operation_result = await self._service.restore_wallet(
              wallet_name,
              wallet_key,
              backup_file_storage_path,
              wallet_path)

      except ServiceError as e:
            self._logger.error(f'Failed to craete backup. Returning 500. Exception: {traceback.format_exc()}')
            raise web.HTTPInternalServerError


      response = {
            'message': operation_result,
        }

      return web.json_response(response)
    