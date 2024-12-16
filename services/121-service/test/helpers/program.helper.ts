import * as request from 'supertest';

import { DEBUG } from '@121-service/src/config';
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
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  getMessageHistory,
  getRegistrations,
} from '@121-service/test/helpers/registration.helper';
import { getServer } from '@121-service/test/helpers/utility.helper';

enum MessageStatus {
  sent = 'sent',
  delivered = 'delivered',
  failed = 'failed',
  read = 'read',
}

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

export async function unpublishProgram(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .patch(`/programs/${programId}`)
    .set('Cookie', [accessToken])
    .send({
      published: false,
    });
}

export async function doPayment(
  programId: number,
  paymentNr: number,
  amount: number,
  referenceIds: string[],
  accessToken: string,
  filter: Record<string, string> = {},
): Promise<request.Response> {
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
      payment: paymentNr,
      amount,
    });
}

export async function doPaymentForAllPAs({
  programId,
  paymentNr,
  amount,
  accessToken,
}: {
  programId: number;
  paymentNr: number;
  amount: number;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/payments`)
    .set('Cookie', [accessToken])
    .send({
      payment: paymentNr,
      amount,
    });
}

export async function retryPayment(
  programId: number,
  paymentNr: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .patch(`/programs/${programId}/payments`)
    .set('Cookie', [accessToken])
    .send({
      payment: paymentNr,
    });
}

export async function getProgramPaymentsStatus(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/payments/status`)
    .set('Cookie', [accessToken]);
}

export async function getTransactions(
  programId: number,
  paymentNr: number,
  referenceId: string | null,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/transactions`)
    .set('Cookie', [accessToken])
    .query({ payment: paymentNr, referenceId });
}

export async function getFspInstructions(
  programId: number,
  paymentNr: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/payments/${paymentNr}/fsp-instructions`)
    .set('Cookie', [accessToken])
    .query({ format: 'json' });
}

export async function importFspReconciliationData(
  programId: number,
  paymentNr: number,
  accessToken: string,
  reconciliationData: object[],
): Promise<request.Response> {
  const csvString = jsonArrayToCsv(reconciliationData);
  const buffer = Buffer.from(csvString, 'utf-8');
  return await getServer()
    .post(`/programs/${programId}/payments/${paymentNr}/fsp-reconciliation`)
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

export async function waitForPaymentTransactionsToComplete(
  programId: number,
  paymentReferenceIds: string[],
  accessToken: string,
  maxWaitTimeMs: number,
  completeStatusses: string[] = [TransactionStatusEnum.success],
  payment = 1,
): Promise<void> {
  const startTime = Date.now();
  let allTransactionsComplete = false;

  while (Date.now() - startTime < maxWaitTimeMs && !allTransactionsComplete) {
    // Get payment transactions
    const paymentTransactions = await getTransactions(
      programId,
      payment,
      null,
      accessToken,
    );

    // Check if all transactions have a "complete" status
    allTransactionsComplete = paymentReferenceIds.every((referenceId) => {
      const transaction = paymentTransactions.body.find(
        (txn) => txn.referenceId === referenceId,
      );
      return transaction && completeStatusses.includes(transaction.status);
    });

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
  minimumNumberOfMessages = 1,
}: {
  programId: number;
  referenceIds: string[];
  accessToken: string;
  minimumNumberOfMessages?: number;
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
        return { referenceId, messageHistory: response.body as any[] };
      }),
    );

    const messageHistoriesWithoutMinimumMessages = messageHistories.filter(
      ({ messageHistory }) => {
        const messagesWithValidStatus = messageHistory.filter((m) => {
          const validStatuses = [MessageStatus.read, MessageStatus.failed];

          if (m.type === 'sms') {
            validStatuses.push(MessageStatus.sent);
          }

          // wait for messages actually being on a final status, given that's also something we check for in the test
          return validStatuses.includes(m.status);
        });

        return messagesWithValidStatus.length < minimumNumberOfMessages;
      },
    );

    referenceIdsWaitingForMessages = messageHistoriesWithoutMinimumMessages.map(
      ({ referenceId }) => referenceId,
    );
    // To not overload the server and get 429
    await waitFor(100);
  }

  if (referenceIdsWaitingForMessages.length > 0) {
    if (DEBUG) {
      console.log('Reference Ids: ', referenceIds);
      console.log(
        'Reference Ids Waiting for Messages: ',
        referenceIdsWaitingForMessages,
      );
      console.log('Expected number of messages: ', minimumNumberOfMessages);
      for (const referenceId of referenceIdsWaitingForMessages) {
        const response = await getMessageHistory(
          programId,
          referenceId,
          accessToken,
        );
        console.log('Message History for ', referenceId);
        // remove body to make for better console output
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        console.table(response.body.map(({ body, ...m }) => ({ ...m })));
      }
    }
    throw new Error(`Timeout waiting for messages to be sent`);
  }
}

export async function startCbeValidationProcess(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .post(
      `/programs/${programId}/financial-service-providers/commercial-bank-ethiopia/account-enquiries/validation`,
    )
    .set('Cookie', [accessToken]);
}

export async function getCbeValidationReport(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(
      `/programs/${programId}/financial-service-providers/commercial-bank-ethiopia/account-enquiries`,
    )
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

export async function getNotes(
  referenceId: string,
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/registrations/${referenceId}/notes`)
    .set('Cookie', [accessToken]);
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

export async function updateMessageTemplate(
  programId: number,
  type: string,
  language: LanguageEnum,
  body: UpdateTemplateBodyDto,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .patch(`/notifications/${programId}/message-templates/${type}/${language}`)
    .set('Cookie', [accessToken])
    .send(body);
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
