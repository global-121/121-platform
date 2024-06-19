import http from 'k6/http';

import config from './config.js';
const { baseUrl } = config;

export default class programsModel {
  constructor() {}
  sendBulkMessage(programId) {
    const url = `${baseUrl}api/programs/${programId}/registrations/message`;
    const payload = JSON.stringify({
      message: 'Your voucher can be picked up at the location',
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const res = http.post(url, payload, params);
    return res;
  }

  updateCustomeAttributes(programId, nameAttribute) {
    const url = `${baseUrl}api/programs/${programId}/custom-attributes`;
    const payload = JSON.stringify({
      type: 'text',
      label: {
        en: 'District',
        fr: 'Département',
      },
      showInPeopleAffectedTable: true,
      duplicateCheck: true,
      name: `${nameAttribute}`,
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const res = http.post(url, payload, params);
    return res;
  }

  getProgrammeById(programId) {
    const url = `${baseUrl}api/programs/${programId}`;
    const res = http.get(url);
    return res;
  }
}
