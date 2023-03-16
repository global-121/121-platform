import * as request from 'supertest';

export function getHostname(): string {
  return 'http://localhost:3000/api';
}

export function getServer(): request.SuperAgentTest {
  return request.agent(getHostname());
}

export async function resetDB(): Promise<void> {
  const server = getServer();
  const resetBody = {
    secret: process.env.RESET_SECRET,
  };
  await server
    .post('/scripts/reset')
    .query({ script: 'nlrc-multiple' })
    .send(resetBody);
}

export async function login(): Promise<void> {
  const body = {
    username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    password: process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  };
  const server = getServer();
  await server.post(`/user/login`).send(body).expect(201);
}

export async function publishProgram(programId: number): Promise<void> {
  const server = getServer();
  await server
    .post(`/programs/${programId}/change-phase`)
    .send({ newPhase: 'registrationValidation' })
    .expect(200);
}

export async function importRegistrations(
  programId: number,
  registrations: object[],
): Promise<void> {
  const server = getServer();
  await server
    .post(`/programs/${programId}/registrations/import-registrations-cypress`)
    .send(registrations)
    .expect(200);
}
