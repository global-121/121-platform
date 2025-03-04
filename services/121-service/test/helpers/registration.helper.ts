import * as request from 'supertest';

import { EventEnum } from '@121-service/src/events/enum/event.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  getAccessToken,
  getServer,
} from '@121-service/test/helpers/utility.helper';

export function importRegistrations(
  programId: number,
  registrations: object[],
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .post(`/programs/${programId}/registrations`)
    .set('Cookie', [accessToken])
    .send(registrations);
}

export function importRegistrationsCSV(
  programId: number,
  filePath: string,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .post(`/programs/${programId}/registrations/import`)
    .set('Cookie', [accessToken])
    .attach('file', filePath);
}

export function bulkUpdateRegistrationsCSV(
  programId: number,
  filePath: string,
  accessToken: string,
  reason: string,
): Promise<request.Response> {
  return getServer()
    .patch(`/programs/${programId}/registrations`)
    .set('Cookie', [accessToken])
    .attach('file', filePath)
    .field('reason', reason);
}

export function deleteRegistrations({
  programId,
  referenceIds,
  accessToken,
  reason = 'default reason',
  filter = {},
}: {
  programId: number;
  referenceIds: string[];
  accessToken: string;
  reason?: string;
  filter?: Record<string, string>;
}): Promise<request.Response> {
  const queryParams: Record<string, string> = {};

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
    .send({
      reason,
    });
}

export async function waitForDeleteRegistrations({
  programId,
  referenceIds,
  maxWaitTimeMs = 8000,
}: {
  programId: number;
  referenceIds: string[];
  maxWaitTimeMs?: number;
}) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTimeMs) {
    // Get payment transactions
    let totalRegistrationSuccesfullyDeleted = 0;
    for (const referenceId of referenceIds) {
      const getEventResponse = await getEvents(
        programId,
        undefined,
        undefined,
        referenceId,
      );
      const deleteEvent = getEventResponse.body.find(
        (event) =>
          event.type === EventEnum.registrationStatusChange &&
          event.attributes?.newValue === RegistrationStatusEnum.deleted,
      );
      if (deleteEvent) {
        totalRegistrationSuccesfullyDeleted++;
      }
    }
    if (totalRegistrationSuccesfullyDeleted === referenceIds.length) {
      return;
    }

    await waitFor(200);
  }
  throw new Error('Registrations were not deleted in time');
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

export async function getRegistrationIdByReferenceId({
  programId,
  referenceId,
  accessToken,
}: {
  programId: number;
  referenceId: string;
  accessToken: string;
}): Promise<number> {
  const searchRegistrationResponse = await searchRegistrationByReferenceId(
    referenceId,
    programId,
    accessToken,
  );

  return searchRegistrationResponse.body.data[0].id;
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

export function getRegistrations({
  programId,
  attributes,
  accessToken,
  page,
  limit,
  filter = {},
  sort,
}: {
  programId: number;
  attributes?: string[];
  accessToken: string;
  page?: number;
  limit?: number;
  filter?: Record<string, string>;
  sort?: { field: string; direction: 'ASC' | 'DESC' };
}): Promise<request.Response> {
  const queryParams: Record<string, string> = {};

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

export async function changeBulkRegistrationStatus({
  programId,
  status,
  accessToken,
  options: { includeTemplatedMessage = false, reason = 'default reason' } = {},
}: {
  programId: number;
  status: RegistrationStatusEnum;
  accessToken: string;
  options?: {
    filter?: Record<string, string>;
    includeTemplatedMessage?: boolean;
    reason?: string | null;
  };
}): Promise<request.Response> {
  const queryParams: Record<string, string> = {};

  const result = await getServer()
    .patch(`/programs/${programId}/registrations/status`)
    .set('Cookie', [accessToken])
    .query(queryParams)
    .send({
      status,
      message: null,
      messageTemplateKey: includeTemplatedMessage ? status : null,
      reason,
    });

  return result;
}

export async function changeRegistrationStatus({
  programId,
  referenceIds,
  status,
  accessToken,
  options: {
    filter = {},
    includeTemplatedMessage = false,
    reason = 'default reason',
  } = {},
}: {
  programId: number;
  referenceIds: string[];
  status: RegistrationStatusEnum;
  accessToken: string;
  options?: {
    filter?: Record<string, string>;
    includeTemplatedMessage?: boolean;
    reason?: string | null;
  };
}): Promise<request.Response> {
  const queryParams: Record<string, string> = {};

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
      status,
      message: null,
      messageTemplateKey: includeTemplatedMessage ? status : null,
      reason,
    });

  return result;
}

