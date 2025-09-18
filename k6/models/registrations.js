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

  exportRegistrations(programId, filter) {
    const url = `${baseUrl}api/programs/${programId}/metrics/export-list/registrations?sortBy=registrationProgramId:DESC&select=referenceId,${filter}&format=json`;
    return http.get(url);
  }

  bulkUpdateRegistrationsCSV(programId, csvContent) {
    const url = `${baseUrl}api/programs/${programId}/registrations`;

    const formData = {
      file: http.file(csvContent, 'registrations.csv'),
      reason: 'bulk update',
    };

    const res = http.patch(url, formData);
    return res;
  }

  jsonToCsv(data) {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const item of data) {
      const row = headers.map((header) => {
        const value = item[header];
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    }
    return csvRows.join('\n');
  }
}
