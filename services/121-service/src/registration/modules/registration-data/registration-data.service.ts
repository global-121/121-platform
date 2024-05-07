import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { AppDataSource } from '../../../../appdatasource';
import { InstanceEntity } from '../../../instance/instance.entity';
import { ProgramEntity } from '../../../programs/program.entity';
import { ScopedRepository } from '../../../scoped.repository';
import { getScopedRepositoryProviderName } from '../../../utils/scope/createScopedRepositoryProvider.helper';
import { RegistrationDataByNameDto } from '../../dto/registration-data-by-name.dto';
import {
  RegistrationDataOptions,
  RegistrationDataRelation,
} from '../../dto/registration-data-relation.model';
import { RegistrationDataError } from '../../errors/registration-data.error';
import { RegistrationDataEntity } from '../../registration-data.entity';
import { RegistrationViewEntity } from '../../registration-view.entity';
import { RegistrationEntity } from '../../registration.entity';
import { RegistrationScopedRepository } from '../../repositories/registration-scoped.repository';

@Injectable()
export class RegistrationDataService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(InstanceEntity)
  private readonly instanceRepository: Repository<InstanceEntity>;
  public constructor(
    @Inject(getScopedRepositoryProviderName(RegistrationDataEntity))
    private registrationDataScopedRepository: ScopedRepository<RegistrationDataEntity>,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
  ) {}

  public async getRegistrationValueByName(
    registration: RegistrationEntity,
    name: string,
  ): Promise<string> {
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
  ): Promise<string> {
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
  ): SelectQueryBuilder<RegistrationDataEntity> {
    return this.registrationDataScopedRepository
      .createQueryBuilder('registrationData')
      .leftJoin('registrationData.registration', 'registration')
      .leftJoin('registrationData.programQuestion', 'programQuestion')
      .leftJoin('registrationData.fspQuestion', 'fspQuestion')
      .leftJoin(
        'registrationData.programCustomAttribute',
        'programCustomAttribute',
      )
      .andWhere('registration.id = :id', { id: registration.id })
      .andWhere(
        new Brackets((qb) => {
          qb.andWhere(`programQuestion.name = :name`, { name: name })
            .orWhere(
              `(fspQuestion.name = :name AND "fspQuestion"."fspId" = :fsp)`,
              {
                name: name,
                fsp: registration.fspId,
              },
            )
            .orWhere(`programCustomAttribute.name = :name`, {
              name: name,
            });
        }),
      );
  }

  public async getRegistrationDataByName(
    registration: RegistrationEntity,
    name: string,
  ): Promise<RegistrationDataByNameDto> {
    const query = this.getRegistrationDataQuery(registration, name);
    const queryWithSelect = query.select(
      `CASE
          WHEN ("programQuestion"."name" is not NULL) THEN "programQuestion"."name"
          WHEN ("fspQuestion"."name" is not NULL) THEN "fspQuestion"."name"
          WHEN ("programCustomAttribute"."name" is not NULL) THEN "programCustomAttribute"."name"
        END as name,
        value, "registrationData".id`,
    );
    const result = queryWithSelect.getRawOne();
    return result;
  }

  public async getRegistrationDataEntityByName(
    registration: RegistrationEntity,
    name: string,
  ): Promise<RegistrationDataEntity> {
    const query = this.getRegistrationDataQuery(registration, name);
    return query.getOne();
  }

  public async getRelationForName(
    registration: RegistrationEntity | RegistrationViewEntity,
    name: string,
  ): Promise<RegistrationDataRelation> {
    const result = new RegistrationDataRelation();
    const query = this.programRepository
      .createQueryBuilder('program')
      .leftJoin('program.programQuestions', 'programQuestion')
      .andWhere('program.id = :programId', {
        programId: registration.programId,
      })
      .andWhere('programQuestion.name = :name', { name: name })
      .select('"programQuestion".id', 'id');

    const resultProgramQuestion = await query.getRawOne();

    if (resultProgramQuestion) {
      result.programQuestionId = resultProgramQuestion.id;
      return result;
    }

    const resultFspQuestion = await this.registrationScopedRepository
      .createQueryBuilder('registration')
      .leftJoin('registration.fsp', 'fsp')
      .leftJoin('fsp.questions', 'question')
      .andWhere('registration.id = :registration', {
        registration: registration.id,
      })
      .andWhere('question.name = :name', { name: name })
      .andWhere('question."fspId" = fsp.id')
      .select('"question".id', 'id')
      .getRawOne();
    if (resultFspQuestion) {
      result.fspQuestionId = resultFspQuestion.id;
      return result;
    }
    const resultProgramCustomAttribute = await this.programRepository
      .createQueryBuilder('program')
      .leftJoin('program.programCustomAttributes', 'programCustomAttribute')
      .andWhere('program.id = :programId', {
        programId: registration.programId,
      })
      .andWhere('programCustomAttribute.name = :name', { name: name })
      .select('"programCustomAttribute".id', 'id')
      .getRawOne();
    if (resultProgramCustomAttribute) {
      result.programCustomAttributeId = resultProgramCustomAttribute.id;
      return result;
    }
    const errorMessage = `Cannot find registration data, name: '${name}' not found (In program questions, fsp questions, and program custom attributes)`;
    throw new RegistrationDataError(errorMessage);
  }

  // To save registration data you need either a relation or a name
  public async saveData(
    registration: RegistrationEntity | RegistrationViewEntity,
    value: string | number | boolean | string[],
    options: RegistrationDataOptions,
  ): Promise<RegistrationEntity> {
    let relation = options.relation;
    if (!options.relation && !options.name) {
      const errors = `Cannot save registration data, need either a dataRelation or a name`;
      throw new Error(errors);
    }
    if (!options.relation) {
      relation = await this.getRelationForName(registration, options.name);
    }
    if (Array.isArray(value)) {
      await this.saveMultipleData(registration, value, relation);
    } else {
      await this.saveOneData(registration, value, relation);
    }

    return await this.registrationScopedRepository.findOne({
      relations: ['data'],
      where: {
        id: registration.id,
      },
    });
  }

  private async saveOneData(
    registration: RegistrationEntity | RegistrationViewEntity,
    value: string | number | boolean,
    relation: RegistrationDataRelation,
  ): Promise<void> {
    value = value === undefined || value === null ? '' : String(value);

    if (relation.programQuestionId) {
      await this.saveProgramQuestionData(
        registration,
        value,
        relation.programQuestionId,
      );
    }
    if (relation.fspQuestionId) {
      await this.saveFspQuestionData(
        registration,
        value,
        relation.fspQuestionId,
      );
    }
    if (relation.programCustomAttributeId) {
      await this.saveProgramCustomAttributeData(
        registration,
        value,
        relation.programCustomAttributeId,
      );
    }
  }

  private async saveMultipleData(
    registration: RegistrationEntity | RegistrationViewEntity,
    value: string[],
    relation: RegistrationDataRelation,
  ): Promise<void> {
    if (relation.programQuestionId) {
      await this.saveProgramQuestionDataMultiSelect(
        registration,
        value,
        relation.programQuestionId,
      );
    }
    if (relation.fspQuestionId) {
      await this.saveFspQuestionDataMultiSelect(
        registration,
        value,
        relation.fspQuestionId,
      );
    }
    if (relation.programCustomAttributeId) {
      await this.saveProgramCustomAttributeDataMultiSelect(
        registration,
        value,
        relation.programCustomAttributeId,
      );
    }
  }

  private async saveProgramQuestionData(
    registration: RegistrationEntity | RegistrationViewEntity,
    value: string,
    id: number,
  ): Promise<void> {
    const existingEntry = await this.registrationDataScopedRepository
      .createQueryBuilder('registrationData')
      .andWhere('"registrationId" = :regId', { regId: registration.id })
      .leftJoin('registrationData.programQuestion', 'programQuestion')
      .andWhere('programQuestion.id = :id', { id: id })
      .getOne();
    if (existingEntry) {
      existingEntry.value = value;
      await this.registrationDataScopedRepository.save(existingEntry);
    } else {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.registrationId = registration.id;
      newRegistrationData.value = value;
      newRegistrationData.programQuestionId = id;
      await this.registrationDataScopedRepository.save(newRegistrationData);
    }
  }

  private async saveProgramQuestionDataMultiSelect(
    registration: RegistrationEntity | RegistrationViewEntity,
    values: string[],
    id: number,
  ): Promise<void> {
    const repoRegistrationData = AppDataSource.getRepository(
      RegistrationDataEntity,
    );

    await repoRegistrationData.delete({
      registration: { id: registration.id },
      programQuestion: { id: id },
    });

    for await (const value of values) {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.registrationId = registration.id;
      newRegistrationData.value = value;
      newRegistrationData.programQuestionId = id;
      await repoRegistrationData.save(newRegistrationData);
    }
  }

  private async saveFspQuestionData(
    registration: RegistrationEntity | RegistrationViewEntity,
    value: string,
    id: number,
  ): Promise<void> {
    const repoRegistrationData = AppDataSource.getRepository(
      RegistrationDataEntity,
    );
    const existingEntry = await repoRegistrationData
      .createQueryBuilder('registrationData')
      .andWhere('"registrationId" = :regId', { regId: registration.id })
      .leftJoin('registrationData.fspQuestion', 'fspQuestion')
      .andWhere('fspQuestion.id = :id', { id: id })
      .getOne();
    if (existingEntry) {
      existingEntry.value = value;
      await repoRegistrationData.save(existingEntry);
    } else {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.registrationId = registration.id;
      newRegistrationData.value = value;
      newRegistrationData.fspQuestionId = id;
      await repoRegistrationData.save(newRegistrationData);
    }
  }

  private async saveFspQuestionDataMultiSelect(
    registration: RegistrationEntity | RegistrationViewEntity,
    values: string[],
    id: number,
  ): Promise<void> {
    await this.registrationDataScopedRepository.deleteUnscoped({
      registration: { id: registration.id },
      fspQuestion: { id: id },
    });

    for await (const value of values) {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.registrationId = registration.id;
      newRegistrationData.value = value;
      newRegistrationData.fspQuestionId = id;
      await this.registrationDataScopedRepository.save(newRegistrationData);
    }
  }

  private async saveProgramCustomAttributeData(
    registration: RegistrationEntity | RegistrationViewEntity,
    value: string,
    id: number,
  ): Promise<void> {
    const existingEntry = await this.registrationDataScopedRepository
      .createQueryBuilder('registrationData')
      .andWhere('"registrationId" = :regId', { regId: registration.id })
      .leftJoin(
        'registrationData.programCustomAttribute',
        'programCustomAttribute',
      )
      .andWhere('programCustomAttribute.id = :id', { id: id })
      .getOne();
    if (existingEntry) {
      existingEntry.value = value;
      await this.registrationDataScopedRepository.save(existingEntry);
    } else {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.registrationId = registration.id;
      newRegistrationData.value = value;
      newRegistrationData.programCustomAttributeId = id;
      await this.registrationDataScopedRepository.save(newRegistrationData);
    }
  }

  private async saveProgramCustomAttributeDataMultiSelect(
    registration: RegistrationEntity | RegistrationViewEntity,
    values: string[],
    id: number,
  ): Promise<void> {
    await this.registrationDataScopedRepository.deleteUnscoped({
      registration: { id: registration.id },
      programCustomAttribute: { id: id },
    });

    for await (const value of values) {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.registrationId = registration.id;
      newRegistrationData.value = value;
      newRegistrationData.programCustomAttributeId = id;
      await this.registrationDataScopedRepository.save(newRegistrationData);
    }
  }
}
