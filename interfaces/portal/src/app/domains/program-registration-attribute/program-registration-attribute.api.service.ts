import { Injectable, Signal } from '@angular/core';

import { UpdateProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';

import { DomainApiService } from '~/domains/domain-api.service';
import { Dto } from '~/utils/dto-type';

export type ProgramRegistrationAttribute =
  Dto<ProgramRegistrationAttributeEntity>;

const BASE_ENDPOINT = (programId: Signal<number | string>) => [
  'programs',
  programId,
  'registration-attributes',
];

@Injectable({
  providedIn: 'root',
})
export class ProgramRegistrationAttributeApiService extends DomainApiService {
  updateProgramRegistrationAttribute({
    programId,
    attributeName,
    update,
  }: {
    programId: Signal<number | string>;
    attributeName: string;
    update: Dto<UpdateProgramRegistrationAttributeDto>;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<ProgramRegistrationAttribute>(
      {
        method: 'PATCH',
        endpoint: this.pathToQueryKey([
          ...BASE_ENDPOINT(programId),
          attributeName,
        ]).join('/'),
        body: update,
      },
    );
  }
}
