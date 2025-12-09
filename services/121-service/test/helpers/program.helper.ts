import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { MessageStatus } from 'twilio/lib/rest/api/v2010/account/message';
import * as XLSX from 'xlsx';

import { MessageActivity } from '@121-service/src/activities/interfaces/message-activity.interface';
import { IS_DEVELOPMENT } from '@121-service/src/config';
import { ExportFileFormat } from '@121-service/src/metrics/enum/export-file-format.enum';
import {
  CreateMessageTemplateDto,
  UpdateTemplateBodyDto,
} from '@121-service/src/notifications/message-template/dto/message-template.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import {
  ProgramRegistrationAttributeDto,
  UpdateProgramRegistrationAttributeDto,
} from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SecretDto } from '@121-service/src/scripts/scripts.controller';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  getMessageHistory,
  getRegistrations,
} from '@121-service/test/helpers/registration.helper';
import { getServer } from '@121-service/test/helpers/utility.helper';

export async function postProgram(
  program: CreateProgramDto,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/programs`)
    .set('Cookie', [accessToken])
    .send(program);
}

export async function patchProgram(
  programId: number,
  programUpdate: object,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .patch(`/programs/${programId}`)
    .set('Cookie', [accessToken])
    .send(programUpdate);
}

export async function deleteProgram(
  programId: number,
  accessToken: string,
  secretDto: SecretDto,
): Promise<request.Response> {
  return await getServer()
    .delete(`/programs/${programId}`)
    .set('Cookie', [accessToken])
    .send(secretDto);
}

export async function getProgram(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}`)
    .set('Cookie', [accessToken]);
}

export async function postProgramRegistrationAttribute(
  programRegistrationAttribute: ProgramRegistrationAttributeDto,
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/registration-attributes`)
    .set('Cookie', [accessToken])
    .send(programRegistrationAttribute);
}

export async function patchProgramRegistrationAttribute({
  programRegistrationAttributeName,
  programRegistrationAttribute,
  programId,
  accessToken,
}: {
  programRegistrationAttributeName: string;
  programRegistrationAttribute: UpdateProgramRegistrationAttributeDto;
  programId: number;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .patch(
      `/programs/${programId}/registration-attributes/${programRegistrationAttributeName}`,
    )
    .set('Cookie', [accessToken])
    .send(programRegistrationAttribute);
}

export async function createPayment({
  programId,
  transferValue,
  referenceIds,
  accessToken,
  filter = {},
  note,
}: {
  programId: number;
  transferValue: number;
  referenceIds?: string[];
  accessToken: string;
  filter?: Record<string, string>;
  note?: string;
}): Promise<request.Response> {
  const queryParams = {};
  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      queryParams[key] = value;
    }
  }

  if (referenceIds && referenceIds.length > 0) {
    queryParams['filter.referenceId'] = `$in:${referenceIds.join(',')}`;
  }

  return await getServer()
    .post(`/programs/${programId}/payments`)
    .set('Cookie', [accessToken])
    .query(queryParams)
    .send({
      transferValue,
      note,
    });
}

export async function startPayment({
  programId,
  paymentId,
  accessToken,
}: {
  programId: number;
  paymentId: number;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/payments/${paymentId}/start`)
    .set('Cookie', [accessToken])
    .send();
}

export async function createAndStartPayment({
  programId,
  transferValue,
  referenceIds,
  accessToken,
  filter = {},
  note,
}: {
  programId: number;
  transferValue: number;
  referenceIds: string[];
  accessToken: string;
  filter?: Record<string, string>;
  note?: string;
}): Promise<request.Response> {
  const createPaymentResult = await createPayment({
    programId,
    transferValue,
    referenceIds,
    accessToken,
    filter,
    note,
  });
  if (createPaymentResult.status !== HttpStatus.ACCEPTED) {
    return createPaymentResult;
  }

  const paymentId = createPaymentResult.body.id;
  await waitForPaymentTransactionsToComplete({
    programId,
    paymentReferenceIds: referenceIds,
    accessToken,
    maxWaitTimeMs: 20_000,
    paymentId,
    completeStatuses: [TransactionStatusEnum.pendingApproval],
  });

  const startPaymentResult = await startPayment({
    programId,
    paymentId,
    accessToken,
  });

  // In error cases, return the error from starting the payment
  if (startPaymentResult.status !== HttpStatus.ACCEPTED) {
    return startPaymentResult;
  }
  // In success cases, we need the doPaymentResult to get the paymentId from
  return createPaymentResult;
}

