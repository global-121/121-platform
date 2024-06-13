import http from 'k6/http';

const baseUrl = __ENV.API_BASE_URL || 'http://localhost:3000';

export default class metricstsModel
{
  constructor() {}
  getExportList(programId) {
    const url = `${baseUrl}/api/programs/${programId}/metrics/export-list/all-people-affected`;
    const res = http.get(url);
    return res;
  }
}
