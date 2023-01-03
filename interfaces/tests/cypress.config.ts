
const fs = require('fs');
module.exports = {
  'baseUrl-PA': 'http://localhost:8008',
  'baseUrl-AW': 'http://localhost:8080',
  'baseUrl-HO': 'http://localhost:8888',
  'baseUrl-server': 'http://localhost:3000/api',
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        readFile: ({ fileName }): any[] => { // there is a name and arguments for a task
          const folderPath = '../../features/test-registration-data';
          const filePath = `${folderPath}/${fileName}`;
          const csv = fs.readFileSync(filePath, 'utf8')
          const lines = csv.split("\n");
          const result = [];
          // NOTE: If your columns contain commas in their values, you'll need  // to deal with those before doing the next step   // (you might convert them to &&& or something, then covert them back later)  // jsfiddle showing the issue https://jsfiddle.net/
          const headers = lines[0].split(",");

          for (let i = 1; i < lines.length; i++) {
            let obj = {};
            const currentline = lines[i].split(",");
            for (let j = 0; j < headers.length; j++) {
              obj[headers[j]] = currentline[j];
            }
            result.push(obj);
          }
          return result
        },
      })

      require('dotenv').config({ path: '../../services/.env' })
      if (process.env.NODE_ENV === 'development') {
        config.env.RESET_SECRET = process.env.RESET_SECRET
      }
      return config
    },
  },
}