export async function retryPayment({
  programId,
  paymentId,
  accessToken,
  referenceIds,
  filter,
  search,
}: {
  programId: number;
  paymentId: number;
  accessToken: string;
  referenceIds?: string[];
  filter?: Record<string, string>;
  search?: string;
}): Promise<request.Response> {
  const queryParams = {};
  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      queryParams[key] = value;
    }
  }
  if (search) {
    queryParams['search'] = search;
  }
  if (referenceIds && referenceIds.length > 0) {
    queryParams['filter.registrationReferenceId'] =
      `$in:${referenceIds.join(',')}`;
  }

  return await getServer()
    .post(`/programs/${programId}/payments/${paymentId}/retry`)
    .set('Cookie', [accessToken])
    .query(queryParams)
    .send();
}

export async function getPayments(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/payments`)
    .set('Cookie', [accessToken]);
}

export async function getProgramPaymentsStatus(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/payments/status`)
    .set('Cookie', [accessToken]);
}

export async function waitForPaymentNotInProgress({
  programId,
  accessToken,
  maxWaitTimeMs = 20000,
  pollIntervalMs = 500,
}: {
  programId: number;
  accessToken: string;
  maxWaitTimeMs?: number;
  pollIntervalMs?: number;
}): Promise<void> {
  const startTime = Date.now();
  while (true) {
    const result = (await getProgramPaymentsStatus(programId, accessToken))
      .body;
    if (result.inProgress === false) {
      return;
    }
    if (Date.now() - startTime > maxWaitTimeMs) {
      throw new Error(
        `Timeout: Payment still in progress after ${maxWaitTimeMs}ms`,
      );
    }
    await waitFor(pollIntervalMs);
  }
}

export async function getTransactionsByPaymentIdPaginated({
  programId,
  paymentId,
  accessToken,
  registrationReferenceId,
  page,
  limit,
  sort,
  filter,
  search,
}: {
  programId: number;
  paymentId: number;
  accessToken: string;
  registrationReferenceId?: string | null;
  page?: number;
  limit?: number;
  filter?: Record<string, string>;
  search?: string;
  sort?: { field: string; direction: 'ASC' | 'DESC' };
}): Promise<request.Response> {
  const queryParams: Record<string, string> = {};

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
  if (search) {
    queryParams['search'] = search;
  }
  if (registrationReferenceId) {
    // add filter
    queryParams['filter.registrationReferenceId'] = registrationReferenceId;
  }

  if (sort) {
    queryParams['sortBy'] = `${sort.field}:${sort.direction}`;
  }

  return await getServer()
    .get(`/programs/${programId}/payments/${paymentId}/transactions`)
    .set('Cookie', [accessToken])
    .query(queryParams);
}

export async function exportTransactionsAsBuffer({
  programId,
  accessToken,
  fromDate,
  toDate,
  paymentId,
}: {
  programId: number;
  accessToken: string;
  fromDate?: string;
  toDate?: string;
  paymentId?: number;
}): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/transactions`)
    .query({
      fromDate,
      toDate,
      paymentId,
      format: ExportFileFormat.xlsx,
    })
    .set('Cookie', [accessToken])
    .buffer()
    .parse((res, callback) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => callback(null, Buffer.concat(chunks)));
    });
}

export async function exportTransactionsByDateRangeJson({
  programId,
  accessToken,
  fromDate,
  toDate,
}: {
  programId: number;
  accessToken: string;
  fromDate?: string;
  toDate?: string;
}): Promise<Record<string, unknown>[]> {
  const response = await exportTransactionsAsBuffer({
    programId,
    accessToken,
    fromDate,
    toDate,
  });
  const workbook = XLSX.read(response.body, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

export async function getFspInstructions(
  programId: number,
  paymentId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/payments/${paymentId}/fsp-instructions`)
    .set('Cookie', [accessToken])
    .query({ format: 'json' });
}

