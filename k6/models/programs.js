import http from 'k6/http';

import config from './config.js';
const { baseUrl } = config;

export default class ProgramsModel {
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

  updateCustomAttributes(programId, nameAttribute) {
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

  createProgramQuestion(programId, questionName) {
    const url = `${baseUrl}api/programs/${programId}/program-questions`;
    const payload = JSON.stringify({
      name: questionName,
      options: ['string'],
      scoring: {},
      persistence: true,
      pattern: 'string',
      showInPeopleAffectedTable: false,
      editableInPortal: true,
      export: ['all-people-affected', 'included'],
      placeholder: {
        en: '+31 6 00 00 00 00',
      },
      duplicateCheck: false,
      label: {
        en: questionName,
        fr: 'Remplissez votre nom, sil vous plaît:',
      },
      answerType: 'text',
      questionType: 'standard',
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const res = http.post(url, payload, params);
    return res;
  }

  updateRegistrationStatus(programId, status) {
    const url = `${baseUrl}api/programs/${programId}/registrations/status`;
    const payload = JSON.stringify({
      status: `${status}`,
      message: 'Long enough acceptable message',
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const res = http.patch(url, payload, params);
    return res;
  }

  logResponseDetails(responseBody) {
    console.log(
      `totalFilterCount: ${responseBody.totalFilterCount}, applicableCount: ${responseBody.applicableCount}, nonApplicableCount: ${responseBody.nonApplicableCount}`,
    );
  }

  updateRegistrationStatusAndLog(programId, status) {
    let lastResponse = null;
    try {
      let responseBody;
      do {
        const response = this.updateRegistrationStatus(programId, status);
        lastResponse = response;
        responseBody = JSON.parse(response.body);
        this.logResponseDetails(responseBody);

        if (response.status !== 202) {
          console.log(response.body);
          throw new Error('Check failed');
        }
      } while (responseBody.applicableCount !== 0);
    } catch (error) {
      console.log(error);
    }
    return lastResponse;
  }
}