export async function awaitChangeRegistrationStatus({
  programId,
  referenceIds,
  status,
  accessToken,
  options = {},
}: {
  programId: number;
  referenceIds: string[];
  status: RegistrationStatusEnum;
  accessToken: string;
  options?: {
    filter?: Record<string, string>;
    includeTemplatedMessage?: boolean;
    reason?: string | null;
  };
}): Promise<request.Response> {
  const result = await changeRegistrationStatus({
    programId,
    referenceIds,
    status,
    accessToken,
    options,
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
    const paginatedRegistrations = await getRegistrations({
      programId,
      attributes: ['status'],
      accessToken,
      page: 1,
      filter: {
        'filter.status': `$in:${status}`,
      },
    });
    // If not all status change are done check again
    if (paginatedRegistrations.body.data.length >= amountOfRegistrations) {
      return;
    }
    await waitFor(200);
  }
}

export function sendMessage(
  accessToken: string,
  programId: number,
  referenceIds: string[],
  message?: string,
  messageTemplateKey?: string,
  additionalQueryParam?: Record<string, string>,
): Promise<request.Response> {
  const queryParams: Record<string, string> = {};

  if (additionalQueryParam) {
    for (const [key, value] of Object.entries(additionalQueryParam)) {
      queryParams[key] = value;
    }
  }

  if (referenceIds && referenceIds.length > 0) {
    queryParams['filter.referenceId'] = `$in:${referenceIds.join(',')}`;
  }

  return getServer()
    .post(`/programs/${programId}/registrations/message`)
    .set('Cookie', [accessToken])
    .query(queryParams)
    .send({ message, messageTemplateKey });
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
      data,
      reason,
    });
}