export async function importFspReconciliationData({
  programId,
  paymentId,
  accessToken,
  reconciliationData,
}: {
  programId: number;
  paymentId: number;
  accessToken: string;
  reconciliationData: object[];
}): Promise<request.Response> {
  const csvString = jsonArrayToCsv(reconciliationData);
  const buffer = Buffer.from(csvString, 'utf-8');
  return await getServer()
    .post(`/programs/${programId}/payments/${paymentId}/excel-reconciliation`)
    .set('Cookie', [accessToken])
    .field('Content-Type', 'multipart/form-data')
    .attach('file', buffer, 'reconciliation.csv');
}

function jsonArrayToCsv(json: object[]): string {
  const columnHeaders = Array.from(
    new Set(json.flatMap((obj) => Object.keys(obj))),
  );
  const replacer = function (_key, value): string | number {
    return value === null ? '' : value;
  };
  const csv = json.map(function (row): string {
    return columnHeaders
      .map(function (fieldName): string {
        return JSON.stringify(row[fieldName], replacer);
      })
      .join(',');
  });
  csv.unshift(columnHeaders.join(',')); // add header column
  return csv.join('\r\n');
}

export async function exportList({
  programId,
  exportType,
  accessToken,
  options = {},
}: {
  programId: number;
  exportType: string;
  accessToken: string;
  options?: {
    fromDate?: string;
    toDate?: string;
    minPayment?: number;
    maxPayment?: number;
  };
}): Promise<request.Response> {
  const queryParams = {};
  for (const [key, value] of Object.entries(options)) {
    queryParams[key] = value;
  }
  return await getServer()
    .get(`/programs/${programId}/metrics/export-list/${exportType}`)
    .set('Cookie', [accessToken])
    .query(queryParams);
}

export async function waitForPaymentTransactionsToComplete({
  programId,
  paymentReferenceIds,
  accessToken,
  maxWaitTimeMs,
  completeStatuses = [TransactionStatusEnum.success],
  paymentId: paymentId = 1,
}: {
  programId: number;
  paymentReferenceIds: string[];
  accessToken: string;
  maxWaitTimeMs: number;
  completeStatuses?: string[];
  paymentId?: number;
}): Promise<void> {
  const startTime = Date.now();
  let allTransactionsComplete = false;

  while (Date.now() - startTime < maxWaitTimeMs && !allTransactionsComplete) {
    // Get payment transactions
    const paymentTransactions = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      accessToken,
      limit: 1000, // High number so we get all transactions in one go
    });
    const transactions = paymentTransactions.body.data;
    if (Array.isArray(transactions)) {
      // Check if all transactions have a "complete" status
      allTransactionsComplete = paymentReferenceIds.every((referenceId) => {
        const transaction = transactions.find(
          (txn) => txn.registrationReferenceId === referenceId,
        );
        return transaction && completeStatuses.includes(transaction.status);
      });
    }

    // If not all transactions are successful, wait for a short interval before checking again
    if (!allTransactionsComplete) {
      await waitFor(1_000); // Wait for 1 seconds (adjust as needed)
    }
  }

  if (!allTransactionsComplete) {
    throw new Error(`Timeout waiting for payment transactions to complete`);
  }
}

export async function waitForStatusUpdateToComplete(
  programId: number,
  referenceIds: string[],
  accessToken: string,
  maxWaitTimeMs: number,
  newRegistrationStatus: RegistrationStatusEnum,
): Promise<void> {
  const startTime = Date.now();
  let allStatusUpdatesSuccessful = false;

  while (
    Date.now() - startTime < maxWaitTimeMs &&
    !allStatusUpdatesSuccessful
  ) {
    // Get registrations
    const registrations = await getRegistrations({
      programId,
      accessToken,
    });

    // Check if all registrations have the new status
    allStatusUpdatesSuccessful = referenceIds.every((referenceId) => {
      const registration = registrations.body.data.find(
        (r) => r.referenceId === referenceId,
      );
      return registration && registration.status === newRegistrationStatus;
    });

    // If not all transactions are successful, wait for a short interval before checking again
    if (!allStatusUpdatesSuccessful) {
      await waitFor(1000); // Wait for 1 second (adjust as needed)
    }
  }

  if (!allStatusUpdatesSuccessful) {
    throw new Error(`Timeout waiting for status updates to complete`);
  }
}

