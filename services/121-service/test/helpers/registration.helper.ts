import * as request from 'supertest';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { waitFor } from '../../src/utils/waitFor.helper';
import {
  changePhase,
  doPayment,
  waitForPaymentTransactionsToComplete,
} from './program.helper';
import { getAccessToken, getServer } from './utility.helper';

export function importRegistrations(
  programId: number,
  registrations: object[],
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .post(`/programs/${programId}/registrations/import`)
    .set('Cookie', [accessToken])
    .send(registrations);
}

export function deleteRegistrations(
  programId: number,
  referenceIds: string[],
  accessToken: string,
  filter: Record<string, string> = {},
): Promise<request.Response> {
  const queryParams = {};

  if (referenceIds) {
    queryParams['filter.referenceId'] = `$in:${referenceIds.join(',')}`;
  }

  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      queryParams[key] = value;
    }
  }

  return getServer()
    .delete(`/programs/${programId}/registrations`)
    .set('Cookie', [accessToken])
    .query(queryParams)
    .send();
}

export function searchRegistrationByReferenceId(
  referenceId: string,
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  const queryParams = {
    'filter.referenceId': referenceId,
  };

  return getServer()
    .get(`/programs/${programId}/registrations`)
    .set('Cookie', [accessToken])
    .query(queryParams)
    .send();
}

export function searchRegistrationByPhoneNumber(
  phoneNumber: string,
  accessToken: string,
): Promise<request.Response> {
  const queryParams = {
    phonenumber: phoneNumber,
  };

  return getServer()
    .get(`/registrations`)
    .set('Cookie', [accessToken])
    .query(queryParams)
    .send();
}

export function getRegistrations(
  programId: number,
  attributes: string[],
  accessToken: string,
  page?: number,
  limit?: number,
  filter: Record<string, string> = {},
  sort?: { field: string; direction: 'ASC' | 'DESC' },
): Promise<request.Response> {
  const queryParams = {};

  if (attributes) {
    queryParams['select'] = attributes.join(',');
  }
  if (page) {
    queryParams['page'] = String(page);
  }
  if (limit) {
    queryParams['limit'] = String(limit);
  }
  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      queryParams[key] = value;
    }
  }
  if (sort) {
    queryParams['sortBy'] = `${sort.field}:${sort.direction}`;
  }

  return getServer()
    .get(`/programs/${programId}/registrations`)
    .query(queryParams)
    .set('Cookie', [accessToken])
    .send();
}

export async function awaitChangePaStatus(
  programId: number,
  referenceIds: string[],
  status: RegistrationStatusEnum,
  accessToken: string,
  filter: Record<string, string> = {},
  includeTemplatedMessage = false,
): Promise<request.Response> {
  const queryParams = {};

  if (referenceIds) {
    queryParams['filter.referenceId'] = `$in:${referenceIds.join(',')}`;
  }

  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      queryParams[key] = value;
    }
  }

  const result = await getServer()
    .patch(`/programs/${programId}/registrations/status`)
    .set('Cookie', [accessToken])
    .query(queryParams)
    .send({
      status: status,
      message: null,
      messageTemplateKey: includeTemplatedMessage ? status : null,
    });

  await waitForStatusChangeToComplete(
    programId,
    referenceIds.length,
    status,
    8_000,
    accessToken,
  );

  return result;
}

export async function waitForStatusChangeToComplete(
  programId: number,
  amountOfRegistrations: number,
  status: string,
  maxWaitTimeMs: number,
  accessToken: string,
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTimeMs) {
    // Get payment transactions
    const metrics = await personAffectedMetrics(programId, accessToken);
    // If not all transactions are successful, wait for a short interval before checking again
    if (
      metrics.body.pa[status] &&
      metrics.body.pa[status] >= amountOfRegistrations
    ) {
      return;
    }
    await waitFor(100);
  }
}

export async function personAffectedMetrics(
  programId: number,
  accessToken: string,
): Promise<any> {
  return getServer()
    .get(`/programs/${programId}/metrics/person-affected`)
    .set('Cookie', [accessToken])
    .send();
}

export function sendMessage(
  programId: number,
  referenceIds: string[],
  message: string,
  accessToken: string,
): Promise<request.Response> {
  const queryParams = {
    ['filter.referenceId']: `$in:${referenceIds.join(',')}`,
  };

  return getServer()
    .post(`/programs/${programId}/registrations/message`)
    .set('Cookie', [accessToken])
    .query(queryParams)
    .send({ message });
}

export function updateRegistration(
  programId: number,
  referenceId: string,
  data: object,
  reason: string,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .patch(`/programs/${programId}/registrations/${referenceId}`)
    .set('Cookie', [accessToken])
    .send({
      data: data,
      reason: reason,
    });
}

export function getRegistrationChangeLog(
  programId: number,
  referenceId: string,
  accessToken: string,
): Promise<request.Response> {
  const queryParams = {
    referenceId: referenceId,
  };

  return getServer()
    .get(`/programs/${programId}/registration-change-logs`)
    .query(queryParams)
    .set('Cookie', [accessToken])
    .send();
}

export function getVisaWalletsAndDetails(
  programId: number,
  referenceId: string,
  accessToken: string,
): Promise<request.Response> {
  const queryParams = {
    referenceId: referenceId,
  };

  return getServer()
    .get(
      `/programs/${programId}/financial-service-providers/intersolve-visa/wallets`,
    )
    .query(queryParams)
    .set('Cookie', [accessToken])
    .send();
}

export function issueNewVisaCard(
  programId: number,
  referenceId: string,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .put(
      `/programs/${programId}/financial-service-providers/intersolve-visa/customers/${referenceId}/wallets`,
    )
    .set('Cookie', [accessToken])
    .send();
}

export function blockVisaCard(
  programId: number,
  tokenCode: string,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .post(
      `/programs/${programId}/financial-service-providers/intersolve-visa/wallets/${tokenCode}/block`,
    )
    .set('Cookie', [accessToken])
    .send({});
}

export function unblockVisaCard(
  programId: number,
  tokenCode: string,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .post(
      `/programs/${programId}/financial-service-providers/intersolve-visa/wallets/${tokenCode}/unblock`,
    )
    .set('Cookie', [accessToken])
    .send({});
}

export function getMessageHistory(
  programId: number,
  referenceId: string,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .get(`/programs/${programId}/registrations/message-history/${referenceId}`)
    .set('Cookie', [accessToken])
    .send();
}

export async function seedPaidRegistrations(
  registrations: any[],
  programId: number,
): Promise<void> {
  const accessToken = await getAccessToken();

  await changePhase(
    programId,
    ProgramPhase.registrationValidation,
    accessToken,
  );

  await importRegistrations(programId, registrations, accessToken);

  await changePhase(programId, ProgramPhase.inclusion, accessToken);
  await changePhase(programId, ProgramPhase.payment, accessToken);

  await awaitChangePaStatus(
    programId,
    registrations.map((r) => r.referenceId),
    RegistrationStatusEnum.included,
    accessToken,
  );

  await doPayment(programId, 1, 25, [], accessToken, {
    'filter.status': '$in:included',
  });

  const registrationReferenceIds = registrations.map((r) => r.referenceId);

  await waitForPaymentTransactionsToComplete(
    programId,
    registrationReferenceIds,
    accessToken,
    8000,
  );
}
