import { Injectable, Signal } from '@angular/core';

import { queryOptions } from '@tanstack/angular-query-experimental';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspConfigurationProperty } from '@121-service/src/fsp-integrations/shared/interfaces/fsp-configuration-property.interface';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration.dto';
import { ExcelFspConfigurationResponseDto } from '@121-service/src/program-fsp-configurations/excel/dtos/excel-fsp-configuration-response.dto';
import { UpdateExcelFspConfigurationDto } from '@121-service/src/program-fsp-configurations/excel/dtos/update-excel-fsp-configuration.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { Dto } from '~/utils/dto-type';

const BASE_ENDPOINT = (programId: Signal<number | string | undefined>) => [
  'programs',
  programId,
  'fsp-configurations',
];

@Injectable({
  providedIn: 'root',
})
export class FspConfigurationApiService extends DomainApiService {
  getExcelFspConfiguration({
    programId,
    configurationName,
  }: {
    programId: Signal<number | string>;
    configurationName: string;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<
      Dto<ExcelFspConfigurationResponseDto>
    >({
      method: 'GET',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(programId),
        encodeURIComponent(configurationName),
        'excel',
      ]).join('/'),
    });
  }

  getExcelFspConfigurations(programId: Signal<number | string>) {
    return () =>
      queryOptions({
        queryKey: [
          ...this.pathToQueryKey(BASE_ENDPOINT(programId)),
          'excel-details',
        ],
        queryFn: async () => {
          const fspConfigurations = await this.queryClient.query(
            this.getFspConfigurations(programId)(),
          );
          return Promise.all(
            fspConfigurations
              .filter(({ fspName }) => fspName === Fsps.excel)
              .map(({ name }) =>
                this.getExcelFspConfiguration({
                  programId,
                  configurationName: name,
                }),
              ),
          );
        },
      });
  }

  saveExcelFspConfiguration({
    programId,
    configurationName,
    configuration,
  }: {
    programId: Signal<number | string>;
    configurationName: string;
    configuration: Dto<UpdateExcelFspConfigurationDto>;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<
      Dto<ExcelFspConfigurationResponseDto>
    >({
      method: 'PUT',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(programId),
        encodeURIComponent(configurationName),
        'excel',
      ]).join('/'),
      body: configuration,
    });
  }

  getFspConfigurations(programId: Signal<number | string | undefined>) {
    return this.generateQueryOptions<FspConfiguration[]>({
      enabled: () => !!programId(),
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

  updateFspConfigurations({
    programId,
    fsps,
  }: {
    programId: Signal<number | string>;
    fsps: Fsps[];
  }) {
    return this.httpWrapperService.perform121ServiceRequest<undefined>({
      method: 'PUT',
      endpoint: this.pathToQueryKey([...BASE_ENDPOINT(programId)]).join('/'),
      body: { fsps },
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
    configurationName: Signal<string>;
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