export async function waitForMessagesToComplete({
  programId,
  referenceIds,
  accessToken,
  minimumNumberOfMessagesPerReferenceId = 1,
  expectedMessageAttribute,
}: {
  programId: number;
  referenceIds: string[];
  accessToken: string;
  minimumNumberOfMessagesPerReferenceId?: number;
  expectedMessageAttribute?: {
    key: keyof MessageActivity['attributes'];
    values: MessageActivity['attributes'][keyof MessageActivity['attributes']][];
  };
}): Promise<void> {
  const maxWaitTimeMs = 25_000;
  const startTime = Date.now();

  let referenceIdsWaitingForMessages = [...referenceIds];

  while (
    Date.now() - startTime < maxWaitTimeMs &&
    referenceIdsWaitingForMessages.length > 0
  ) {
    const messageHistories = await Promise.all(
      referenceIdsWaitingForMessages.map(async (referenceId) => {
        const response = await getMessageHistory(
          programId,
          referenceId,
          accessToken,
        );
        return { referenceId, messageHistory: response.body };
      }),
    );

    referenceIdsWaitingForMessages = expectedMessageAttribute
      ? filterByExpectedAttribute({
          messageHistories,
          expectedMessageAttribute,
        })
      : filterByMinimumMessages({
          messageHistories,
          minimumNumberOfMessages: minimumNumberOfMessagesPerReferenceId,
        });

    // To not overload the server and get 429
    await waitFor(100);
  }

  if (referenceIdsWaitingForMessages.length > 0) {
    if (IS_DEVELOPMENT) {
      for (const referenceId of referenceIdsWaitingForMessages) {
        const response = await getMessageHistory(
          programId,
          referenceId,
          accessToken,
        );
        console.log('Message History for ', referenceId);
        console.table(
          response.body.map(({ ...m }) => ({
            ...m,
            status: m.attributes.status,
          })),
        );
      }
    }
    throw new Error(`Timeout waiting for messages to be sent`);
  }
}

function filterByExpectedAttribute({
  messageHistories,
  expectedMessageAttribute,
}: {
  messageHistories: {
    referenceId: string;
    messageHistory: MessageActivity[];
  }[];
  expectedMessageAttribute: {
    key: keyof MessageActivity['attributes'];
    values: MessageActivity['attributes'][keyof MessageActivity['attributes']][];
  };
}): string[] {
  return messageHistories
    .filter(({ messageHistory }) => {
      const messagesWithValidStatus = messageHistory.filter((m) => {
        const validStatuses: MessageStatus[] = ['read', 'failed'];
        if (m.attributes.notificationType === 'sms') {
          validStatuses.push('sent');
        }
        return validStatuses.includes(m.attributes.status);
      });
      return !messagesWithValidStatus.some((m) => {
        return expectedMessageAttribute.values.includes(
          m.attributes[expectedMessageAttribute.key],
        );
      });
    })
    .map(({ referenceId }) => referenceId);
}

function filterByMinimumMessages({
  messageHistories,
  minimumNumberOfMessages,
}: {
  messageHistories: {
    referenceId: string;
    messageHistory: MessageActivity[];
  }[];
  minimumNumberOfMessages: number;
}): string[] {
  return messageHistories
    .filter(({ messageHistory }) => {
      const messagesWithValidStatus = messageHistory.filter((m) => {
        const validStatuses: MessageStatus[] = ['read', 'failed'];
        if (m.attributes.notificationType === 'sms') {
          validStatuses.push('sent');
        }
        return validStatuses.includes(m.attributes.status);
      });
      return messagesWithValidStatus.length < minimumNumberOfMessages;
    })
    .map(({ referenceId }) => referenceId);
}