export function getRegistrationChangeLog(
  programId: number,
  referenceId: string,
  accessToken: string,
): Promise<request.Response> {
  const queryParams = {
    referenceId,
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
  return getServer()
    .get(
      `/programs/${programId}/registrations/${referenceId}/financial-service-providers/intersolve-visa/wallet`,
    )
    .set('Cookie', [accessToken])
    .send();
}

export function retrieveAndUpdateVisaWalletsAndDetails(
  programId: number,
  referenceId: string,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .patch(
      `/programs/${programId}/registrations/${referenceId}/financial-service-providers/intersolve-visa/wallet`,
    )
    .set('Cookie', [accessToken])
    .send();
}

export function issueNewVisaCard(
  programId: number,
  referenceId: string,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .post(
      `/programs/${programId}/registrations/${referenceId}/financial-service-providers/intersolve-visa/wallet/cards`,
    )
    .set('Cookie', [accessToken])
    .send();
}

export function blockVisaCard(
  programId: number,
  tokenCode: string,
  accessToken: string,
  referenceId: string,
): Promise<request.Response> {
  return getServer()
    .patch(
      `/programs/${programId}/registrations/${referenceId}/financial-service-providers/intersolve-visa/wallet/cards/${tokenCode}?pause=true`,
    )
    .set('Cookie', [accessToken])
    .send({});
}

export function unblockVisaCard(
  programId: number,
  tokenCode: string,
  accessToken: string,
  referenceId: string,
): Promise<request.Response> {
  return getServer()
    .patch(
      `/programs/${programId}/registrations/${referenceId}/financial-service-providers/intersolve-visa/wallet/cards/${tokenCode}?pause=false`,
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
    .get(`/programs/${programId}/registrations/${referenceId}/messages`)
    .set('Cookie', [accessToken])
    .send();
}

export async function getMessageHistoryUntilX(
  programId: number,
  referenceId: string,
  accessToken: string,
  x: number,
): Promise<request.Response> {
  const response = await getMessageHistory(programId, referenceId, accessToken);

  if (Array.isArray(response.body) && response.body.length >= x) {
    return response;
  }

  // Wait for a second before making the next request to avoid overloading the server
  await waitFor(400);

  return getMessageHistoryUntilX(programId, referenceId, accessToken, x);
}

export async function seedPaidRegistrations(
  registrations: any[],
  programId: number,
): Promise<void> {
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrations, programId, accessToken);

  await doPayment({
    programId,
    paymentNr: 1,
    amount: 20,
    referenceIds: [],
    accessToken,
    filter: {
      'filter.status': '$in:included',
    },
  });

  const registrationReferenceIds = registrations.map((r) => r.referenceId);

  await waitForPaymentTransactionsToComplete(
    programId,
    registrationReferenceIds,
    accessToken,
    30_000,
    [TransactionStatusEnum.success, TransactionStatusEnum.waiting],
  );
}

export async function seedRegistrations(
  registrations: any[],
  programId: number,
): Promise<void> {
  const accessToken = await getAccessToken();
  await importRegistrations(programId, registrations, accessToken);
}

export async function seedIncludedRegistrations(
  registrations: any[],
  programId: number,
  accessToken: string,
): Promise<void> {
  const response = await importRegistrations(
    programId,
    registrations,
    accessToken,
  );

  if (!(response.status >= 200 && response.status < 300)) {
    throw new Error(
      `Error occured while importing registrations: ${response.text}`,
    );
  }

  await awaitChangeRegistrationStatus({
    programId,
    referenceIds: registrations.map((r) => r.referenceId),
    status: RegistrationStatusEnum.included,
    accessToken,
  });
}

export async function seedRegistrationsWithStatus(
  registrations: any[],
  programId: number,
  accessToken: string,
  status: RegistrationStatusEnum,
): Promise<void> {
  const response = await importRegistrations(
    programId,
    registrations,
    accessToken,
  );

  if (!(response.status >= 200 && response.status < 300)) {
    throw new Error(
      `Error occured while importing registrations: ${response.text}`,
    );
  }

  await awaitChangeRegistrationStatus({
    programId,
    referenceIds: registrations.map((r) => r.referenceId),
    status,
    accessToken,
  });
}

export async function getEvents(
  programId: number,
  fromDate?: string,
  toDate?: string,
  referenceId?: string,
): Promise<any> {
  const accessToken = await getAccessToken();

  const queryParams: Record<string, string> = {};

  if (fromDate) {
    queryParams['fromDate'] = fromDate;
  }

  if (toDate) {
    queryParams['toDate'] = toDate;
  }

  if (referenceId) {
    queryParams['referenceId'] = referenceId;
  }

  return getServer()
    .get(`/programs/${programId}/events`)
    .set('Cookie', [accessToken])
    .query(queryParams)
    .send();
}

export async function getRegistrationEvents(
  programId: number,
  registrationId: number,
): Promise<any> {
  const accessToken = await getAccessToken();

  return getServer()
    .get(`/programs/${programId}/registrations/${registrationId}/events`)
    .set('Cookie', [accessToken])
    .send();
}

export async function getImportRegistrationsTemplate(
  programId: number,
): Promise<any> {
  const accessToken = await getAccessToken();

  return getServer()
    .get(`/programs/${programId}/registrations/import/template`)
    .set('Cookie', [accessToken])
    .send();
}

export async function getImportFspReconciliationTemplate(
  programId: number,
): Promise<any> {
  const accessToken = await getAccessToken();

  return getServer()
    .get(`/programs/${programId}/payments/excel-reconciliation/template`)
    .set('Cookie', [accessToken])
    .send();
}

export async function getDuplicates({
  programId,
  referenceId,
  accessToken,
}: {
  programId: number;
  referenceId: string;
  accessToken: string;
}): Promise<any> {
  return getServer()
    .get(`/programs/${programId}/registrations/${referenceId}/duplicates`)
    .set('Cookie', [accessToken])
    .send();
}

export async function createRegistrationDistinctness({
  programId,
  registrationIds,
  accessToken,
  reason = 'default reason',
}: {
  programId: number;
  registrationIds: number[];
  accessToken: string;
  reason?: string;
}): Promise<any> {
  return getServer()
    .post(`/programs/${programId}/registrations/distinctness`)
    .set('Cookie', [accessToken])
    .send({ registrationIds, reason });
}

export async function getActivities({
  programId,
  registrationId,
  accessToken,
}: {
  programId: number;
  registrationId: number;
  accessToken: string;
}): Promise<any> {
  return getServer()
    .get(`/programs/${programId}/registrations/${registrationId}/activities`)
    .set('Cookie', [accessToken])
    .send();
}
