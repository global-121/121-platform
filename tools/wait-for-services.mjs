#!/usr/bin/env node

/**
 * Polls the core services of the local development-stack (121-service, mock-service and
 * the Portal) until they respond, or a timeout is reached.
 *
 * Useful to confirm the stack (started via `npm run start:services` and `npm run start:portal:e2e`)
 * is fully up before running E2E-tests against it, e.g. in the Copilot coding-agent sandbox.
 *
 * Usage: `npm run wait:services` (from the repository root)
 */

const PORT_121_SERVICE = process.env.PORT_121_SERVICE ?? '3000';
const PORT_MOCK_SERVICE = process.env.PORT_MOCK_SERVICE ?? '3001';
const PORT_PORTAL = process.env.PORT_PORTAL ?? '8088';

const TIMEOUT_MS = 90_000;
const RETRY_INTERVAL_MS = 1_000;

const services = [
  {
    name: '121-service',
    url: `http://localhost:${PORT_121_SERVICE}/api/health/health`,
  },
  {
    name: 'mock-service',
    url: `http://localhost:${PORT_MOCK_SERVICE}/docs/`,
  },
  {
    name: 'Portal',
    url: `http://localhost:${PORT_PORTAL}`,
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isReachable({ url }) {
  try {
    const response = await fetch(url);
    // Any HTTP response (including 404s for routes without a dedicated health-check)
    // means the service itself is up and accepting connections.
    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitForService({ name, url }) {
  const startTime = Date.now();

  console.log(`Waiting for ${name} to be running (${url})...`);

  while (Date.now() - startTime < TIMEOUT_MS) {
    if (await isReachable({ url })) {
      console.log(`✅ ${name} is up.`);
      return;
    }
    await sleep(RETRY_INTERVAL_MS);
  }

  throw new Error(
    `❌ ${name} was not reachable at ${url} within ${TIMEOUT_MS / 1000}s.`,
  );
}

async function main() {
  const results = await Promise.allSettled(
    services.map((service) => waitForService(service)),
  );

  const failures = results.filter((result) => result.status === 'rejected');

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(failure.reason.message);
    }
    console.error(
      '\nOne or more services are not healthy. Make sure the stack was started with `npm run start:services` and `npm run start:portal:e2e`.',
    );
    process.exit(1);
  }

  console.log('\nAll services are up and running.');
}

await main();