export async function startCbeValidationProcess(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .put(`/programs/${programId}/fsps/commercial-bank-ethiopia/accounts`)
    .set('Cookie', [accessToken]);
}

export async function getCbeValidationReport(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/fsps/commercial-bank-ethiopia/accounts`)
    .set('Cookie', [accessToken]);
}

export async function startCooperativeBankOfOromiaValidationProcess(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .put(`/programs/${programId}/fsps/cooperative-bank-of-oromia/accounts`)
    .set('Cookie', [accessToken]);
}

export async function getCooperativeBankOfOromiaValidationReport(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/fsps/cooperative-bank-of-oromia/accounts`)
    .set('Cookie', [accessToken]);
}

export async function postNote(
  referenceId: string,
  text: string,
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/registrations/${referenceId}/notes`)
    .set('Cookie', [accessToken])
    .send({ text });
}

export async function postMessageTemplate(
  programId: number,
  body: CreateMessageTemplateDto,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/notifications/${programId}/message-templates`)
    .set('Cookie', [accessToken])
    .send(body);
}

export async function updateMessageTemplate({
  programId,
  type,
  language,
  body,
  accessToken,
}: {
  programId: number;
  type: string;
  language: RegistrationPreferredLanguage;
  body: UpdateTemplateBodyDto;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .patch(`/notifications/${programId}/message-templates/${type}/${language}`)
    .set('Cookie', [accessToken])
    .send(body);
}

export async function deleteMessageTemplate({
  programId,
  type,
  accessToken,
}: {
  programId: number;
  type: string;
  accessToken: string;
}): Promise<request.Response> {
  const url = `/notifications/${programId}/message-templates/${type}`;

  return await getServer().delete(url).set('Cookie', [accessToken]);
}

export async function getMessageTemplates(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/notifications/${programId}/message-templates`)
    .set('Cookie', [accessToken]);
}

export async function setAllProgramsRegistrationAttributesNonRequired(
  programId: number,
  accessToken: string,
) {
  const program = (await getProgram(programId, accessToken)).body;
  for (const attribute of program.programRegistrationAttributes) {
    await patchProgramRegistrationAttribute({
      programRegistrationAttributeName: attribute.name,
      programRegistrationAttribute: { isRequired: false },
      programId,
      accessToken,
    });
  }
}

export async function removeDeprecatedImageCodes({
  accessToken,
  mockCurrentDateIsoString,
}: {
  accessToken: string;
  mockCurrentDateIsoString?: string;
}): Promise<request.Response> {
  const body: Record<string, string> = {};
  if (mockCurrentDateIsoString) {
    body.mockCurrentDate = mockCurrentDateIsoString;
  }
  return await getServer()
    .delete('/cronjobs/fsps/intersolve-voucher/deprecated-image-codes')
    .set('Cookie', [accessToken])
    .send(body);
}

export async function getPaymentEvents({
  programId,
  paymentId,
  accessToken,
}: {
  programId: number;
  paymentId: number;
  accessToken: string;
}) {
  return await getServer()
    .get(`/programs/${programId}/payments/${paymentId}/events`)
    .set('Cookie', [accessToken]);
}

export async function getPaymentSummary({
  programId,
  paymentId,
  accessToken,
}: {
  programId: number;
  paymentId: number;
  accessToken: string;
}) {
  return await getServer()
    .get(`/programs/${programId}/payments/${paymentId}`)
    .set('Cookie', [accessToken]);
}

export async function getRegistrationEventsMonitoring({
  programId,
  accessToken,
  page,
  limit,
  sort,
  filter,
  search,
}: {
  programId: number;
  accessToken: string;
  page?: number;
  limit?: number;
  filter?: Record<string, string>;
  search?: string;
  sort?: { field: string; direction: 'ASC' | 'DESC' };
}): Promise<request.Response> {
  const queryParams: Record<string, string> = {};

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
  if (search) {
    queryParams['search'] = search;
  }

  if (sort) {
    queryParams['sortBy'] = `${sort.field}:${sort.direction}`;
  }

  return await getServer()
    .get(`/programs/${programId}/registration-events/monitoring`)
    .set('Cookie', [accessToken])
    .query(queryParams);
}
