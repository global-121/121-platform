import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository, SelectQueryBuilder } from 'typeorm';

import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { RegistrationDataByNameDto } from '@121-service/src/registration/dto/registration-data-by-name.dto';
import {
  RegistrationDataOptions,
  RegistrationDataRelation,
} from '@121-service/src/registration/dto/registration-data-relation.model';
import { RegistrationDataError } from '@121-service/src/registration/errors/registration-data.error';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';

@Injectable()
export class RegistrationDataService {
  @InjectRepository(ProjectEntity)
  private readonly projectRepository: Repository<ProjectEntity>;
  public constructor(
    private readonly registrationDataScopedRepository: RegistrationDataScopedRepository,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
  ) {}

  public async getRegistrationValueByName(
    registration: RegistrationEntity,
    name: string,
  ): Promise<string | undefined> {
    const registrationDataResult = await this.getRegistrationDataValueByName(
      registration,
      name,
    );
    if (registrationDataResult) {
      return registrationDataResult;
    } else {
      const registrationResult = registration[name];
      if (registrationResult) {
        return registrationResult;
      }
    }
  }

  // TODO: Refactor this to accept an array of keys
  public async getRegistrationDataValueByName(
    registration: RegistrationEntity,
    name: string,
  ): Promise<string | null> {
    const result = await this.getRegistrationDataByName(registration, name);
    if (!result || !result.value) {
      return null;
    } else {
      return result.value;
    }
  }

  private getRegistrationDataQuery(
    registration: RegistrationEntity,
    name: string,
  ): SelectQueryBuilder<RegistrationAttributeDataEntity> {
    return this.registrationDataScopedRepository
      .createQueryBuilder('registrationData')
      .leftJoin('registrationData.registration', 'registration')
      .leftJoin(
        'registrationData.projectRegistrationAttribute',
        'projectRegistrationAttribute',
      )
      .andWhere('registration.id = :id', { id: registration.id })
      .andWhere(`projectRegistrationAttribute.name = :name`, { name });
  }

  public async getRegistrationDataByName(
    registration: RegistrationEntity,
    name: string,
  ): Promise<RegistrationDataByNameDto | null> {
    const query = this.getRegistrationDataQuery(registration, name);
    const queryWithSelect = query.select([
      'projectRegistrationAttribute.name as name',
      'registrationData.value as value',
      'registrationData.id as id',
    ]);
    const result = queryWithSelect.getRawOne();
    return result;
  }

  public async getRegistrationDataEntityByName(
    registration: RegistrationEntity,
    name: string,
  ): Promise<RegistrationAttributeDataEntity | null> {
    const query = this.getRegistrationDataQuery(registration, name);
    return query.getOne();
  }

  public async getRelationForName(
    registration: RegistrationEntity | RegistrationViewEntity,
    name: string,
  ): Promise<RegistrationDataRelation> {
    const result = new RegistrationDataRelation();
    const query = this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'project.projectRegistrationAttributes',
        'projectRegistrationAttributes',
      )
      .andWhere('project.id = :projectId', {
        projectId: registration.projectId,
      })
      .andWhere('projectRegistrationAttributes.name = :name', { name })
      .select('"projectRegistrationAttributes".id', 'id');

    const resultProjectRegistrationAttribute = await query.getRawOne();

    if (resultProjectRegistrationAttribute) {
      result.projectRegistrationAttributeId =
        resultProjectRegistrationAttribute.id;
      return result;
    }

    const errorMessage = `Cannot find registration data, name: '${name}' not found (In project registration attributes)`;
    throw new RegistrationDataError(errorMessage);
  }

  // To save registration data you need either a relation or a name
  public async saveData(
    registration: RegistrationEntity | RegistrationViewEntity,
    value: string | number | boolean | string[],
    options: RegistrationDataOptions,
  ): Promise<RegistrationEntity> {
    let { relation } = options;
    if (!relation && !options.name) {
      const errors = `Cannot save registration data, need either a dataRelation or a name`;
      throw new Error(errors);
    }
    if (!relation) {
      relation = await this.getRelationForName(registration, options.name!);
    }
    if (Array.isArray(value)) {
      await this.saveMultipleData(registration, value, relation);
    } else {
      await this.saveOneData(registration, value, relation);
    }

    return await this.registrationScopedRepository.findOneOrFail({
      relations: ['data'],
      where: {
        id: Equal(registration.id),
      },
    });
  }

  private async saveOneData(
    registration: RegistrationEntity | RegistrationViewEntity,
    value: string | number | boolean,
    relation: RegistrationDataRelation,
  ): Promise<void> {
    value = value === undefined || value === null ? '' : String(value);

    if (relation.projectRegistrationAttributeId) {
      await this.saveProjectRegistrationAttributeData(
        registration,
        value,
        relation.projectRegistrationAttributeId,
      );
    }
  }

  private async saveMultipleData(
    registration: RegistrationEntity | RegistrationViewEntity,
    value: string[],
    relation: RegistrationDataRelation,
  ): Promise<void> {
    if (relation.projectRegistrationAttributeId) {
      await this.saveProjectRegistrationAttributeDataMultiSelect(
        registration,
        value,
        relation.projectRegistrationAttributeId,
      );
    }
  }

  private async saveProjectRegistrationAttributeData(
    registration: RegistrationEntity | RegistrationViewEntity,
    value: string,
    id: number,
  ): Promise<void> {
    const existingEntry = await this.registrationDataScopedRepository
      .createQueryBuilder('registrationData')
      .andWhere('"registrationId" = :regId', { regId: registration.id })
      .leftJoin(
        'registrationData.projectRegistrationAttribute',
        'projectRegistrationAttribute',
      )
      .andWhere('projectRegistrationAttribute.id = :id', { id })
      .getOne();
    if (existingEntry) {
      existingEntry.value = value;
      await this.registrationDataScopedRepository.save(existingEntry);
    } else {
      const newRegistrationData = new RegistrationAttributeDataEntity();
      newRegistrationData.registrationId = registration.id;
      newRegistrationData.value = value;
      newRegistrationData.projectRegistrationAttributeId = id;
      await this.registrationDataScopedRepository.save(newRegistrationData);
    }
  }

  private async saveProjectRegistrationAttributeDataMultiSelect(
    registration: RegistrationEntity | RegistrationViewEntity,
    values: string[],
    id: number,
  ): Promise<void> {
    await this.registrationDataScopedRepository.deleteUnscoped({
      registration: { id: registration.id },
      projectRegistrationAttribute: { id },
    });

    for await (const value of values) {
      const newRegistrationData = new RegistrationAttributeDataEntity();
      newRegistrationData.registrationId = registration.id;
      newRegistrationData.value = value;
      newRegistrationData.projectRegistrationAttributeId = id;
      await this.registrationDataScopedRepository.save(newRegistrationData);
    }
  }

  public async deleteProjectRegistrationAttributeData(
    registration: RegistrationEntity,
    options: RegistrationDataOptions,
  ) {
    let { relation } = options;
    if (!relation && !options.name) {
      const errors = `Cannot delete registration data, need either a dataRelation or a name`;
      throw new Error(errors);
    }
    if (!relation) {
      relation = await this.getRelationForName(registration, options.name!);
    }
    if (relation.projectRegistrationAttributeId) {
      await this.registrationDataScopedRepository.deleteUnscoped({
        registrationId: Equal(registration.id),
        projectRegistrationAttribute: {
          id: relation.projectRegistrationAttributeId,
        },
      });
    }
  }
}
