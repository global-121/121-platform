import * as request from 'supertest';

import { FinancialServiceProviderConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';
import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration.dto';
import { CreateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration-property.dto';
import { ProgramFinancialServiceProviderConfigurationPropertyResponseDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-property-response.dto';
import { ProgramFinancialServiceProviderConfigurationResponseDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-response.dto';
import { UpdateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/update-program-financial-service-provider-configuration.dto';
import { UpdateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/update-program-financial-service-provider-configuration-property.dto';
import { getServer } from '@121-service/test/helpers/utility.helper';

export async function postProgramFinancialServiceProviderConfiguration({
  programId,
  body,
  accessToken,
}: {
  programId: number;
  body: CreateProgramFinancialServiceProviderConfigurationDto;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/financial-service-provider-configurations`)
    .set('Cookie', [accessToken])
    .send(body);
}

export async function patchProgramFinancialServiceProviderConfiguration({
  programId,
  name,
  body,
  accessToken,
}: {
  programId: number;
  name: string;
  body: UpdateProgramFinancialServiceProviderConfigurationDto;
  accessToken: string;
}): Promise<
  Omit<request.Response, 'body'> & {
    body: ProgramFinancialServiceProviderConfigurationResponseDto;
  }
> {
  return await getServer()
    .patch(
      `/programs/${programId}/financial-service-provider-configurations/${name}`,
    )
    .set('Cookie', [accessToken])
    .send(body);
}

export async function getProgramFinancialServiceProviderConfigurations({
  programId,
  accessToken,
}: {
  programId: number;
  accessToken: string;
}): Promise<
  Omit<request.Response, 'body'> & {
    body: ProgramFinancialServiceProviderConfigurationResponseDto[];
  }
> {
  return await getServer()
    .get(`/programs/${programId}/financial-service-provider-configurations`)
    .set('Cookie', [accessToken]);
}

export async function deleteProgramFinancialServiceProviderConfiguration({
  programId,
  name,
  accessToken,
}: {
  programId: number;
  name: string;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .delete(
      `/programs/${programId}/financial-service-provider-configurations/${name}`,
    )
    .set('Cookie', [accessToken]);
}

export async function postProgramFinancialServiceProviderConfigurationProperties({
  programId,
  properties,
  accessToken,
  name,
}: {
  programId: number;
  properties: CreateProgramFinancialServiceProviderConfigurationPropertyDto[];
  name: string;
  accessToken: string;
}): Promise<
  Omit<request.Response, 'body'> & {
    body: ProgramFinancialServiceProviderConfigurationPropertyResponseDto[];
  }
> {
  return await getServer()
    .post(
      `/programs/${programId}/financial-service-provider-configurations/${name}/properties`,
    )
    .set('Cookie', [accessToken])
    .send(properties);
}

export async function patchProgramFinancialServiceProviderConfigurationProperty({
  programId,
  configName,
  propertyName,
  body,
  accessToken,
}: {
  programId: number;
  configName: string;
  propertyName: FinancialServiceProviderConfigurationProperties;
  body: UpdateProgramFinancialServiceProviderConfigurationPropertyDto;
  accessToken: string;
}): Promise<
  Omit<request.Response, 'body'> & {
    body: ProgramFinancialServiceProviderConfigurationPropertyResponseDto;
  }
> {
  return await getServer()
    .patch(
      `/programs/${programId}/financial-service-provider-configurations/${configName}/properties/${propertyName}`,
    )
    .set('Cookie', [accessToken])
    .send(body);
}

export async function deleteProgramFinancialServiceProviderConfigurationProperty({
  programId,
  configName,
  propertyName,
  accessToken,
}: {
  programId: number;
  configName: string;
  propertyName: FinancialServiceProviderConfigurationProperties;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .delete(
      `/programs/${programId}/financial-service-provider-configurations/${configName}/properties/${propertyName}`,
    )
    .set('Cookie', [accessToken]);
}
