import * as request from 'supertest';
import { MessageStatus } from 'twilio/lib/rest/api/v2010/account/message';
import * as XLSX from 'xlsx';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { ExportFileFormat } from '@121-service/src/metrics/enum/export-file-format.enum';
import {
  CreateMessageTemplateDto,
  UpdateTemplateBodyDto,
} from '@121-service/src/notifications/message-template/dto/message-template.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { CreateProjectDto } from '@121-service/src/projects/dto/create-project.dto';
import {
  ProjectRegistrationAttributeDto,
  UpdateProjectRegistrationAttributeDto,
} from '@121-service/src/projects/dto/project-registration-attribute.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SecretDto } from '@121-service/src/scripts/scripts.controller';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  getMessageHistory,
  getRegistrations,
} from '@121-service/test/helpers/registration.helper';
import { getServer } from '@121-service/test/helpers/utility.helper';

export async function postProject(
  project: CreateProjectDto,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/projects`)
    .set('Cookie', [accessToken])
    .send(project);
}

export async function patchProject(
  projectId: number,
  projectUpdate: object,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .patch(`/projects/${projectId}`)
    .set('Cookie', [accessToken])
    .send(projectUpdate);
}

export async function deleteProject(
  projectId: number,
  accessToken: string,
  secretDto: SecretDto,
): Promise<request.Response> {
  return await getServer()
    .delete(`/projects/${projectId}`)
    .set('Cookie', [accessToken])
    .send(secretDto);
}

export async function getProject(
  projectId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/projects/${projectId}`)
    .set('Cookie', [accessToken]);
}

export async function postProjectRegistrationAttribute(
  projectRegistrationAttribute: ProjectRegistrationAttributeDto,
  projectId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/projects/${projectId}/registration-attributes`)
    .set('Cookie', [accessToken])
    .send(projectRegistrationAttribute);
}

export async function patchProjectRegistrationAttribute({
  projectRegistrationAttributeName,
  projectRegistrationAttribute,
  projectId,
  accessToken,
}: {
  projectRegistrationAttributeName: string;
  projectRegistrationAttribute: UpdateProjectRegistrationAttributeDto;
  projectId: number;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .patch(
      `/projects/${projectId}/registration-attributes/${projectRegistrationAttributeName}`,
    )
    .set('Cookie', [accessToken])
    .send(projectRegistrationAttribute);
}

export async function unpublishProject(
  projectId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .patch(`/projects/${projectId}`)
    .set('Cookie', [accessToken])
    .send({
      published: false,
    });
}

export async function doPayment({
  projectId,
  amount,
  referenceIds,
  accessToken,
  filter = {},
  note,
}: {
  projectId: number;
  amount: number;
  referenceIds: string[];
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
    .post(`/projects/${projectId}/payments`)
    .set('Cookie', [accessToken])
    .query(queryParams)
    .send({
      amount,
      note,
    });
}

export async function retryPayment({
  projectId,
  paymentId,
  accessToken,
}: {
  projectId: number;
  paymentId: number;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .patch(`/projects/${projectId}/payments`)
    .set('Cookie', [accessToken])
    .send({
      paymentId,
    });
}

export async function getPayments(
  projectId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/projects/${projectId}/payments`)
    .set('Cookie', [accessToken]);
}

