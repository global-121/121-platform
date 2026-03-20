import * as request from 'supertest';

import { env } from '@121-service/src/env';
import { CreateKoboDto } from '@121-service/src/kobo/dtos/create-kobo.dto';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { postProgram } from '@121-service/test/helpers/program.helper';
import { postProgramFspConfiguration } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  getMockServer,
  getServer,
} from '@121-service/test/helpers/utility.helper';

export async function postKoboToProgram({
  programId,
  body,
  accessToken,
  dryRun = false,
}: {
  programId: number;
  body: CreateKoboDto;
  accessToken: string;
  dryRun: boolean;
}): Promise<request.Response> {
  const queryParams = { dryRun };

  return await getServer()
    .put(`/programs/${programId}/kobo`)
    .set('Cookie', [accessToken])
    .query(queryParams)
    .send(body);
}

export async function getKoboFromProgram({
  programId,
  accessToken,
}: {
  programId: number;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/kobo`)
    .set('Cookie', [accessToken]);
}

export async function triggerKoboSubmission({
  assetUid,
  submissionUuid,
  koboVersion,
}: {
  assetUid: string;
  submissionUuid: string;
  koboVersion: string;
}): Promise<request.Response> {
  return await getMockServer()
    .post(`/kobo/api/v2/assets/${assetUid}/trigger-submission`)
    .send({ submissionUuid, koboVersion });
}

export async function setupProgramWithKoboIntegration({
  assetUid,
  program,
  fspConfiguration,
  accessToken,
}: {
  assetUid: string;
  program: CreateProgramDto;
  fspConfiguration: CreateProgramFspConfigurationDto;
  accessToken: string;
}): Promise<{ programId: number; assetUid: string }> {
  const createProgramResponse = await postProgram(program, accessToken);
  const programId = createProgramResponse.body.id;

  await postProgramFspConfiguration({
    programId,
    body: fspConfiguration,
    accessToken,
  });

  const koboLinkDto: CreateKoboDto = {
    token: 'mock-token',
    assetUid,
    url: `${env.MOCK_SERVICE_URL}/api/kobo`,
  };

  await postKoboToProgram({
    programId,
    body: koboLinkDto,
    accessToken,
    dryRun: false,
  });

  return { programId, assetUid };
}
