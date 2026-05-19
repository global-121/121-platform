# MTN Mobile Money Integration

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

## Further Reading

For the full integration architecture, transaction flow, API details, and error handling, see [docs/fsp-mtn.md](https://github.com/rodekruis/dev-internal-documentation/tree/main/MTN).
