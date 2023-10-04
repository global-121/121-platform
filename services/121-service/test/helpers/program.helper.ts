import * as request from 'supertest';
import { CreateProgramCustomAttributeDto } from '../../src/programs/dto/create-program-custom-attribute.dto';
import { CreateProgramQuestionDto } from '../../src/programs/dto/program-question.dto';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { CreateProgramDto } from './../../src/programs/dto/create-program.dto';
import { getRegistrations } from './registration.helper';
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
): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/payments`)
    .set('Cookie', [accessToken])
    .send({
      payment: paymentNr,
      amount: amount,
      referenceIds: { referenceIds: referenceIds },
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
