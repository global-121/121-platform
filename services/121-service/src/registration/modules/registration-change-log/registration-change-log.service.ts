import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationChangeLogEntity } from './registration-change-log.entity';

@Injectable()
export class RegistrationChangeLogService {
  @InjectRepository(RegistrationChangeLogEntity)
  private readonly registrationChangeLogRepository: Repository<RegistrationChangeLogEntity>;

  public async getChangeLogByReferenceId(
    referenceId: string,
  ): Promise<RegistrationChangeLogEntity[]> {
    return await this.registrationChangeLogRepository.find({
      where: { registration: { referenceId: referenceId } },
    });
  }
}
