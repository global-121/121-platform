import { Inject, Injectable } from '@nestjs/common';
import { ScopedRepository } from '../../scoped.repository';
import { getScopedRepositoryProviderName } from '../../utils/scope/createScopedRepositoryProvider.helper';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';
import { RegistrationStatusChangeEntity } from '../registration-status-change.entity';

@Injectable()
export class RegistrationsBulkHelperService {
  public constructor(
    @Inject(getScopedRepositoryProviderName(RegistrationStatusChangeEntity))
    private registrationStatusChangeScopedRepository: ScopedRepository<RegistrationStatusChangeEntity>,
  ) {}

  public async saveBulkRegistrationStatusChanges(
    registrationIds: number[],
    registrationStatus: RegistrationStatusEnum,
  ): Promise<void> {
    const registrationStatusChanges: RegistrationStatusChangeEntity[] = [];
    for await (const registrationId of registrationIds) {
      const registrationStatusChange = new RegistrationStatusChangeEntity();
      registrationStatusChange.registrationId = registrationId;
      registrationStatusChange.registrationStatus = registrationStatus;
      registrationStatusChanges.push(registrationStatusChange);
    }

    await this.registrationStatusChangeScopedRepository.save(
      registrationStatusChanges,
      {
        chunk: 5000,
      },
    );
  }
}
