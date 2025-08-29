import http from 'k6/http';

import config from './config.js';
const { baseUrl } = config;

export default class metricstsModel {
  constructor() {}
  getExportList(projectId) {
    const url = `${baseUrl}api/projects/${projectId}/metrics/export-list/registrations`;
    const res = http.get(url);
    return res;
  }
}
