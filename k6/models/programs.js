import { sleep } from 'k6';
import http from 'k6/http';

import config from './config.js';
const { baseUrl } = config;

export default class ProgramsModel {
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

  getProgramById(programId) {
    const url = `${baseUrl}api/programs/${programId}`;
    const res = http.get(url);
    return res;
  }

  createProgramRegistrationAttribute(programId, attributeName) {
    const url = `${baseUrl}api/programs/${programId}/registration-attributes`;
    const payload = JSON.stringify({
      options: ['string'],
      scoring: {},
      pattern: 'string',
      showInPeopleAffectedTable: false,
      editableInPortal: true,
      export: ['payment'],
      placeholder: {
        en: '+31 6 00 00 00 00',
      },
      duplicateCheck: false,
      name: attributeName,
      label: {
        en: attributeName,
        fr: 'Remplissez votre nom, sil vous plaît:',
      },
      type: 'text',
      isRequired: false,
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

  getStatusOverview(programId) {
    const url = `${baseUrl}api/programs/${programId}/metrics/registration-status`;
    const res = http.get(url);
    return res;
  }

  logResponseDetails(responseBody) {
    console.log(
      `totalFilterCount: ${responseBody.totalFilterCount}, applicableCount: ${responseBody.applicableCount}, nonApplicableCount: ${responseBody.nonApplicableCount}`,
    );
  }

  updateRegistrationStatusAndLog(programId, status) {
    const responseStatusChange = this.updateRegistrationStatus(
      programId,
      status,
    );
    const responseBody = JSON.parse(responseStatusChange.body);
    this.logResponseDetails(responseBody);

    let registrationCount;
    try {
      do {
        registrationCount = this.updateGetRegistrationCountForStatus(
          programId,
          status,
        );
        console.log(
          `Checking counts: applicableCount = ${responseBody.applicableCount}, registrationCount = ${registrationCount}`,
        );
        sleep(3);
      } while (
        parseInt(responseBody.applicableCount) !== parseInt(registrationCount)
      );
    } catch (error) {
      console.log(error);
    }
    sleep(3);
    return responseStatusChange;
  }

  updateGetRegistrationCountForStatus(programId, status) {
    const statusOverview = this.getStatusOverview(programId);
    const statusOverviewBody = JSON.parse(statusOverview.body);

    let statusCount = 0;
    for (const item of statusOverviewBody) {
      if (item.status === status) {
        statusCount = item.statusCount;
        break;
      }
    }
    return statusCount;
  }

  nedbankCronJob() {
    const url = `${baseUrl}api/fsps/nedbank`;
    const res = http.patch(url);
    return res;
  }
}
