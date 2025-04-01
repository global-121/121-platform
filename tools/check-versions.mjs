import { parse } from 'node-html-parser';

const IGNORED_INSTANCES = ['test', 'staging'];

async function getInstancesUrls() {
  const response = await fetch('https://status.121.global');
  const data = await response.text();
  const root = parse(data);

  const instances = root
    .querySelectorAll('.instance:not([id|=mock])')
    .map((instance) => instance.id)
    .filter((instance) => !IGNORED_INSTANCES.includes(instance));

  return instances;
}

async function getVersionFromUrl(url) {
  return await fetch(url)
    .then((response) => response.json())
    .then((data) => data.message)
    .catch(() => '💥');
}

function col(value) {
  return value.toString().padEnd(21, ' ');
}

async function main() {
  console.log(`Checking what's currently live...\n`);

  const instances = await getInstancesUrls();

  console.log(
    `                       |  ${col('API')}  |  ${col('Portal')}  |  ${col('🆕.portal')}`,
    `\n`,
    `----------------------|-------------------------|-------------------------|-----------------------`,
  );

  instances.forEach(async (instance) => {
    const apiVerison = await getVersionFromUrl(
      `https://${instance}.121.global/api/health/version`,
    );
    const portalVerison = await getVersionFromUrl(
      `https://portal.${instance}.121.global/VERSION.json`,
    );
    const newPortalVerison = await getVersionFromUrl(
      `https://new.portal.${instance}.121.global/VERSION.json`,
    );

    console.log(
      ` ${col(instance)} |  ${col(apiVerison)}  |  ${col(portalVerison)}  |  ${col(newPortalVerison)}`,
    );
  });
}

main();
