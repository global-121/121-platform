import * as request from 'supertest';
import { getServer } from './utility.helper';

export function importRegistrations(
  programId: number,
  registrations: object[],
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .post(`/programs/${programId}/registrations/import?validation=false`)
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

export function getRegistrations(
  programId: number,
  attributes: string[],
  accessToken: string,
): Promise<request.Response> {
  const queryParams = {
    personalData: true,
  };
  if (attributes) {
    queryParams['attributes'] = attributes.join(',');
  }
  return getServer()
    .get(`/programs/${programId}/registrations`)
    .query(queryParams)
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
