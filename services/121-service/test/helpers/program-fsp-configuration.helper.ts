import * as request from 'supertest';

import { FspConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';
import { ProgramFspConfigurationPropertyResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-property-response.dto';
import { ProgramFspConfigurationResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-response.dto';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration-property.dto';
import { getServer } from '@121-service/test/helpers/utility.helper';

export async function postProgramFspConfiguration({
  programId,
  body,
  accessToken,
}: {
  programId: number;
  body: CreateProgramFspConfigurationDto;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/fsp-configurations`)
    .set('Cookie', [accessToken])
    .send(body);
}

export async function patchProgramFspConfiguration({
  programId,
  name,
  body,
  accessToken,
}: {
  programId: number;
  name: string;
  body: UpdateProgramFspConfigurationDto;
  accessToken: string;
}): Promise<
  Omit<request.Response, 'body'> & {
    body: ProgramFspConfigurationResponseDto;
  }
> {
  return await getServer()
    .patch(`/programs/${programId}/fsp-configurations/${name}`)
    .set('Cookie', [accessToken])
    .send(body);
}

export async function getProgramFspConfigurations({
  programId,
  accessToken,
}: {
  programId: number;
  accessToken: string;
}): Promise<
  Omit<request.Response, 'body'> & {
    body: ProgramFspConfigurationResponseDto[];
  }
> {
  return await getServer()
    .get(`/programs/${programId}/fsp-configurations`)
    .set('Cookie', [accessToken]);
}

export async function deleteProgramFspConfiguration({
  programId,
  name,
  accessToken,
}: {
  programId: number;
  name: string;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .delete(`/programs/${programId}/fsp-configurations/${name}`)
    .set('Cookie', [accessToken]);
}

export async function postProgramFspConfigurationProperties({
  programId,
  properties,
  accessToken,
  name,
}: {
  programId: number;
  properties: CreateProgramFspConfigurationPropertyDto[];
  name: string;
  accessToken: string;
}): Promise<
  Omit<request.Response, 'body'> & {
    body: ProgramFspConfigurationPropertyResponseDto[];
  }
> {
  return await getServer()
    .post(`/programs/${programId}/fsp-configurations/${name}/properties`)
    .set('Cookie', [accessToken])
    .send(properties);
}

export async function patchProgramFspConfigurationProperty({
  programId,
  configName,
  propertyName,
  body,
  accessToken,
}: {
  programId: number;
  configName: string;
  propertyName: FspConfigurationProperties;
  body: UpdateProgramFspConfigurationPropertyDto;
  accessToken: string;
}): Promise<
  Omit<request.Response, 'body'> & {
    body: ProgramFspConfigurationPropertyResponseDto;
  }
> {
  return await getServer()
    .patch(
      `/programs/${programId}/fsp-configurations/${configName}/properties/${propertyName}`,
    )
    .set('Cookie', [accessToken])
    .send(body);
}

export async function deleteProgramFspConfigurationProperty({
  programId,
  configName,
  propertyName,
  accessToken,
}: {
  programId: number;
  configName: string;
  propertyName: FspConfigurationProperties;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .delete(
      `/programs/${programId}/fsp-configurations/${configName}/properties/${propertyName}`,
    )
    .set('Cookie', [accessToken]);
}

export async function getFspProgramProperties({
  programId,
  configName,
  accessToken,
}: {
  programId: number;
  configName: string;
  accessToken: string;
}): Promise<
  Omit<request.Response, 'body'> & {
    body: ProgramFspConfigurationPropertyResponseDto[];
  }
> {
  return await getServer()
    .get(`/programs/${programId}/fsp-configurations/${configName}/properties`)
    .set('Cookie', [accessToken]);
}
