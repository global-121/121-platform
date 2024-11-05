// import { open } from 'k6';
import http from 'k6/http';

import config from './config.js'; // Import your configuration file

const { baseUrl } = config;

export default class RegistrationsModel {
  constructor() {}

  importRegistrations(programId, registrations) {
    const url = `${baseUrl}api/programs/${programId}/registrations/import`;
    const payload = JSON.stringify([registrations]);
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const res = http.post(url, payload, params);

    return res;
  }

  importRegistrationsCsv(programId, csvFile) {
    const url = `${baseUrl}api/programs/${programId}/registrations/import-csv`;
    const formData = {
      file: http.file(csvFile, 'registrations.csv'),
    };
    const params = {
      timeout: '1200s',
    };

    const res = http.post(url, formData, params);

    return res;
  }
}
