import { Inject, Injectable } from '@nestjs/common';
import { Between } from 'typeorm';
import { ScopedRepository } from '../../../scoped.repository';
import { getScopedRepositoryProviderName } from '../../../utils/scope/createScopedRepositoryProvider.helper';
import { RegistrationChangeLogReturnDto } from './dto/registration-change-log-return.dto';
import { RegistrationChangeLogEntity } from './registration-change-log.entity';
import { RegistrationChangeLogMapper } from './utils/registration-change-log.mapper';

@Injectable()
export class RegistrationChangeLogService {
  public constructor(
    @Inject(getScopedRepositoryProviderName(RegistrationChangeLogEntity))
    private registrationChangeLogScopedRepository: ScopedRepository<RegistrationChangeLogEntity>,
  ) {}

  public async getChangeLogByReferenceId(
    referenceId: string,
    programId: number,
  ): Promise<RegistrationChangeLogReturnDto[]> {
    const entities = await this.registrationChangeLogScopedRepository.find({
      where: {
        registration: { referenceId: referenceId, programId: programId },
      },
      relations: ['user'],
    });
    return RegistrationChangeLogMapper.toRegistrationChangeLogReturnDtos(
      entities,
    );
  }

  public async exportChangeLog(
    programId: number,
    fromDate?: any,
    toDate?: any,
  ): Promise<any[]> {
    const exportLimit = 100000;
    const dataChanges = await this.registrationChangeLogScopedRepository.find({
      where: {
        registration: { programId: programId },
        created: Between(
          fromDate || new Date(2000, 1, 1),
          toDate || new Date(),
        ),
      },
      relations: ['registration', 'user'],
      order: { created: 'DESC' },
      take: exportLimit,
    });
    return await Promise.all(
      dataChanges.map(async (dataChange) => {
        return {
          paId: dataChange.registration.registrationProgramId,
          referenceId: dataChange.registration.referenceId,
          fullName: await dataChange.registration.getFullName(),
          fieldName: dataChange.fieldName,
          oldValue: dataChange.oldValue || '-',
          newValue: dataChange.newValue || '-',
          reason: dataChange.reason,
          changedBy: dataChange.user.username,
          changedAt: dataChange.created,
        };
      }),
    );
  }
}
