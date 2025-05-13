import { Injectable, Signal } from '@angular/core';

import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import { FinancialServiceProviderConfiguration } from '~/domains/financial-service-provider-configuration/financial-service-provider-configuration.model';
import { Project } from '~/domains/project/project.model';
import { Dto } from '~/utils/dto-type';
const BASE_ENDPOINT = (projectId: Signal<number | string>) => [
  'programs',
  projectId,
  'financial-service-provider-configurations',
];

@Injectable({
  providedIn: 'root',
})
export class FinancialServiceProviderConfigurationApiService extends DomainApiService {
  getFinancialServiceProviderConfigurations(
    projectId: Signal<number | string>,
  ) {
    return this.generateQueryOptions<FinancialServiceProviderConfiguration[]>({
      path: BASE_ENDPOINT(projectId),
    });
  }

  createFinancialServiceProviderConfiguration(
    projectId: Signal<number | string>,
    configuration: Dto<CreateProgramFinancialServiceProviderConfigurationDto>,
  ) {
    return this.httpWrapperService.perform121ServiceRequest<Project>({
      method: 'POST',
      endpoint: this.pathToQueryKey([...BASE_ENDPOINT(projectId)]).join('/'),
      body: configuration,
    });
  }

  deleteFinancialServiceProviderConfiguration(
    projectId: Signal<number | string>,
    configurationName: string,
  ) {
    return this.httpWrapperService.perform121ServiceRequest<undefined>({
      method: 'DELETE',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(projectId),
        configurationName,
      ]).join('/'),
    });
  }

  public invalidateCache(projectId: Signal<number | string>): Promise<void> {
    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(BASE_ENDPOINT(projectId)),
    });
  }
}
