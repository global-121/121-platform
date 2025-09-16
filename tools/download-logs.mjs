#!/usr/bin/env node

/**
 * To use this script, you have to have the Azure CLI installed and logged in with "az login".
 * https://aka.ms/azure-cli
 *
 * Also make sure to create an .env file with the relevant environment variables.
 */
import { DefaultAzureCredential } from '@azure/identity';
import { parse } from 'node-html-parser';
import fs from 'node:fs';
import path from 'node:path';

const LOGS_FOLDER = path.join(process.cwd(), 'logs');
const IGNORED_INSTANCES = ['test', 'staging', 'demo', 'training'];

async function getAzureAccessToken() {
  const credential = new DefaultAzureCredential();
  return await credential.getToken('https://management.azure.com');
}

/**
 * Get all of the instance ids and their Docker-logs urls based on the status page
 *
 * TODO: would be nice to use the Azure API for this instead, but the documentation is not very clear
 */
async function getInstancesLogsUrls() {
  const response = await fetch('https://status.121.global');
  const data = await response.text();
  const root = parse(data);

  // get all instances
  const instances = root
    .querySelectorAll('instance-121')
    .map((instance) => instance.attributes['data-name'] ?? instance.id)
    .filter((instance) => !IGNORED_INSTANCES.includes(instance))
    .filter((instance) => !instance.includes('mock'));

  return instances.map((instance) => {
    return {
      instanceId: instance,
      logsUrl: `https://121-${instance}.scm.azurewebsites.net/api/logs/docker`,
    };
  });
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
          // Skip the non-app log files
          if (!logInfo.machineName.endsWith('_default')) {
            return false;
          }

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