export async function getProjectPaymentsStatus(
  projectId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/projects/${projectId}/payments/status`)
    .set('Cookie', [accessToken]);
}

export async function getTransactions({
  projectId,
  paymentId,
  registrationReferenceId,
  accessToken,
}: {
  projectId: number;
  paymentId: number;
  registrationReferenceId: string | null;
  accessToken: string;
}): Promise<request.Response> {
  const response = await getServer()
    .get(`/projects/${projectId}/payments/${paymentId}/transactions`)
    .set('Cookie', [accessToken]);
  if (
    registrationReferenceId &&
    response.body &&
    Array.isArray(response.body)
  ) {
    response.body = response.body.filter(
      (t) => t.registrationReferenceId === registrationReferenceId,
    );
  }
  return response;
}

export async function exportTransactions({
  projectId,
  accessToken,
  fromDate,
  toDate,
  paymentId,
}: {
  projectId: number;
  accessToken: string;
  fromDate?: string;
  toDate?: string;
  paymentId?: number;
}): Promise<request.Response> {
  return await getServer()
    .get(`/projects/${projectId}/transactions`)
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
  projectId,
  accessToken,
  fromDate,
  toDate,
}: {
  projectId: number;
  accessToken: string;
  fromDate?: string;
  toDate?: string;
}): Promise<Record<string, unknown>[]> {
  const response = await exportTransactions({
    projectId,
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
  projectId: number,
  paymentId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/projects/${projectId}/payments/${paymentId}/fsp-instructions`)
    .set('Cookie', [accessToken])
    .query({ format: 'json' });
}

export async function importFspReconciliationData(
  projectId: number,
  paymentId: number,
  accessToken: string,
  reconciliationData: object[],
): Promise<request.Response> {
  const csvString = jsonArrayToCsv(reconciliationData);
  const buffer = Buffer.from(csvString, 'utf-8');
  return await getServer()
    .post(`/projects/${projectId}/payments/${paymentId}/excel-reconciliation`)
    .set('Cookie', [accessToken])
    .field('Content-Type', 'multipart/form-data')
    .attach('file', buffer, 'reconciliation.csv');
}

function jsonArrayToCsv(json: object[]): string {
  const fields = Object.keys(json[0]);
  const replacer = function (_key, value): string | number {
    return value === null ? '' : value;
  };
  const csv = json.map(function (row): string {
    return fields
      .map(function (fieldName): string {
        return JSON.stringify(row[fieldName], replacer);
      })
      .join(',');
  });
  csv.unshift(fields.join(',')); // add header column
  return csv.join('\r\n');
}

