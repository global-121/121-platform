// import { open } from 'k6';
import http from 'k6/http';

import config from './config.js'; // Import your configuration file

const { baseUrl } = config;

export default class RegistrationsModel {
  constructor() {}

  importRegistrations(projectId, registrations) {
    const url = `${baseUrl}api/projects/${projectId}/registrations`;
    const payload = JSON.stringify([registrations]);
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const res = http.post(url, payload, params);

    return res;
  }

  importRegistrationsCsv(projectId, csvFile) {
    const url = `${baseUrl}api/projects/${projectId}/registrations/import`;
    const formData = {
      file: http.file(csvFile, 'registrations.csv'),
    };
    const params = {
      timeout: '1200s',
    };

    const res = http.post(url, formData, params);

    return res;
  }

  getRegistrations(projectId, filter) {
    let queryParams = '';
    if (filter) {
      queryParams = Object.entries(filter)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
        )
        .join('&');
    }

    const url = `${baseUrl}api/projects/${projectId}/registrations?${queryParams}`;
    return http.get(url);
  }

  exportRegistrations(projectId, filter) {
    const url = `${baseUrl}api/projects/${projectId}/metrics/export-list/registrations?sortBy=registrationProjectId:DESC&select=referenceId,${filter}&format=json`;
    return http.get(url);
  }

  bulkUpdateRegistrationsCSV(projectId, csvContent) {
    const url = `${baseUrl}api/projects/${projectId}/registrations`;

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
