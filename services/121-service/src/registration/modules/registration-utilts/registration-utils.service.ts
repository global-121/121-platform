import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';

@Injectable()
export class RegistrationUtilsService {
  @InjectRepository(ProjectEntity)
  private readonly projectRepository: Repository<ProjectEntity>;

  constructor(
    private registrationScopedRepository: RegistrationScopedRepository,
    private readonly registrationDataService: RegistrationDataService,
  ) {}

  public async save(
    registration: RegistrationEntity,
    retryCount?: number,
    recalculateRegistrationProjectId = false,
  ): Promise<RegistrationEntity> {
    let saveRetriesCount = retryCount ? retryCount : 0;
    if (recalculateRegistrationProjectId) {
      const query = this.registrationScopedRepository
        .createQueryBuilder('r')
        .select('r."registrationProjectId"')
        .andWhere('r.projectId = :projectId', {
          projectId: registration.project.id,
        })
        .andWhere('r.registrationProjectId is not null')
        .orderBy('r."registrationProjectId"', 'DESC')
        .limit(1);
      const result = await query.getRawOne();
      registration.registrationProjectId = result
        ? result.registrationProjectId + 1
        : 1;
    }
    try {
      return await this.registrationScopedRepository.save(registration);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const errorCodesThatShouldBeRetried = [
          '23502', // This is the error code for not null violation (see: https://www.postgresql.org/docs/current/errcodes-appendix.html)
          '23505', // This is the error code for unique_violation (see: https://www.postgresql.org/docs/current/errcodes-appendix.html)
        ];
        if (
          errorCodesThatShouldBeRetried.includes(error['code']) &&
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
    const project = await this.projectRepository.findOneBy({
      id: registration.projectId,
    });
    if (project && project.fullnameNamingConvention) {
      for (const nameColumn of JSON.parse(
        JSON.stringify(project.fullnameNamingConvention),
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