export async function exportList({
  projectId,
  exportType,
  accessToken,
  options = {},
}: {
  projectId: number;
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
    .get(`/projects/${projectId}/metrics/export-list/${exportType}`)
    .set('Cookie', [accessToken])
    .query(queryParams);
}

export async function waitForPaymentTransactionsToComplete({
  projectId,
  paymentReferenceIds,
  accessToken,
  maxWaitTimeMs,
  completeStatusses = [TransactionStatusEnum.success],
  paymentId: paymentId = 1,
}: {
  projectId: number;
  paymentReferenceIds: string[];
  accessToken: string;
  maxWaitTimeMs: number;
  completeStatusses?: string[];
  paymentId?: number;
}): Promise<void> {
  const startTime = Date.now();
  let allTransactionsComplete = false;

  while (Date.now() - startTime < maxWaitTimeMs && !allTransactionsComplete) {
    // Get payment transactions
    const paymentTransactions = await getTransactions({
      projectId,
      paymentId,
      registrationReferenceId: null,
      accessToken,
    });
    if (Array.isArray(paymentTransactions?.body)) {
      // Check if all transactions have a "complete" status
      allTransactionsComplete = paymentReferenceIds.every((referenceId) => {
        const transaction = paymentTransactions.body.find(
          (txn) => txn.registrationReferenceId === referenceId,
        );
        return transaction && completeStatusses.includes(transaction.status);
      });
    }

    // If not all transactions are successful, wait for a short interval before checking again
    if (!allTransactionsComplete) {
      await waitFor(1_000); // Wait for 1 second (adjust as needed)
    }
  }

  if (!allTransactionsComplete) {
    throw new Error(`Timeout waiting for payment transactions to complete`);
  }
}

export async function waitForStatusUpdateToComplete(
  projectId: number,
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
      projectId,
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
  projectId,
  referenceIds,
  accessToken,
  minimumNumberOfMessagesPerReferenceId = 1,
}: {
  projectId: number;
  referenceIds: string[];
  accessToken: string;
  minimumNumberOfMessagesPerReferenceId?: number;
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
          projectId,
          referenceId,
          accessToken,
        );
        return { referenceId, messageHistory: response.body };
      }),
    );

    const messageHistoriesWithoutMinimumMessages = messageHistories.filter(
      ({ messageHistory }) => {
        const messagesWithValidStatus = messageHistory.filter((m) => {
          const validStatuses: MessageStatus[] = ['read', 'failed'];

          if (m.attributes.notificationType === 'sms') {
            validStatuses.push('sent');
          }

          // wait for messages actually being on a final status, given that's also something we check for in the test
          return validStatuses.includes(m.attributes.status);
        });

        return (
          messagesWithValidStatus.length < minimumNumberOfMessagesPerReferenceId
        );
      },
    );

    referenceIdsWaitingForMessages = messageHistoriesWithoutMinimumMessages.map(
      ({ referenceId }) => referenceId,
    );
    // To not overload the server and get 429
    await waitFor(100);
  }

  if (referenceIdsWaitingForMessages.length > 0) {
    if (IS_DEVELOPMENT) {
      console.log('Reference Ids: ', referenceIds);
      console.log(
        'Reference Ids Waiting for Messages: ',
        referenceIdsWaitingForMessages,
      );
      console.log(
        'Expected number of messages: ',
        minimumNumberOfMessagesPerReferenceId,
      );
      for (const referenceId of referenceIdsWaitingForMessages) {
        const response = await getMessageHistory(
          projectId,
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

export async function startCbeValidationProcess(
  projectId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .put(
      `/projects/${projectId}/fsps/commercial-bank-ethiopia/account-enquiries`,
    )
    .set('Cookie', [accessToken]);
}

export async function getCbeValidationReport(
  projectId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(
      `/projects/${projectId}/fsps/commercial-bank-ethiopia/account-enquiries`,
    )
    .set('Cookie', [accessToken]);
}

export async function postNote(
  referenceId: string,
  text: string,
  projectId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/projects/${projectId}/registrations/${referenceId}/notes`)
    .set('Cookie', [accessToken])
    .send({ text });
}

export async function postMessageTemplate(
  projectId: number,
  body: CreateMessageTemplateDto,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/notifications/${projectId}/message-templates`)
    .set('Cookie', [accessToken])
    .send(body);
}

export async function updateMessageTemplate({
  projectId,
  type,
  language,
  body,
  accessToken,
}: {
  projectId: number;
  type: string;
  language: LanguageEnum;
  body: UpdateTemplateBodyDto;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .patch(`/notifications/${projectId}/message-templates/${type}/${language}`)
    .set('Cookie', [accessToken])
    .send(body);
}

export async function deleteMessageTemplate({
  projectId,
  type,
  accessToken,
}: {
  projectId: number;
  type: string;
  accessToken: string;
}): Promise<request.Response> {
  const url = `/notifications/${projectId}/message-templates/${type}`;

  return await getServer().delete(url).set('Cookie', [accessToken]);
}

export async function getMessageTemplates(
  projectId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/notifications/${projectId}/message-templates`)
    .set('Cookie', [accessToken]);
}

export async function setAllProjectsRegistrationAttributesNonRequired(
  projectId: number,
  accessToken: string,
) {
  const project = (await getProject(projectId, accessToken)).body;
  for (const attribute of project.projectRegistrationAttributes) {
    await patchProjectRegistrationAttribute({
      projectRegistrationAttributeName: attribute.name,
      projectRegistrationAttribute: { isRequired: false },
      projectId,
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
  projectId,
  paymentId,
  accessToken,
}: {
  projectId: number;
  paymentId: number;
  accessToken: string;
}) {
  return await getServer()
    .get(`/projects/${projectId}/payments/${paymentId}/events`)
    .set('Cookie', [accessToken]);
}
