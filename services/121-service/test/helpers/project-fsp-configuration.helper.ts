import * as request from 'supertest';

import { FspConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';
import { CreateProjectFspConfigurationDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration.dto';
import { CreateProjectFspConfigurationPropertyDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration-property.dto';
import { ProjectFspConfigurationPropertyResponseDto } from '@121-service/src/project-fsp-configurations/dtos/project-fsp-configuration-property-response.dto';
import { ProjectFspConfigurationResponseDto } from '@121-service/src/project-fsp-configurations/dtos/project-fsp-configuration-response.dto';
import { UpdateProjectFspConfigurationDto } from '@121-service/src/project-fsp-configurations/dtos/update-project-fsp-configuration.dto';
import { UpdateProjectFspConfigurationPropertyDto } from '@121-service/src/project-fsp-configurations/dtos/update-project-fsp-configuration-property.dto';
import { getServer } from '@121-service/test/helpers/utility.helper';

export async function postProjectFspConfiguration({
  projectId,
  body,
  accessToken,
}: {
  projectId: number;
  body: CreateProjectFspConfigurationDto;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .post(`/projects/${projectId}/fsp-configurations`)
    .set('Cookie', [accessToken])
    .send(body);
}

export async function patchProjectFspConfiguration({
  projectId,
  name,
  body,
  accessToken,
}: {
  projectId: number;
  name: string;
  body: UpdateProjectFspConfigurationDto;
  accessToken: string;
}): Promise<
  Omit<request.Response, 'body'> & {
    body: ProjectFspConfigurationResponseDto;
  }
> {
  return await getServer()
    .patch(`/projects/${projectId}/fsp-configurations/${name}`)
    .set('Cookie', [accessToken])
    .send(body);
}

export async function getProjectFspConfigurations({
  projectId,
  accessToken,
}: {
  projectId: number;
  accessToken: string;
}): Promise<
  Omit<request.Response, 'body'> & {
    body: ProjectFspConfigurationResponseDto[];
  }
> {
  return await getServer()
    .get(`/projects/${projectId}/fsp-configurations`)
    .set('Cookie', [accessToken]);
}

export async function deleteProjectFspConfiguration({
  projectId,
  name,
  accessToken,
}: {
  projectId: number;
  name: string;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .delete(`/projects/${projectId}/fsp-configurations/${name}`)
    .set('Cookie', [accessToken]);
}

export async function postProjectFspConfigurationProperties({
  projectId,
  properties,
  accessToken,
  name,
}: {
  projectId: number;
  properties: CreateProjectFspConfigurationPropertyDto[];
  name: string;
  accessToken: string;
}): Promise<
  Omit<request.Response, 'body'> & {
    body: ProjectFspConfigurationPropertyResponseDto[];
  }
> {
  return await getServer()
    .post(`/projects/${projectId}/fsp-configurations/${name}/properties`)
    .set('Cookie', [accessToken])
    .send(properties);
}

export async function patchProjectFspConfigurationProperty({
  projectId,
  configName,
  propertyName,
  body,
  accessToken,
}: {
  projectId: number;
  configName: string;
  propertyName: FspConfigurationProperties;
  body: UpdateProjectFspConfigurationPropertyDto;
  accessToken: string;
}): Promise<
  Omit<request.Response, 'body'> & {
    body: ProjectFspConfigurationPropertyResponseDto;
  }
> {
  return await getServer()
    .patch(
      `/projects/${projectId}/fsp-configurations/${configName}/properties/${propertyName}`,
    )
    .set('Cookie', [accessToken])
    .send(body);
}

export async function deleteProjectFspConfigurationProperty({
  projectId,
  configName,
  propertyName,
  accessToken,
}: {
  projectId: number;
  configName: string;
  propertyName: FspConfigurationProperties;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .delete(
      `/projects/${projectId}/fsp-configurations/${configName}/properties/${propertyName}`,
    )
    .set('Cookie', [accessToken]);
}

export async function getProjectFspConfigurationProperties({
  projectId,
  configName,
  accessToken,
}: {
  projectId: number;
  configName: string;
  accessToken: string;
}): Promise<
  Omit<request.Response, 'body'> & {
    body: ProjectFspConfigurationPropertyResponseDto[];
  }
> {
  return await getServer()
    .get(`/projects/${projectId}/fsp-configurations/${configName}/properties`)
    .set('Cookie', [accessToken]);
}
