import { Injectable, Signal } from '@angular/core';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import {
  FspConfiguration,
  FspConfigurationProperty,
} from '~/domains/fsp-configuration/fsp-configuration.model';
import { Dto } from '~/utils/dto-type';

const BASE_ENDPOINT = (programId: Signal<number | string>) => [
  'programs',
  programId,
  'fsp-configurations',
];

@Injectable({
  providedIn: 'root',
})
export class FspConfigurationApiService extends DomainApiService {
  getFspConfigurations(programId: Signal<number | string>) {
    return this.generateQueryOptions<FspConfiguration[]>({
      path: BASE_ENDPOINT(programId),
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
    programId,
    configuration,
  }: {
    programId: Signal<number | string>;
    configuration: Dto<CreateProgramFspConfigurationDto>;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<FspConfiguration>({
      method: 'POST',
      endpoint: this.pathToQueryKey([...BASE_ENDPOINT(programId)]).join('/'),
      body: configuration,
    });
  }

  updateFspConfiguration({
    programId,
    configurationName,
    configuration,
  }: {
    programId: Signal<number | string>;
    configurationName: string;
    configuration: Dto<UpdateProgramFspConfigurationDto>;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<FspConfiguration>({
      method: 'PATCH',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(programId),
        configurationName,
      ]).join('/'),
      body: configuration,
    });
  }

  deleteFspConfiguration({
    programId,
    configurationName,
  }: {
    programId: Signal<number | string>;
    configurationName: string;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<undefined>({
      method: 'DELETE',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(programId),
        configurationName,
      ]).join('/'),
    });
  }

  getFspConfigurationProperties({
    programId,
    configurationName,
  }: {
    programId: Signal<number | string>;
    configurationName: string;
  }) {
    return this.generateQueryOptions<FspConfigurationProperty[]>({
      path: [...BASE_ENDPOINT(programId), configurationName, 'properties'],
    });
  }

  getPublicFspConfigurationProperties({
    programId,
    configurationName,
  }: {
    programId: Signal<number | string>;
    configurationName: string;
  }) {
    return this.generateQueryOptions<FspConfigurationProperty[]>({
      path: [
        ...BASE_ENDPOINT(programId),
        configurationName,
        'properties',
        'public',
      ],
    });
  }
}
