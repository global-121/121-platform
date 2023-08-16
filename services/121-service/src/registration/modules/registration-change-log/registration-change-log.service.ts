import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationEntity } from '../../registration.entity';
import { RegistrationChangeLogEntity } from './registration-change-log.entity';

@Injectable()
export class RegistrationChangeLogService {
  @InjectRepository(RegistrationChangeLogEntity)
  private readonly registrationChangeLogRepository: Repository<RegistrationChangeLogEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  public async getChangeLogByReferenceId(
    referenceId: string,
    programId: number,
  ): Promise<RegistrationChangeLogEntity[]> {
    return await this.registrationChangeLogRepository.find({
      where: {
        registration: { referenceId: referenceId, programId: programId },
      },
      relations: ['user'],
    });
  }

  public async exportChangeLog(programId: number): Promise<any[]> {
    const dataChanges = await this.registrationChangeLogRepository.find({
      where: {
        registration: { programId: programId },
      },
      relations: ['registration', 'user'],
    });
    return dataChanges.map((dataChange) => {
      return {
        paId: dataChange.registration.registrationProgramId,
        referenceId: dataChange.registration.referenceId,
        fullName: dataChange.registration.getFullName(),
        fieldName: dataChange.fieldName,
        oldValue: dataChange.oldValue || '-',
        newValue: dataChange.newValue || '-',
        changedBy: dataChange.user.username,
        changedAt: dataChange.created,
      };
    });
  }
}
