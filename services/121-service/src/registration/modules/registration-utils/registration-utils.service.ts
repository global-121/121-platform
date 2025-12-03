import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { PostgresStatusCodes } from '@121-service/src/shared/enum/postgres-status-codes.enum';

@Injectable()
export class RegistrationUtilsService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  constructor(
    private registrationScopedRepository: RegistrationScopedRepository,
    private readonly registrationDataService: RegistrationDataService,
  ) {}

  public async save(
    registration: RegistrationEntity,
    retryCount?: number,
    recalculateRegistrationProgramId = false,
  ): Promise<RegistrationEntity> {
    let saveRetriesCount = retryCount ? retryCount : 0;
    if (recalculateRegistrationProgramId) {
      const query = this.registrationScopedRepository
        .createQueryBuilder('r')
        .select('r."registrationProgramId"')
        .andWhere('r.programId = :programId', {
          programId: registration.program.id,
        })
        .andWhere('r.registrationProgramId is not null')
        .orderBy('r."registrationProgramId"', 'DESC')
        .limit(1);
      const result = await query.getRawOne();
      registration.registrationProgramId = result
        ? result.registrationProgramId + 1
        : 1;
    }
    try {
      return await this.registrationScopedRepository.save(registration);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const errorCodesThatShouldBeRetried: string[] = [
          PostgresStatusCodes.NOT_NULL_VIOLATION,
          PostgresStatusCodes.UNIQUE_VIOLATION,
        ];
        if (
          'code' in error &&
          errorCodesThatShouldBeRetried.includes(String(error.code)) &&
          saveRetriesCount < 3
        ) {
          saveRetriesCount++;
          return await this.save(registration, saveRetriesCount, true);
        }
        if (saveRetriesCount >= 3) {
          saveRetriesCount = 0;
          throw error;
        }
      }

      throw error;
    }
  }

  public async getFullName(registration: RegistrationEntity): Promise<string> {
    let fullName = '';
    const fullnameConcat: string[] = [];
    const program = await this.programRepository.findOneBy({
      id: registration.programId,
    });
    if (program && program.fullnameNamingConvention) {
      for (const nameColumn of JSON.parse(
        JSON.stringify(program.fullnameNamingConvention),
      )) {
        const singleName =
          await this.registrationDataService.getRegistrationDataValueByName(
            registration,
            nameColumn,
          );
        if (singleName) {
          fullnameConcat.push(singleName);
        }
      }
      fullName = fullnameConcat.join(' ');
    }
    return fullName;
  }
}
