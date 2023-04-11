import * as request from 'supertest';
import { getServer } from './utility.helper';

export async function importRegistrations(
  programId: number,
  registrations: object[],
  access_token: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/registrations/import-registrations-cypress`)
    .set('Cookie', [access_token])
    .send(registrations);
}

export async function deleteRegistrations(
  programId: number,
  registrationReferenceIds: { referenceIds: string[] },
): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/registrations/delete`)
    .send(registrationReferenceIds);
}

export function getRegistration(
  referenceId: string,
): Promise<request.Response> {
  return getServer().get(`/registrations/get/${referenceId}`);
}

export async function changePaStatus(
  programId: number,
  registrations: string[],
  action: string,
  access_token: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/registrations/${action}`)
    .set('Cookie', [access_token])
    .send({
      referenceIds: registrations,
      message: null,
    });
}
