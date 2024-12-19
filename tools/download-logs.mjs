/**
 * To use this script, you have to have the azure cli installed and logged in with "az login".
 * https://aka.ms/azure-cli
 *
 * Also make sure to create an .env file with the relevant environment variables.
 */

import 'dotenv/config';

import { DefaultAzureCredential } from '@azure/identity';
import { parse } from 'node-html-parser';
import fs from 'fs';
import path from 'path';

const LOGS_FOLDER = path.join(process.cwd(), 'logs');
const IGNORED_INSTANCES = ['test', 'staging', 'demo', 'training'];

// returns an azure access token that can be used to access protected resources
async function getAzureAccessToken() {
  const credential = new DefaultAzureCredential();
  return await credential.getToken('https://management.azure.com');
}

// returns all of the instance ids and their docker logs urls based on the status page
// TODO: would be nice to use the azure API for this instead, but the documentation is not very clear
async function getInstancesLogsUrls() {
  const response = await fetch('https://status.121.global');
  const data = await response.text();

  // parse html
  const root = parse(data);

  // get all instances
  const instances = root.querySelectorAll('.instance').filter(
    // except for non-production instances
    (instance) =>
      !IGNORED_INSTANCES.includes(instance.id) && !instance.id.includes('mock'),
  );

  return instances.map((instance) => ({
    instanceId: instance.id,
    // get the url of the "logs" link for each instance
    logsUrl: instance
      .querySelector('a[href*="logs/docker"]')
      .getAttribute('href'),
  }));
}

async function main() {
  const token = await getAzureAccessToken();
  const instances = await getInstancesLogsUrls();

  if (!fs.existsSync(LOGS_FOLDER)) {
    fs.mkdirSync(LOGS_FOLDER);
  }

  await Promise.all(
    instances.map(async ({ instanceId, logsUrl }) => {
      // download the json file containing the paths to all of the logs
      const logInfoArrayResponse = await fetch(logsUrl, {
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      });
      const logInfoArray = await logInfoArrayResponse.json();

      // logInfoArray contains an array of objects that looks like this:
      // [{
      //   machineName: 'randomstring_somekindofsuffix',
      //   lastUpdated: '2024-12-17T09:06:16.6126319Z',
      //   size: 1446,
      //   href: 'https://some-url-to-access-log-file/randomstring_somekindofsuffix_docker.log',
      //   path: '/path/to/log/on/machine/randomstring_somekindofsuffix_docker.log'
      // }]

      await Promise.all(
        logInfoArray.map(async (logInfo) => {
          // download the actual log file
          const dockerLogsResponse = await fetch(logInfo.href, {
            headers: {
              Authorization: `Bearer ${token.token}`,
            },
          });

          const dockerLogs = await dockerLogsResponse.text();

          // save the log file to disk
          fs.writeFileSync(
            path.join(LOGS_FOLDER, `${instanceId}.${logInfo.machineName}.log`),
            dockerLogs,
          );
        }),
      );

      console.log(`Downloaded logs for instance ${instanceId}`);
    }),
  );
}

main();
