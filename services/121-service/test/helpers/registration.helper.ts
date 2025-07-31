import { HttpStatus } from '@nestjs/common';
import { isMatch } from 'lodash';
import * as request from 'supertest';

import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { MessageActivity } from '@121-service/src/activities/interfaces/message-activity.interface';
import { EventEnum } from '@121-service/src/events/enum/event.enum';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  getAccessToken,
  getServer,
} from '@121-service/test/helpers/utility.helper';

export function createOcwRegistrationForImport({
  referenceId,
  paymentAmountMultiplier,
  addressHouseNumber,
  fullName,
  phoneNumber,
  whatsappPhoneNumber,
  addressStreet,
  addressPostalCode,
  addressCity,
  programFspConfigurationName,
}: {
  referenceId?: string;
  paymentAmountMultiplier?: number;
  addressHouseNumber?: number | null;
  fullName?: string | null;
  phoneNumber?: string | null;
  whatsappPhoneNumber?: string | null;
  addressStreet?: string | null;
  addressPostalCode?: string | null;
  addressCity?: string | null;
  programFspConfigurationName?: string;
}) {
  return {
    referenceId:
      referenceId !== undefined
        ? referenceId
        : `ref-${Math.random().toString(36).substring(2, 10)}`,
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier:
      paymentAmountMultiplier !== undefined ? paymentAmountMultiplier : 1,
    fullName: fullName !== undefined ? fullName : 'Default Name',
    phoneNumber: phoneNumber !== undefined ? phoneNumber : '14155236666',
    programFspConfigurationName: programFspConfigurationName
      ? programFspConfigurationName
      : Fsps.intersolveVisa,
    whatsappPhoneNumber:
      whatsappPhoneNumber !== undefined ? whatsappPhoneNumber : '14155236666',
    addressStreet:
      addressStreet !== undefined ? addressStreet : 'Default Street',
    addressHouseNumber:
      addressHouseNumber !== undefined ? addressHouseNumber : 1,
    addressHouseNumberAddition: '',
    addressPostalCode:
      addressPostalCode !== undefined ? addressPostalCode : '1234AB',
    addressCity: addressCity !== undefined ? addressCity : 'Default City',
  };
}

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
  const accessToken = await getAccessToken();
  while (Date.now() - startTime < maxWaitTimeMs) {
    // Get payment transactions
    let totalRegistrationSuccesfullyDeleted = 0;

    for (const referenceId of referenceIds) {
      const getEventsResponse = await getEvents({
        programId,
        fromDate: undefined,
        toDate: undefined,
        referenceId,
        accessToken,
      });
      const deleteEvent = getEventsResponse.body.find(
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
  // NOTE: If the changeRegistrationStatus throws an error, it means that the status change is not allowed/successful so we don't need to wait for it.
  // Only use this method in case success is expected, otherwise use changeRegistrationStatus directly.
  if (result.status !== HttpStatus.ACCEPTED) {
    throw new Error(
      `Failed to change registration status. Status: ${result.status}. Body: ${JSON.stringify(result.body)}`,
    );
  }

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
    const eventsResult = await getEvents({ programId, accessToken });
    if (!eventsResult?.body || !Array.isArray(eventsResult.body)) {
      await waitFor(200);
      continue;
    }
    const filteredEvents = eventsResult.body.filter(
      (event) =>
        event.type === EventEnum.registrationStatusChange &&
        event.attributes.newValue === status,
    );
    // If not all status change are done check again
    if (filteredEvents.length >= amountOfRegistrations) {
      return;
    }
    await waitFor(200);
  }
}

/**
 * It's only useful to call this function on bulk updates, because single updates happen synchronously
 */
export async function waitForBulkRegistrationChanges(
  expectedChanges: {
    referenceId: string;
    expectedPatch: Record<string, any>;
  }[],
  programId: number,
  accessToken: string,
  maxWaitTimeMs = 10000,
  pollIntervalMs = 500,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTimeMs) {
    const allMatch = await Promise.all(
      expectedChanges.map(async ({ referenceId, expectedPatch }) => {
        const result = await searchRegistrationByReferenceId(
          referenceId,
          programId,
          accessToken,
        );
        const registration = result.body.data[0];
        // Filter out null values. Because if you remove a field from a registration it will not be returned from the api
        const filteredPatch = Object.entries(expectedPatch)
          .filter(([_, value]) => value !== null)
          .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

        return registration && isMatch(registration, filteredPatch);
      }),
    );

    if (allMatch.every(Boolean)) {
      return;
    }

    await waitFor(pollIntervalMs);
  }

  throw new Error('Timed out waiting for registration changes');
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
      `/programs/${programId}/registrations/${referenceId}/fsps/intersolve-visa/wallet`,
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
      `/programs/${programId}/registrations/${referenceId}/fsps/intersolve-visa/wallet`,
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
      `/programs/${programId}/registrations/${referenceId}/fsps/intersolve-visa/wallet/cards`,
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
      `/programs/${programId}/registrations/${referenceId}/fsps/intersolve-visa/wallet/cards/${tokenCode}?pause=true`,
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
      `/programs/${programId}/registrations/${referenceId}/fsps/intersolve-visa/wallet/cards/${tokenCode}?pause=false`,
    )
    .set('Cookie', [accessToken])
    .send({});
}

