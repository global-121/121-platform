import { sleep } from 'k6';
import http from 'k6/http';

import config from './config.js';
const { baseUrl } = config;

export default class ProjectsModel {
  constructor() {}
  sendBulkMessage(projectId) {
    const url = `${baseUrl}api/projects/${projectId}/registrations/message`;
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

  getProjectById(projectId) {
    const url = `${baseUrl}api/projects/${projectId}`;
    const res = http.get(url);
    return res;
  }

  createProjectRegistrationAttribute(projectId, attributeName) {
    const url = `${baseUrl}api/projects/${projectId}/registration-attributes`;
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

  updateRegistrationStatus(projectId, status) {
    const url = `${baseUrl}api/projects/${projectId}/registrations/status`;
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

  getStatusOverview(projectId) {
    const url = `${baseUrl}api/projects/${projectId}/metrics/registration-status`;
    const res = http.get(url);
    return res;
  }

  logResponseDetails(responseBody) {
    console.log(
      `totalFilterCount: ${responseBody.totalFilterCount}, applicableCount: ${responseBody.applicableCount}, nonApplicableCount: ${responseBody.nonApplicableCount}`,
    );
  }

  updateRegistrationStatusAndLog(projectId, status) {
    const responseStatusChange = this.updateRegistrationStatus(
      projectId,
      status,
    );
    const responseBody = JSON.parse(responseStatusChange.body);
    this.logResponseDetails(responseBody);

    let registrationCount;
    try {
      do {
        registrationCount = this.updateGetRegistrationCountForStatus(
          projectId,
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

  updateGetRegistrationCountForStatus(projectId, status) {
    const statusOverview = this.getStatusOverview(projectId);
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
