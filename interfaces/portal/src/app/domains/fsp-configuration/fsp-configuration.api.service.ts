import { Injectable, Signal } from '@angular/core';

import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { Dto } from '~/utils/dto-type';

const BASE_ENDPOINT = (projectId: Signal<number | string>) => [
  'programs',
  projectId,
  'fsp-configurations',
];

@Injectable({
  providedIn: 'root',
})
export class FspConfigurationApiService extends DomainApiService {
  getFspConfigurations(projectId: Signal<number | string>) {
    return this.generateQueryOptions<FspConfiguration[]>({
      path: BASE_ENDPOINT(projectId),
      processResponse: (response) => {
        // This guarantees some consistency in the order of FSP configurations shown in the UI
        // Without this, the order would depend on the order in which the configurations were
        // last edited, which makes configurations jump around in the list after editing them.
        const fspSettingsOrder = Object.keys(FSP_SETTINGS);
        return response.sort(
          (a, b) =>
            fspSettingsOrder.indexOf(a.fspName) -
            fspSettingsOrder.indexOf(b.fspName),
        );
      },
    });
  }

  createFspConfiguration({
    projectId,
    configuration,
  }: {
    projectId: Signal<number | string>;
    configuration: Dto<CreateProgramFspConfigurationDto>;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<FspConfiguration>({
      method: 'POST',
      endpoint: this.pathToQueryKey([...BASE_ENDPOINT(projectId)]).join('/'),
      body: configuration,
    });
  }

  updateFspConfiguration({
    projectId,
    configurationName,
    configuration,
  }: {
    projectId: Signal<number | string>;
    configurationName: string;
    configuration: Dto<UpdateProgramFspConfigurationDto>;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<FspConfiguration>({
      method: 'PATCH',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(projectId),
        configurationName,
      ]).join('/'),
      body: configuration,
    });
  }

  deleteFspConfiguration({
    projectId,
    configurationName,
  }: {
    projectId: Signal<number | string>;
    configurationName: string;
  }) {
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
