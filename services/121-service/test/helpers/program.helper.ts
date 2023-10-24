import * as request from 'supertest';
import { CreateProgramCustomAttributeDto } from '../../src/programs/dto/create-program-custom-attribute.dto';
import { CreateProgramQuestionDto } from '../../src/programs/dto/program-question.dto';
import { MessageStatus } from '../../src/registration/enum/last-message-status';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { CreateProgramDto } from './../../src/programs/dto/create-program.dto';
import { getMessageHistory, getRegistrations } from './registration.helper';
import { getServer, waitFor } from './utility.helper';

export async function postProgram(
  program: CreateProgramDto,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/programs/`)
    .set('Cookie', [accessToken])
    .send(program);
}

export async function getProgram(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}`)
    .query({ formatCreateProgramDto: true })
    .set('Cookie', [accessToken]);
}

export async function postProgramQuestion(
  programQuestion: CreateProgramQuestionDto,
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/program-questions`)
    .set('Cookie', [accessToken])
    .send(programQuestion);
}

export async function postCustomAttribute(
  customAttribute: CreateProgramCustomAttributeDto,
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/custom-attributes`)
    .set('Cookie', [accessToken])
    .send(customAttribute);
}

export async function publishProgram(
  programId: number,
): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/change-phase`)
    .send({ newPhase: 'registrationValidation' });
}

export async function changePhase(
  programId: number,
  newPhase: ProgramPhase,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/change-phase`)
    .set('Cookie', [accessToken])
    .send({ newPhase: newPhase });
}

export async function doPayment(
  programId: number,
  paymentNr: number,
  amount: number,
  referenceIds: string[],
  accessToken: string,
  filter: { [key: string]: string } = {},
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
    .send({
      payment: paymentNr,
      amount: amount,
    })
    .query(queryParams);
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

export async function getTransactions(
  programId: number,
  paymentNr: number,
  referenceId: string,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/payments/transactions`)
    .set('Cookie', [accessToken])
    .query({ minPayment: paymentNr, referenceId: referenceId });
}

export async function exportList(
  programId: number,
  exportType: string,
  accessToken: string,
  fromDate?: string,
  toDate?: string,
): Promise<request.Response> {
  const queryParams = {};
  if (fromDate) {
    queryParams['fromDate'] = fromDate;
  }
  if (toDate) {
    queryParams['toDate'] = toDate;
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
  completeStatusses: string[] = ['success'],
  payment = 1,
): Promise<void> {
  const startTime = Date.now();
  let allTransactionsSuccessful = false;

  while (Date.now() - startTime < maxWaitTimeMs && !allTransactionsSuccessful) {
    // Get payment transactions
    const paymentTransactions = await getTransactions(
      programId,
      payment,
      null,
      accessToken,
    );

    // Check if all transactions have a status of "success"
    allTransactionsSuccessful = paymentReferenceIds.every((referenceId) => {
      const transaction = paymentTransactions.body.find(
        (txn) => txn.referenceId === referenceId,
      );
      return transaction && completeStatusses.includes(transaction.status);
    });

    // If not all transactions are successful, wait for a short interval before checking again
    if (!allTransactionsSuccessful) {
      await waitFor(1000); // Wait for 1 second (adjust as needed)
    }
  }

  if (!allTransactionsSuccessful) {
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
    const registrations = await getRegistrations(programId, null, accessToken);

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

export async function waitForMessagesToComplete(
  programId: number,
  referenceIds: string[],
  accessToken: string,
  maxWaitTimeMs: number,
): Promise<void> {
  const startTime = Date.now();
  let allMessageUpdatesSuccessful = false;

  while (
    Date.now() - startTime < maxWaitTimeMs &&
    !allMessageUpdatesSuccessful
  ) {
    // Get message histories
    const messageHistories = [];
    for (const referenceId of referenceIds) {
      const response = await getMessageHistory(
        programId,
        referenceId,
        accessToken,
      );
      const messages = response.body;
      messageHistories.push(messages);
    }

    // Check if all message histories are longer than 0
    const amountOfRegistrationWithMessages = messageHistories.filter(
      (messageHistory) =>
        messageHistory.filter(
          (m) =>
            [
              MessageStatus.read,
              MessageStatus.delivered,
              MessageStatus.failed,
            ].includes(m.status), // wait for messages actually being on a final status, given that's also something we check for in the test
        ).length > 0,
    ).length;
    allMessageUpdatesSuccessful =
      amountOfRegistrationWithMessages === referenceIds.length;

    // If not all PAs received a message, wait for a short interval before checking again
    if (!allMessageUpdatesSuccessful) {
      await waitFor(1000); // Wait for 1 second (adjust as needed)
    }
  }

  if (!allMessageUpdatesSuccessful) {
    throw new Error(`Timeout waiting for messages to be sent`);
  }
}

export async function startCbeValidationProcess(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(
      `/programs/${programId}/financial-service-providers/commercial-bank-ethiopia/account-enquiries/validate`,
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
    .post(`/programs/${programId}/note`)
    .set('Cookie', [accessToken])
    .send({ referenceId: referenceId, text: text });
}

export async function getNotes(
  referenceId: string,
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/note/${referenceId}`)
    .set('Cookie', [accessToken]);
}
