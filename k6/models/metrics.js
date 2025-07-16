import http from 'k6/http';

import config from './config.js';
const { baseUrl } = config;

export default class metricstsModel {
  constructor() {}
  getExportList(programId) {
    const url = `${baseUrl}api/programs/${programId}/metrics/export-list/registrations`;
    const res = http.get(url);
    return res;
  }
}
