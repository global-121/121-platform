import json
import traceback

from aiohttp import web
from aiohttp_swagger import *
import aiohttp_cors

from . import WalletAlreadyExists, WalletDoesNotExist, ServiceError, InvalidWalletCredentials


class Server:
    def __init__(self, address, port, service, logger, loop):
        self._app = web.Application(loop=loop)
        # these URLs were specifically requested
        self._app.add_routes([
            web.post('/api/wallet', self._wallet_post_handler),
            web.post('/api/wallet_key_rotation', self._wallet_key_rotation_handler),
            web.post("/api/wallet/backup", self._backup_wallet),
            web.post("/api/wallet/restore", self._restore_wallet),
            web.post('/api/did', self._did_handler),
            web.post('/api/credential/credreq', self._credential_request_handler),
            web.post('/api/credential/store', self._credential_handler),
            web.post('/api/proof/request', self._proof_handler),
        ])
        self._address = address
        self._port = port
        self._service = service
        self._logger = logger

        # Add CORS
        cors = aiohttp_cors.setup(self._app, defaults={
          "*": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
          )
        })
        for route in list(self._app.router.routes()):
          cors.add(route)

    def start(self):
        # self._logger.info(f'Starting HTTP server on {self._address}:{self._port}')
        setup_swagger(self._app)
        web.run_app(self._app,
                    host=self._address,
                    port=self._port,
                    reuse_address=True,
                    reuse_port=True)

    async def _wallet_post_handler(self, request):
        """
        ---
        summary: Create user wallet
        description: Create user wallet
        produces:
        - application/json
        parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
            properties:
              wallet:
                type: object
                properties:
                  id:
                    type: string
                  passKey:
                    type: string
              correlation:
                type: object
                properties:
                  correlationID:
                    type: string
        responses:
          "200":
            description: if wallet is created successfully
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

        self._logger.debug(f'Got request at /api/wallet endpoint. Content: {request_content}')

        try:
            request_data = json.loads(request_content)
        except ValueError as e:
            self._logger.error(f'Failed to decode request as JSON: {e}')
            raise web.HTTPBadRequest

        try:
            wallet = request_data['wallet']
            wallet_id = wallet['id']
            wallet_key = wallet['passKey']
            correlation = request_data['correlation']
            correlation_id = correlation['correlationID']
        except KeyError as e:
            self._logger.error(f'Missing request field {e}')
            raise web.HTTPBadRequest

        if not isinstance(wallet_id, str):
            raise web.HTTPBadRequest

        if not isinstance(wallet_key, str):
            raise web.HTTPBadRequest

        try:
            await self._service.create_wallet(wallet_id, wallet_key)
        except WalletAlreadyExists:
            self._logger.error(f'Wallet already exists. Returning Bad Request')
            raise web.HTTPBadRequest
        except ServiceError as e:
            self._logger.error(f'Failed to create wallet. Returning 500. Exception: {traceback.format_exc()}')
            raise web.HTTPInternalServerError

        self._logger.debug(f'Created wallet. Correlation ID: {correlation_id}')

        return web.Response()

    async def _wallet_key_rotation_handler(self, request):
        """
        ---
        summary: Rotating wallet keys
        description: Rotating wallet keys
        produces:
        - application/json
        parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
            properties:
              wallet:
                type: object
                properties:
                  id:
                    type: string
                  passKey:
                    type: string
                  newPassKey:
                    type: string
              correlation:
                type: object
                properties:
                  correlationID:
                    type: string
        responses:
          "200":
            description: if keys are rotated successfully
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

        self._logger.debug(f'Got request at /api/wallet_key_rotation endpoint. Content: {request_content}')

        try:
            request_data = json.loads(request_content)
        except ValueError as e:
            self._logger.error(f'Failed to decode request as JSON: {e}')
            raise web.HTTPBadRequest

        try:
            wallet = request_data['wallet']
            wallet_id = wallet['id']
            wallet_key = wallet['passKey']
            wallet_new_key = wallet['newPassKey']
            correlation = request_data['correlation']
            correlation_id = correlation['correlationID']
        except KeyError as e:
            self._logger.error(f'Missing request field {e}')
            raise web.HTTPBadRequest

        if not isinstance(wallet_id, str):
            raise web.HTTPBadRequest

        if not isinstance(wallet_key, str):
            raise web.HTTPBadRequest

        if not isinstance(wallet_new_key, str):
            raise web.HTTPBadRequest

        try:
            await self._service.rotate_wallet_key(wallet_id, wallet_key, wallet_new_key)
        except WalletDoesNotExist:
            self._logger.error(f'Wallet does not exist. Returning 400')
            raise web.HTTPBadRequest
        except InvalidWalletCredentials:
            self._logger.error(f'Invalid wallet credentials. Returning 400')
            raise web.HTTPBadRequest
        except ServiceError as e:
            self._logger.error(f'Failed to create wallet. Returning 500. Exception: {traceback.format_exc()}')
            raise web.HTTPInternalServerError

        self._logger.debug(f'Rotated keys. Correlation ID: {correlation_id}')

        return web.Response()

    async def _did_handler(self, request):
        """
        ---
        summary: Create DID in user wallet
        description: Create DID in user wallet
        produces:
        - application/json
        parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
            properties:
              wallet:
                type: object
                properties:
                  id:
                    type: string
                  passKey:
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
                did:
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

        self._logger.debug(f'Got request at /api/did endpoint. Content: {request_content}')

        try:
            request_data = json.loads(request_content)
        except ValueError as e:
            self._logger.error(f'Failed to decode request as JSON: {e}')
            raise web.HTTPBadRequest

        try:
            wallet = request_data['wallet']
            wallet_id = wallet['id']
            wallet_key = wallet['passKey']
            correlation = request_data['correlation']
            correlation_id = correlation['correlationID']
        except KeyError as e:
            self._logger.error(f'Missing request field {e}')
            raise web.HTTPBadRequest

        if not isinstance(wallet_id, str):
            raise web.HTTPBadRequest

        if not isinstance(wallet_key, str):
            raise web.HTTPBadRequest

        try:
            did, _ = await self._service.generate_did(wallet_id, wallet_key)
        except WalletDoesNotExist:
            self._logger.error(f'Wallet does not exist. Returning 400')
            raise web.HTTPBadRequest
        except InvalidWalletCredentials:
            self._logger.error(f'Invalid wallet credentials. Returning 400')
            raise web.HTTPBadRequest
        except ServiceError as e:
            self._logger.error(f'Failed to generated DID. Returning 500. Exception: {traceback.format_exc()}')
            raise web.HTTPInternalServerError

        self._logger.debug(f'Created DID. Correlation ID: {correlation_id}')

        response = {
            'did': did,
            'correlation': correlation,
        }

        return web.json_response(response)

    async def _credential_request_handler(self, request):
        """
        ---
        summary: Create credential request from user's wallet
        description: Create credential request from user's wallet
        produces:
        - application/json
        parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
            properties:
              wallet:
                type: object
                properties:
                  id:
                    type: string
                  passKey:
                    type: string
              correlation:
                type: object
                properties:
                  correlationID:
                    type: string
              credDefID:
                type: string
              credentialOffer:
                type: string
              did:
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
                credentialRequest:
                  type: string
                credentialRequestMetadata:
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

        self._logger.debug(f'Got request at /api/credential_request endpoint. Content: {request_content}')

        try:
            request_data = json.loads(request_content)
        except ValueError as e:
            self._logger.error(f'Failed to decode request as JSON: {e}')
            raise web.HTTPBadRequest

        try:
            wallet = request_data['wallet']
            wallet_id = wallet['id']
            wallet_key = wallet['passKey']
            did = request_data['did']
            # Cred offer is a string as it is returned by wallet on org service
            # it is not an object
            cred_def_id = request_data['credDefID']
            cred_offer_json = request_data['credentialOffer']
            correlation = request_data['correlation']
            correlation_id = correlation['correlationID']
        except KeyError as e:
            self._logger.error(f'Missing request field {e}')
            raise web.HTTPBadRequest

        if not isinstance(wallet_id, str):
            raise web.HTTPBadRequest

        if not isinstance(wallet_key, str):
            raise web.HTTPBadRequest

        if not isinstance(did, str):
            raise web.HTTPBadRequest

        if not isinstance(cred_def_id, str):
            raise web.HTTPBadRequest

        if not isinstance(cred_offer_json, str):
            raise web.HTTPBadRequest

        try:
            credential_request_json, credential_request_metadata_json = \
                await self._service.create_credential_request(wallet_id, wallet_key, did, cred_def_id, cred_offer_json)
        except WalletDoesNotExist:
            self._logger.error(f'Wallet does not exist. Returning 400')
            raise web.HTTPBadRequest
        except InvalidWalletCredentials:
            self._logger.error(f'Invalid wallet credentials. Returning 400')
            raise web.HTTPBadRequest
        except ServiceError as e:
            self._logger.error(f'Failed to create credential request. Returning 500. Exception: {traceback.format_exc()}')
            raise web.HTTPInternalServerError

        self._logger.debug(f'Created credential request. Correlation ID: {correlation_id}')

        # TODO - rename this after Mostafa responds
        response = {
            'credentialRequest': credential_request_json,
            'credentialRequestMetadata': credential_request_metadata_json,
            'correlation': correlation,
        }

        return web.json_response(response)

    async def _credential_handler(self, request):
        """
        ---
        summary: Store credential in user's wallet
        description: Create credential in user's wallet
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
              credentialRequestMetadata:
                type: string
              credential:
                type: string
              wallet:
                type: object
                properties:
                  id:
                    type: string
                  passKey:
                    type: string
              correlation:
                type: object
                properties:
                  correlationID:
                    type: string
        responses:
          "200":
            description: if credential is sucessfully stored
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

        self._logger.debug(f'Got request at /api/credential endpoint. Content: {request_content}')

        try:
            request_data = json.loads(request_content)
        except ValueError as e:
            self._logger.error(f'Failed to decode request as JSON: {e}')
            raise web.HTTPBadRequest

        try:
            wallet = request_data['wallet']
            wallet_id = wallet['id']
            wallet_key = wallet['passKey']
            cred_def_id = request_data['credDefID']
            # passed as JSON string
            credential_request_json = request_data['credentialRequestMetadata']
            credential_json = request_data['credential']
            correlation = request_data['correlation']
            correlation_id = correlation['correlationID']
        except KeyError as e:
            self._logger.error(f'Missing request field {e}')
            raise web.HTTPBadRequest

        if not isinstance(wallet_id, str):
            raise web.HTTPBadRequest

        if not isinstance(wallet_key, str):
            raise web.HTTPBadRequest

        if not isinstance(cred_def_id, str):
            raise web.HTTPBadRequest

        if not isinstance(credential_request_json, str):
            raise web.HTTPBadRequest

        if not isinstance(credential_json, str):
            raise web.HTTPBadRequest

        try:
            await self._service.store_credential(wallet_id, wallet_key, cred_def_id, credential_request_json, credential_json)
        except WalletDoesNotExist:
            self._logger.error(f'Wallet does not exist. Returning 400')
            raise web.HTTPBadRequest
        except InvalidWalletCredentials:
            self._logger.error(f'Invalid wallet credentials. Returning 400')
            raise web.HTTPBadRequest
        except ServiceError as e:
            self._logger.error(f'Failed to stored credential. Returning 500. Exception: {traceback.format_exc()}')
            raise web.HTTPInternalServerError

        self._logger.debug(f'Stored credential. Correlation ID: {correlation_id}')

        return web.Response()

    async def _proof_handler(self, request):
        """
        ---
        summary: Create proof from user's wallet
        description: Create proof from user's wallet
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
              wallet:
                type: object
                properties:
                  id:
                    type: string
                  passKey:
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
                proofRequestJsonData:
                  type: string
                proof:
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

        self._logger.debug(f'Got request at /api/proof endpoint. Content: {request_content}')

        try:
            request_data = json.loads(request_content)
        except ValueError as e:
            self._logger.error(f'Failed to decode request as JSON: {e}')
            raise web.HTTPBadRequest

        try:
            wallet = request_data['wallet']
            wallet_id = wallet['id']
            wallet_key = wallet['passKey']
            proof_request_json = request_data['proofRequestJsonData']
            correlation = request_data['correlation']
            correlation_id = correlation['correlationID']
        except KeyError as e:
            self._logger.error(f'Missing request field {e}')
            raise web.HTTPBadRequest

        if not isinstance(wallet_id, str):
            self._logger.error(f'Invalid wallet id field {wallet_id}')
            raise web.HTTPBadRequest

        if not isinstance(wallet_key, str):
            self._logger.error(f'Invalid wallet key field {wallet_key}')
            raise web.HTTPBadRequest

        if not isinstance(proof_request_json, str):
            self._logger.error(f'Invalid proof request field {proof_request_json}')
            raise web.HTTPBadRequest

        try:
            proof_request = json.loads(proof_request_json)
        except ValueError as e:
            self._logger.error(f'Bad proof request: {e}')
            raise web.HTTPBadRequest

        try:
            proof = await self._service.create_proof(wallet_id, wallet_key, proof_request)
        except WalletDoesNotExist:
            self._logger.error(f'Wallet does not exist. Returning 400')
            raise web.HTTPBadRequest
        except InvalidWalletCredentials:
            self._logger.error(f'Invalid wallet credentials. Returning 400')
            raise web.HTTPBadRequest
        except ServiceError:
            self._logger.error(f'Failed to create proof. Returning 500. Exception: {traceback.format_exc()}')
            raise web.HTTPInternalServerError

        self._logger.debug(f'Created proof. Correlation ID: {correlation_id}')

        # This was specifically requested
        response = {
            'proof': json.dumps(proof),
            'proofRequestJsonData': proof_request_json,
            'correlation': correlation,
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
              wallet:
                type: object
                properties:
                  id:
                    type: string
                  passKey:
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
          wallet = request_data['wallet']
          wallet_id = wallet['id']
          wallet_key = wallet['passKey']
      except KeyError as e:
          self._logger.error(f'Missing request field {e}')
          raise web.HTTPBadRequest

      if not isinstance(backup_file_storage_path, str):
            raise web.HTTPBadRequest

      if not isinstance(wallet_id, str):
          self._logger.error(f'Invalid wallet id field {wallet_id}')
          raise web.HTTPBadRequest

      if not isinstance(wallet_key, str):
          self._logger.error(f'Invalid wallet key field {wallet_key}')
          raise web.HTTPBadRequest

      try:
            operation_result = await self._service.backup_wallet(
              backup_file_storage_path, 
              wallet_id,
              wallet_key)

      except ServiceError as e:
            self._logger.error(f'Failed to create backup. Returning 500. Exception: {traceback.format_exc()}')
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
              wallet:
                  type: object
                  properties:
                    id:
                      type: string
                    oldWalletPassKey:
                      type: string
                    newWalletPassKey:
                      type: string
              backupFileStoragePath:
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

      self._logger.debug(f'Got request to restore wallet backup. Content: {request_content}')
      try:
          request_data = json.loads(request_content)
      except ValueError as e:
          self._logger.error(f'Failed to decode request as JSON: {e}')
          # TODO - differentiate if bad json, or wrong content-type
          raise web.HTTPBadRequest

      try:
          wallet = request_data['wallet']
          wallet_id = wallet['id']
          old_wallet_key = wallet['oldWalletPassKey']
          new_wallet_key = wallet['newWalletPassKey']
          backup_file_storage_path = request_data['backupFileStoragePath']
      except KeyError as e:
          self._logger.error(f'Missing request field {e}')
          raise web.HTTPBadRequest

      if not isinstance(backup_file_storage_path, str):
            raise web.HTTPBadRequest

      if not isinstance(old_wallet_key, str):
          self._logger.error(f'Invalid wallet key field oldWalletPassKey: {old_wallet_key}')
          raise web.HTTPBadRequest

      if not isinstance(new_wallet_key, str):
          self._logger.error(f'Invalid wallet key field newWalletPassKey: {new_wallet_key}')
          raise web.HTTPBadRequest

      if not isinstance(wallet_id, str):
            raise web.HTTPBadRequest

      try:
            operation_result = await self._service.restore_wallet(
              wallet_id,
              old_wallet_key,
              new_wallet_key,
              backup_file_storage_path)

      except ServiceError as e:
            self._logger.error(f'Failed to create backup. Returning 500. Exception: {traceback.format_exc()}')
            raise web.HTTPInternalServerError


      response = {
            'message': operation_result,
        }

      return web.json_response(response)

