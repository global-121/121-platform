import { defineConfig } from 'cypress';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { verifyDownloadTasks } = require('cy-verify-downloads');

module.exports = defineConfig({
  env: {
    'baseUrl-PA': 'http://localhost:8008',
    'baseUrl-AW': 'http://localhost:8080',
    'baseUrl-HO': 'http://localhost:8888',
    'baseUrl-server': 'http://localhost:3000/api',
  },
  retries: {
    runMode: 2,
    openMode: 2,
  },
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    setupNodeEvents(on, config) {
      on('task', verifyDownloadTasks);
      on('task', {
        readFile: ({ fileName }): object[] => {
          // there is a name and arguments for a task
          const folderPath = '../../features/test-registration-data';
          const filePath = `${folderPath}/${fileName}`;
          const csv = readFileSync(filePath, 'utf8');
          const lines = csv.split('\n');
          const result: Array<object> = [];
          // NOTE: If your columns contain commas in their values, you'll need
          // to deal with those before doing the next step
          // (you might convert them to &&& or something, then covert them back later)
          const headers = lines[0].split(',');

          for (let i = 1; i < lines.length; i++) {
            const obj = {};
            const currentline = lines[i].split(',');
            for (let j = 0; j < headers.length; j++) {
              obj[headers[j]] = currentline[j];
            }
            result.push(obj);
          }
          return result;
        },
      });

      dotenv.config({ path: '../../services/.env' });
      if (process.env.NODE_ENV === 'development') {
        config.env.RESET_SECRET = process.env.RESET_SECRET;
      }
      return config;
    },
  },
});
