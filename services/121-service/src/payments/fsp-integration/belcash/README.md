# BelCash / HelloCash

This readme includes additional information / instructions on use of this FSP, that cannot be deduced from code.

## Relevant links / documentation

1. [API documentation](https://api-et.hellocash.net/docs)
2. [HelloCash Portal](https://portal.hellocash.net/)
3. [Postman collection](./HelloCashAPI.postman_collection.json)

## Set up connection using Postman

To be able to implement callbacks (for transaction status updates) you need to set up a connection.

- Note that you cannot create multiple connections, so that you have a specific connection per environment. As you cannot specify which connection to use, during a payment request.
- The only exception is that you can use the sandbox and the production account for different connections.

1. Open the Postman collection in Postman
2. Use the POST /authenticate endpoint with the provided credentials and copy the resulting token
3. Use the POST /connections/:id endpoint, with:

- Under Authorization, fill in the copied token as Bearer token
- Under Params, choose a name for you connection under 'id'
- Under Body
  - replace 'token' by 'code', and fill in the provided value
  - fill in under 'webhook' the address that callbacks should go to, e.g. `<server-url>/121-service/api/payments/belcash/payment-status`
  - add property 'authoritive': true
  - fill in for 'fromStatus' at least the statuses 'PROCESSED', 'CANCELED', 'EXPIRED', 'DENIED', 'FAILED'

4. Use the PUT /connections/:id/token endpoint, with

- Under Authorization, fill in the copied token as Bearer token
- Under Params, fill in the earlier chosen 'id'
- Under Body, fill in the same 'code' as above

5. Copy the resulting 'token' and paste it as BELCASH_API_TOKEN in .env on the relevant server and rebuild the 121-service.

6. To update an existing connection later, use the PUT /connections/:id endpoint

7. After any udpate to your connection, you always need to call the PUT /connections/:id/token endpoint again, and update the BELCASH_API_TOKEN with the corresponding token.
