// import { open } from 'k6';
import http from 'k6/http';

import config from './config.js'; // Import your configuration file

const { baseUrl } = config;

export default class RegistrationsModel {
  constructor() {}

  importRegistrations(programId, registrations) {
    const url = `${baseUrl}api/programs/${programId}/registrations`;
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
    const url = `${baseUrl}api/programs/${programId}/registrations/import`;
    const formData = {
      file: http.file(csvFile, 'registrations.csv'),
    };
    const params = {
      timeout: '1200s',
    };

    const res = http.post(url, formData, params);

    return res;
  }

  getRegistrations(programId, filter) {
    let queryParams = '';
    if (filter) {
      queryParams = Object.entries(filter)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
        )
        .join('&');
    }

    const url = `${baseUrl}api/programs/${programId}/registrations?${queryParams}`;
    return http.get(url);
  }
}
