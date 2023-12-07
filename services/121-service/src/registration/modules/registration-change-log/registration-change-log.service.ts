import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { RegistrationEntity } from '../../registration.entity';
import { RegistrationChangeLogEntity } from './registration-change-log.entity';
import { ScopedRepository } from '../../../scoped.repository';
import { getScopedRepositoryProvideName } from '../../../utils/createScopedRepositoryProvider.helper';

@Injectable()
export class RegistrationChangeLogService {
  @InjectRepository(RegistrationChangeLogEntity)
  private readonly registrationChangeLogRepository: Repository<RegistrationChangeLogEntity>;

  public constructor(
    @Inject(getScopedRepositoryProvideName(RegistrationChangeLogEntity))
    private registrationChangeScopedRepository: ScopedRepository<RegistrationChangeLogEntity>,
  ) {}

  public async getChangeLogByReferenceId(
    referenceId: string,
    programId: number,
  ): Promise<RegistrationChangeLogEntity[]> {
    return await this.registrationChangeScopedRepository.find({
      where: {
        registration: { referenceId: referenceId, programId: programId },
      },
      relations: ['user'],
    });
  }

  public async exportChangeLog(
    programId: number,
    fromDate?: any,
    toDate?: any,
  ): Promise<any[]> {
    const dataChanges = await this.registrationChangeLogRepository.find({
      where: {
        registration: { programId: programId },
        created: Between(
          fromDate || new Date(2000, 1, 1),
          toDate || new Date(),
        ),
      },
      relations: ['registration', 'user'],
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
