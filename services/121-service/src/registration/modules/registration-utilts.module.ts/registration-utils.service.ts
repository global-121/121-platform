import { Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AppDataSource } from '../../../../appdatasource';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationEntity } from '../../registration.entity';
import { RegistrationDataService } from '../registration-data/registration-data.service';

@Injectable()
export class RegistrationUtilsService {
  constructor(
    private readonly registrationDataService: RegistrationDataService,
  ) {}

  public async save(
    registration: RegistrationEntity,
    retryCount?: number,
  ): Promise<RegistrationEntity> {
    let saveRetriesCount = retryCount ? retryCount : 0;
    const regRepo = AppDataSource.getRepository(RegistrationEntity);
    if (!registration.registrationProgramId) {
      const query = regRepo
        .createQueryBuilder('r')
        .select('r."registrationProgramId"')
        .where('r.programId = :programId', {
          programId: registration.program.id,
        })
        .andWhere('r.registrationProgramId is not null')
        .orderBy('r."registrationProgramId"', 'DESC')
        .limit(1);
      const result = await query.getRawOne();
      console.log('🚀 ~ RegistrationUtilsService ~ result:', result);
      registration.registrationProgramId = result
        ? result.registrationProgramId + 1
        : 1;
    }
    try {
      return await regRepo.save(registration);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        // This is the error code for unique_violation (see: https://www.postgresql.org/docs/current/errcodes-appendix.html)
        if (error['code'] === '23505' && saveRetriesCount < 3) {
          saveRetriesCount++;
          registration.registrationProgramId = null;
          return await this.save(registration, saveRetriesCount);
        }
        if (saveRetriesCount >= 3) {
          saveRetriesCount = 0;
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  public async getFullName(registration: RegistrationEntity): Promise<string> {
    const repoProgram = AppDataSource.getRepository(ProgramEntity);
    let fullName = '';
    const fullnameConcat = [];
    const program = await repoProgram.findOneBy({ id: registration.programId });
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