export async function getMessageHistory(
  programId: number,
  referenceId: string,
  accessToken: string,
): Promise<{ body: MessageActivity[] }> {
  const registrationId = await getRegistrationIdByReferenceId({
    programId,
    referenceId,
    accessToken,
  });

  const activities = await getActivities({
    programId,
    registrationId,
    accessToken,
  });

  const messages = activities.body.data.filter(
    (activity) => activity.type === ActivityTypeEnum.Message,
  );

  return {
    body: messages,
  };
}

export async function getAllActivitiesCount(
  programId: number,
  referenceId: string,
  accessToken: string,
): Promise<{ body: any; totalCount: number }> {
  const registrationId = await getRegistrationIdByReferenceId({
    programId,
    referenceId,
    accessToken,
  });

  const activities = await getActivities({
    programId,
    registrationId,
    accessToken,
  });
  // Parse the JSON if it's a string
  const activitiesData =
    typeof activities.text === 'string'
      ? JSON.parse(activities.text)
      : activities.body;

  // Calculate the sum of all counts from the meta section
  const countData = activitiesData.meta?.count ?? {};
  const totalCount = (Object.values(countData) as number[]).reduce(
    (sum: number, count: number) => sum + count,
    0,
  );

  return {
    body: activitiesData.meta.count,
    totalCount,
  };
}

export async function getMessageHistoryUntilX(
  programId: number,
  referenceId: string,
  accessToken: string,
  x: number,
): Promise<{ body: MessageActivity[] }> {
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
  paymentNr = 1,
  amount = 20,
  completeStatusses: TransactionStatusEnum[] = [
    TransactionStatusEnum.success,
    TransactionStatusEnum.waiting,
  ],
): Promise<void> {
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrations, programId, accessToken);
  const registrationReferenceIds = registrations.map((r) => r.referenceId);

  await doPaymentAndWaitForCompletion({
    programId,
    referenceIds: registrationReferenceIds,
    amount,
    accessToken,
    paymentNr,
    completeStatusses,
  });
}

export async function doPaymentAndWaitForCompletion({
  programId,
  referenceIds,
  amount,
  accessToken,
  paymentNr = 1,
  completeStatusses = [
    TransactionStatusEnum.success,
    TransactionStatusEnum.waiting,
  ],
}: {
  programId: number;
  referenceIds: string[];
  amount: number;
  accessToken: string;
  paymentNr?: number;
  completeStatusses?: TransactionStatusEnum[];
}): Promise<void> {
  await doPayment({
    programId,
    paymentNr,
    amount,
    referenceIds,
    accessToken,
  });

  await waitForPaymentTransactionsToComplete({
    programId,
    paymentReferenceIds: referenceIds,
    accessToken,
    maxWaitTimeMs: 30_000,
    completeStatusses,
  });
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

  if (status === RegistrationStatusEnum.new) {
    return;
  }

  await awaitChangeRegistrationStatus({
    programId,
    referenceIds: registrations.map((r) => r.referenceId),
    status,
    accessToken,
  });
}

export async function getEvents({
  programId,
  accessToken,
  fromDate,
  toDate,
  referenceId,
}: {
  programId: number;
  accessToken: string;
  fromDate?: string;
  toDate?: string;
  referenceId?: string;
}): Promise<any> {
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

export async function createRegistrationUniques({
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
    .post(`/programs/${programId}/registrations/uniques`)
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
