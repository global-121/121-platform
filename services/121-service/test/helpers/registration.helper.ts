import * as request from 'supertest';
import { getServer } from './utility.helper';

export function importRegistrations(
  programId: number,
  registrations: object[],
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .post(`/programs/${programId}/registrations/import-registrations-cypress`)
    .set('Cookie', [accessToken])
    .send(registrations);
}

export function deleteRegistrations(
  programId: number,
  registrationReferenceIds: { referenceIds: string[] },
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .post(`/programs/${programId}/registrations/delete`)
    .set('Cookie', [accessToken])
    .send(registrationReferenceIds);
}

export function getRegistration(
  referenceId: string,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .get(`/registrations/get/${referenceId}`)
    .set('Cookie', [accessToken]);
}

export function changePaStatus(
  programId: number,
  registrations: string[],
  action: string,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .post(`/programs/${programId}/registrations/${action}`)
    .set('Cookie', [accessToken])
    .send({
      referenceIds: registrations,
      message: null,
    });
}
