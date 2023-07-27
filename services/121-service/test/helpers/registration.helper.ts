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
    .delete(`/programs/${programId}/registrations`)
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

export function updatePa(
  programId: number,
  referenceId: string,
  attribute: string,
  value: string,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .post(`/programs/${programId}/registrations/attribute`)
    .set('Cookie', [accessToken])
    .send({
      referenceId: referenceId,
      attribute: attribute,
      value: value,
    });
}

export function getVisaWalletsAndDetails(
  programId: number,
  referenceId: string,
  accessToken: string,
): Promise<request.Response> {
  const queryParams = {
    referenceId: referenceId,
  };
  return getServer()
    .get(`/programs/${programId}/fsp-integration/intersolve-visa/wallets`)
    .query(queryParams)
    .set('Cookie', [accessToken]);
}

export function issueNewVisaCard(
  programId: number,
  referenceId: string,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .put(
      `/programs/${programId}/fsp-integration/intersolve-visa/customers/${referenceId}/wallets`,
    )
    .set('Cookie', [accessToken]);
}
