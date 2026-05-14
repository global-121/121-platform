# MTN Mobile Money Integration

## Configuration

The MTN integration requires two layers of configuration:

1. **Environment variables** (`services/.env`) — control the operating mode and connection to the MTN API.
2. **Per-program FSP configuration** (via 121 portal or API) — store the actual MTN wallet credentials for each program.

---

### Environment Variables

All MTN env vars are defined in `services/.env`. The only variable that is always required is `MTN_MODE`. The rest depend on its value.

| Variable                   | Required when       | Description                                                                                                     |
| -------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `MTN_MODE`                 | **Always**          | `DISABLED` (off), `MOCK` (uses built-in mock service), or `EXTERNAL` (uses real MTN API)                        |
| `MTN_API_URL`              | `MTN_MODE=EXTERNAL` | Base URL for all MTN API calls (e.g., `https://sandbox.momodeveloper.mtn.com`)                                  |
| `MTN_SUBSCRIPTION_KEY`     | `MTN_MODE=EXTERNAL` | `Ocp-Apim-Subscription-Key` — primary key from the Disbursements product on the MTN portal                      |
| `MTN_REFERENCE_ID`         | `MTN_MODE=EXTERNAL` | API User UUID (v4), created during provisioning on the MTN portal                                               |
| `MTN_TARGET_ENVIRONMENT`   | `MTN_MODE=EXTERNAL` | `sandbox` for sandbox; country-specific for production (e.g., `mtnuganda`, `mtnghana`)                          |
| `MTN_API_KEY`              | `MTN_MODE=EXTERNAL` | API Key generated for the API User on the MTN portal                                                            |
| `EXTERNAL_121_SERVICE_URL` | No (optional)       | Public URL of the 121 service. Sets the `X-Callback-Url` header. If unset, polling uses `http://localhost:3000` |

> **Startup validation:** When `MTN_MODE=EXTERNAL`, the application validates at startup that all required env variables are set. Missing variables will prevent the service from starting. When `MTN_MODE=MOCK` or `DISABLED`, the other variables are ignored.

---

### Per-Program FSP Configuration

Each program using MTN must have its own FSP configuration with these properties. These are configured in the 121 portal (or via the API) — not in `.env`.

| Property             | Required | Description                                                                         |
| -------------------- | -------- | ----------------------------------------------------------------------------------- |
| `subscriptionKeyMtn` | **Yes**  | Subscription key for this program's MTN wallet (`Ocp-Apim-Subscription-Key` header) |
| `referenceIdMtn`     | **Yes**  | API User UUID for this program's MTN wallet (used as username in Basic Auth)        |
| `apiKeyMtn`          | **Yes**  | API Key for this program's MTN wallet (used as password in Basic Auth)              |

> **Note:** The per-program credentials override the global env variables for API authentication. The global env vars (`MTN_SUBSCRIPTION_KEY`, `MTN_REFERENCE_ID`, `MTN_API_KEY`) are validated at startup but the actual API calls use the per-program values.

---

### Required Registration Attributes

| Attribute            | Required | Description                                                                  |
| -------------------- | -------- | ---------------------------------------------------------------------------- |
| `phoneNumberPayment` | **Yes**  | Mobile money account phone number in international format without `+` prefix |

---

## Local Development Setup

### Using the Mock Service (default)

No MTN credentials needed. The built-in mock service simulates the MTN API.

```bash
MTN_MODE=MOCK
```

All other MTN variables can be placeholder values (e.g., `test-subscription-key`). See [`.env.example`](../../../../../../.env.example) for defaults.

### Using the MTN Sandbox

1. Register at [momodeveloper.mtn.com](https://momodeveloper.mtn.com) and subscribe to the **Disbursements** product.
2. Create an API User and generate an API Key on the portal.
3. Update `services/.env`:
   ```bash
   MTN_MODE=EXTERNAL
   MTN_API_URL=https://sandbox.momodeveloper.mtn.com
   MTN_SUBSCRIPTION_KEY=<your-subscription-key>
   MTN_REFERENCE_ID=<your-api-user-uuid>
   MTN_TARGET_ENVIRONMENT=sandbox
   MTN_API_KEY=<your-api-key>
   EXTERNAL_121_SERVICE_URL=<your-public-url>
   ```
4. Expose port 3000 via [ngrok](https://ngrok.com/) (or similar) and set `EXTERNAL_121_SERVICE_URL` to the public URL.
5. Start the backend (`npm run start:services`), load a program with MTN, import registrations, and initiate a payment.

---

## Mock Service Test Phone Numbers

When `MTN_MODE=MOCK`, the following phone numbers trigger specific scenarios:

| Phone Number | Behavior                                                               |
| ------------ | ---------------------------------------------------------------------- |
| `100000001`  | Returns 409 Conflict (duplicate transfer)                              |
| `100000002`  | Returns 500 Internal Server Error                                      |
| `100000003`  | Transfer accepted, then status returns `FAILED` with `PAYER_NOT_FOUND` |
| `100000004`  | Transfer accepted, then status returns `FAILED` with `PAYEE_NOT_FOUND` |
| Any other    | Transfer succeeds (`SUCCESSFUL`)                                       |

---

## Further Reading

For the full integration architecture, transaction flow, API details, and error handling, see [docs/fsp-mtn.md](../../../../../../../docs/fsp-mtn.md).
