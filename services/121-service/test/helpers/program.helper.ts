import * as request from 'supertest';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { getServer } from './utility.helper';

export async function publishProgram(programId: number): Promise<void> {
  const server = getServer();
  await server
    .post(`/programs/${programId}/change-phase`)
    .send({ newPhase: 'registrationValidation' });
}

export async function changePhase(
  programId: number,
  newPhase: ProgramPhase,
  access_token: string,
): Promise<request.Response> {
  const server = getServer();
  return await server
    .post(`/programs/${programId}/change-phase`)
    .set('Cookie', [access_token])
    .send({ newPhase: newPhase });
}

export async function doPayment(
  programId: number,
  paymentNr: number,
  amount: number,
  referenceIds: string[],
  access_token: string,
): Promise<request.Response> {
  const server = getServer();
  return await server
    .post(`/programs/${programId}/payments`)
    .set('Cookie', [access_token])
    .send({
      payment: paymentNr,
      amount: amount,
      referenceIds: { referenceIds: referenceIds },
    });
}

export async function getTransactions(
  programId: number,
  paymentNr: number,
  referenceId: string,
  access_token: string,
): Promise<request.Response> {
  const server = getServer();
  return await server
    .get(`/programs/${programId}/payments/transactions`)
    .set('Cookie', [access_token])
    .query({ minPayment: paymentNr, referenceId: referenceId });
}
