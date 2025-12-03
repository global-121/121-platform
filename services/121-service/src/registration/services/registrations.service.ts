import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindOneOptions, In, Repository } from 'typeorm';

import { IntersolveVisaDataSynchronizationService } from '@121-service/src/fsp-integrations/data-synchronization/intersolve-visa-data-synchronization/intersolve-visa-data-synchronization.service';
import { ContactInformation } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/partials/contact-information.interface';
import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ImportResult } from '@121-service/src/registration/dto/bulk-import.dto';
import { CreateRegistrationDto } from '@121-service/src/registration/dto/create-registration.dto';
import { DuplicateReponseDto } from '@121-service/src/registration/dto/duplicate-response.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { ReferenceProgramIdScopeDto } from '@121-service/src/registration/dto/registrationProgramIdScope.dto';
import {
  AdditionalAttributes,
  Attributes,
  UpdateRegistrationDto,
} from '@121-service/src/registration/dto/update-registration.dto';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import {
  DefaultRegistrationDataAttributeNames,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationValidationInputType } from '@121-service/src/registration/enum/registration-validation-input-type.enum';
import { ErrorEnum } from '@121-service/src/registration/errors/registration-data.error';
import { ValidationRegistrationConfig } from '@121-service/src/registration/interfaces/validate-registration-config.interface';
import { ValidatedRegistrationInput } from '@121-service/src/registration/interfaces/validated-registration-input.interface';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utils/registration-utils.service';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { UniqueRegistrationPairRepository } from '@121-service/src/registration/repositories/unique-registration-pair.repository';
import { InclusionScoreService } from '@121-service/src/registration/services/inclusion-score.service';
import { RegistrationsImportService } from '@121-service/src/registration/services/registrations-import.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserService } from '@121-service/src/user/user.service';
import { convertToScopedOptions } from '@121-service/src/utils/scope/createFindWhereOptions.helper';

@Injectable()
export class RegistrationsService {
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramRegistrationAttributeEntity)
  private readonly programRegistrationAttributeRepository: Repository<ProgramRegistrationAttributeEntity>;

  public constructor(
    private readonly lookupService: LookupService,
    private readonly inclusionScoreService: InclusionScoreService,
    private readonly registrationsImportService: RegistrationsImportService,
    private readonly registrationDataService: RegistrationDataService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly userService: UserService,
    private readonly registrationUtilsService: RegistrationUtilsService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly registrationEventsService: RegistrationEventsService,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly registrationDataScopedRepository: RegistrationDataScopedRepository,
    private readonly registrationsInputValidator: RegistrationsInputValidator,
    private readonly uniqueRegistrationPairRepository: UniqueRegistrationPairRepository,
    private readonly intersolveVisaDataSynchronizationService: IntersolveVisaDataSynchronizationService,
  ) {}

  public async getRegistrationOrThrow({
    referenceId,
    relations = [],
    programId,
  }: {
    referenceId: string;
    relations?: (keyof RegistrationEntity)[];
    programId?: number;
  }): Promise<RegistrationEntity> {
    if (!referenceId) {
      const errors = `ReferenceId is not set`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    const registration =
      await this.registrationScopedRepository.getWithRelationsByReferenceIdAndProgramId(
        {
          referenceId,
          relations,
          programId,
        },
      );
    if (!registration) {
      const errors = `ReferenceId ${referenceId} is not known in this program (within your scope).`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return registration;
  }

  // This methods can be used to get the same formatted data as the pagination query using referenceId
  public async getPaginateRegistrationForReferenceId(
    referenceId: string,
    programId: number,
  ) {
    const queryBuilder = this.registrationViewScopedRepository
      .createQueryBuilder('registration')
      .andWhere({ referenceId });
    const paginateResult =
      await this.registrationsPaginationService.getPaginate({
        query: { path: '' },
        programId,
        hasPersonalReadPermission: true,
        noLimit: false,
        queryBuilder,
      });
    return paginateResult.data[0];
  }

  // This methods can be used to get the same formatted data as the pagination query using referenceId
  public async getPaginateRegistrationById({
    id,
    programId,
  }: {
    id: number;
    programId: number;
  }) {
    const queryBuilder = this.registrationViewScopedRepository
      .createQueryBuilder('registration')
      .andWhere({
        id,
      });
    const paginateResult =
      await this.registrationsPaginationService.getPaginate({
        query: { path: '' },
        programId,
        hasPersonalReadPermission: true,
        noLimit: false,
        queryBuilder,
      });
    return paginateResult.data[0];
  }

  private async findUserOrThrow(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: Equal(userId) },
    });
    if (!user) {
      const errors = 'This user is not known.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return user;
  }

  public async create(
    postData: CreateRegistrationDto,
    programId: number,
    userId: number,
  ) {
    const user = await this.findUserOrThrow(userId);
    const registration = new RegistrationEntity();
    registration.referenceId = postData.referenceId;
    registration.user = user;
    registration.program = await this.programRepository.findOneByOrFail({
      id: programId,
    });
    await this.registrationUtilsService.save(registration);
    return this.setRegistrationStatus(
      postData.referenceId,
      RegistrationStatusEnum.new,
    );
  }

  private async setRegistrationStatus(
    referenceId: string,
    status: RegistrationStatusEnum,
  ) {
    const registrationBeforeUpdate =
      await this.registrationViewScopedRepository.findOneOrFail({
        where: { referenceId: Equal(referenceId) },
        select: ['id', 'status'],
      });
    await this.registrationScopedRepository.updateUnscoped(
      { referenceId },
      { registrationStatus: status },
    );
    const registrationAfterUpdate =
      await this.registrationViewScopedRepository.findOneOrFail({
        where: { referenceId: Equal(referenceId) },
        select: ['id', 'status'],
      });
    await this.registrationEventsService.createFromRegistrationViews(
      registrationBeforeUpdate,
      registrationAfterUpdate,
      { explicitRegistrationPropertyNames: ['status'] },
    );
    return registrationAfterUpdate;
  }

  public async cleanCustomDataIfPhoneNr(
    customDataKey: string,
    customDataValue: string | number | string[] | boolean | null,
    programId: number,
  ) {
    const allowEmptyPhoneNumber = (
      await this.programRepository.findOneBy({
        id: programId,
      })
    )?.allowEmptyPhoneNumber;

    const answersTypeTel: string[] = [];
    const programRegistrationAttributes =
      await this.programRegistrationAttributeRepository.find({
        where: { type: Equal(RegistrationAttributeTypes.tel) },
      });
    for (const question of programRegistrationAttributes) {
      answersTypeTel.push(question.name);
    }

    if (!answersTypeTel.includes(customDataKey)) {
      return customDataValue;
    }

    if (
      !allowEmptyPhoneNumber &&
      customDataKey === DefaultRegistrationDataAttributeNames.phoneNumber
    ) {
      // phoneNumber cannot be empty
      if (!customDataValue) {
        throw new HttpException(
          'Phone number cannot be empty',
          HttpStatus.BAD_REQUEST,
        );
      }
      // otherwise check
      return await this.lookupService.lookupAndCorrect(String(customDataValue));
    }

    if (!customDataValue) {
      // other tel-types (e.g. whatsappPhoneNumber) can be empty
      return customDataValue;
    }
    // otherwise check
    return await this.lookupService.lookupAndCorrect(String(customDataValue));
  }

  public async getImportRegistrationsTemplate(
    programId: number,
  ): Promise<string[]> {
    return await this.registrationsImportService.getImportRegistrationsTemplate(
      programId,
    );
  }

  public async importRegistrationsFromCsv(
    csvFile: Express.Multer.File,
    programId: number,
    userId: number,
  ): Promise<ImportResult> {
    const program = await this.findProgramOrThrow(programId);
    return await this.registrationsImportService.importRegistrationsFromCsv(
      csvFile,
      program,
      userId,
    );
  }

  public async patchBulk(
    csvFile: Express.Multer.File,
    programId: number,
    userId: number,
    reason: string,
  ): Promise<void> {
    return await this.registrationsImportService.patchBulk(
      csvFile,
      programId,
      userId,
      reason,
    );
  }

  public async importRegistrationsFromJson(
    jsonData: Record<string, string | number | boolean>[],
    programId: number,
    userId: number,
  ): Promise<ImportResult> {
    const program = await this.findProgramOrThrow(programId);
    return await this.registrationsImportService.importRegistrations(
      jsonData,
      program,
      userId,
    );
  }

  private async findProgramOrThrow(programId: number): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne({
      where: { id: Equal(programId) },
      relations: ['programRegistrationAttributes'],
    });
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return program;
  }

  public transformRegistrationByNamingConvention(
    nameColumns: string[],
    registrationObject: MappedPaginatedRegistrationDto, // Allow dynamic key access
  ): MappedPaginatedRegistrationDto {
    const fullnameConcat: string[] = [];

    // Loop through nameColumns and access properties dynamically
    for (const nameColumn of nameColumns) {
      if (registrationObject[nameColumn]) {
        fullnameConcat.push(registrationObject[nameColumn]);
        delete registrationObject[nameColumn]; // Remove original properties
      }
    }

    // Concatenate the full name and assign to the 'name' property
    registrationObject.name = fullnameConcat.join(' ');

    return registrationObject; // Return the modified object
  }

  public async validateInputAndUpdateRegistration({
    programId,
    referenceId,
    updateRegistrationDto,
    userId,
  }: {
    programId: number;
    referenceId: string;
    updateRegistrationDto: UpdateRegistrationDto;
    userId: number;
  }): Promise<MappedPaginatedRegistrationDto | undefined> {
    const validationConfig: ValidationRegistrationConfig = {
      validateUniqueReferenceId: false,
      validateExistingReferenceId: false,
    };
    const updateDataWithReferenceId = {
      referenceId,
      ...updateRegistrationDto.data,
    };

    let validateRegistrationPatchData;
    try {
      validateRegistrationPatchData =
        await this.registrationsInputValidator.validateAndCleanInput({
          registrationInputArray: [updateDataWithReferenceId],
          programId,
          userId,
          typeOfInput: RegistrationValidationInputType.update,
          validationConfig,
        });
    } catch (error) {
      if (error instanceof HttpException) {
        this.processHttpExceptionOnRegistrationUpdate(error);
      } else {
        throw error;
      }
    }

    // if all valid, process update
    return await this.updateRegistration({
      programId,
      referenceId,
      validatedRegistrationInput: validateRegistrationPatchData[0],
      reason: updateRegistrationDto.reason,
    });
  }

  // TODO: Refactor this, it works around the fact that registrationsInputValidator throws Http exception with line numbers and columns names
  // May be better to solve this in the registrationsInputValidator depending on the type of validation
  private processHttpExceptionOnRegistrationUpdate(
    error: HttpException,
  ): never {
    if (error.getStatus() === 400) {
      const errorResponse = error.getResponse();
      let errorMessage: object | string = '';
      if (Array.isArray(errorResponse)) {
        errorMessage = errorResponse
          .map((err) => `${err.column}: ${err.error}`)
          .join(', ');
      } else {
        errorMessage = errorResponse;
      }
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    } else {
      throw error; // Re-throw the error if it's not an HttpException with status 400
    }
  }

  public async updateRegistration({
    programId,
    referenceId,
    validatedRegistrationInput,
    reason,
  }: {
    programId: number;
    referenceId: string;
    validatedRegistrationInput: ValidatedRegistrationInput;
    reason: string | undefined;
  }) {
    let nrAttributesUpdated = 0;
    const { data: registrationDataInput, ...partialRegistrationInput } =
      validatedRegistrationInput;

    let registrationToUpdate = await this.getRegistrationOrThrow({
      referenceId,
      relations: ['program'],
      programId,
    });
    const program = registrationToUpdate.program;

    const oldViewRegistration =
      await this.getPaginateRegistrationForReferenceId(referenceId, programId);

    // Track whether maxPayments has been updated to match paymentCount
    let maxPaymentsMatchesPaymentCount = false;

    for (const attributeKey of Object.keys(partialRegistrationInput)) {
      const attributeValue: string | number | string[] | boolean =
        partialRegistrationInput[attributeKey];

      const oldValue = oldViewRegistration[attributeKey];

      if (String(oldValue) !== String(attributeValue)) {
        if (
          attributeKey === AdditionalAttributes.maxPayments &&
          Number(attributeValue) === registrationToUpdate.paymentCount
        ) {
          maxPaymentsMatchesPaymentCount = true;
        }
        registrationToUpdate = await this.updateAttribute({
          attribute: attributeKey,
          value: attributeValue,
          registration: registrationToUpdate,
          program,
        });
        nrAttributesUpdated++;
      }
    }

    for (const attributeKey of Object.keys(registrationDataInput)) {
      const attributeValue: string | number | string[] | boolean | null =
        typeof registrationDataInput[attributeKey] === 'boolean'
          ? String(registrationDataInput[attributeKey])
          : registrationDataInput[attributeKey];

      const oldValue = oldViewRegistration[attributeKey];

      if (String(oldValue) !== String(attributeValue)) {
        registrationToUpdate = await this.updateAttribute({
          attribute: attributeKey,
          value: attributeValue,
          registration: registrationToUpdate,
          program,
        });
        nrAttributesUpdated++;
      }
    }

    if (maxPaymentsMatchesPaymentCount) {
      registrationToUpdate = await this.updateAttribute({
        attribute: 'registrationStatus',
        value: RegistrationStatusEnum.completed,
        registration: registrationToUpdate,
        program,
      });
      nrAttributesUpdated++;
    }

    const newRegistration = await this.getPaginateRegistrationForReferenceId(
      referenceId,
      programId,
    );

    if (nrAttributesUpdated > 0) {
      await this.inclusionScoreService.calculateInclusionScore(referenceId);
      await this.registrationEventsService.createFromRegistrationViews(
        { ...oldViewRegistration },
        { ...newRegistration },
        { reason },
      );
      return newRegistration;
    }
  }

  private async updateAttribute({
    attribute,
    value,
    registration,
    program,
  }: {
    attribute: Attributes | string;
    value: string | number | string[] | boolean | null;
    registration: RegistrationEntity;
    program: ProgramEntity;
  }): Promise<RegistrationEntity> {
    value = await this.cleanCustomDataIfPhoneNr(
      attribute,
      value,
      registration.programId,
    );

    if (typeof registration[attribute] !== 'undefined') {
      registration[attribute] = value;
    }

    if (
      !Object.values(AdditionalAttributes).includes(
        attribute as AdditionalAttributes,
      )
    ) {
      if (value === null) {
        await this.registrationDataService.deleteProgramRegistrationAttributeData(
          registration,
          {
            name: attribute,
          },
        );
      } else {
        try {
          await this.registrationDataService.saveData(registration, value, {
            name: attribute,
          });
        } catch (error) {
          // This is an exception because the phoneNumber is in the registration entity, not in the registrationData.
          if (attribute === Attributes.phoneNumber) {
            registration.phoneNumber = value.toString();
            await this.registrationUtilsService.save(registration);
          } else {
            if (error.name !== ErrorEnum.RegistrationDataError) {
              throw error;
            }
          }
        }
      }
    }

    if (attribute === AdditionalAttributes.programFspConfigurationName) {
      registration.programFspConfigurationId =
        await this.getChosenFspConfigurationId({
          registration,
          newFspConfigurationName: String(value),
        });
    }
    const savedRegistration: RegistrationEntity =
      await this.registrationUtilsService.save(registration);
    const calculatedRegistration =
      await this.inclusionScoreService.calculatePaymentAmountMultiplier(
        program,
        registration.referenceId,
      );
    if (calculatedRegistration) {
      return this.getRegistrationOrThrow({
        referenceId: calculatedRegistration.referenceId,
      });
    }

    const contactInformation: ContactInformation =
      await this.getContactInformation({
        referenceId: savedRegistration.referenceId,
        programId: savedRegistration.programId,
      });
    await this.intersolveVisaDataSynchronizationService.syncData({
      registrationId: savedRegistration.id,
      attribute,
      contactInformation,
    });

    return this.getRegistrationOrThrow({
      referenceId: savedRegistration.referenceId,
      relations: ['program'],
    });
  }

  public async searchRegistration(rawPhoneNumber: string, userId: number) {
    const phoneNumber = await this.lookupService.lookupAndCorrect(
      rawPhoneNumber,
      true,
    );
    if (!phoneNumber) {
      return [];
    }

    const registrationAttributesPhoneNumberNames = [
      DefaultRegistrationDataAttributeNames.phoneNumber as string,
      DefaultRegistrationDataAttributeNames.whatsappPhoneNumber as string,
    ];

    const matchingRegistrations = (
      await this.registrationScopedRepository.find({
        where: { phoneNumber: Equal(phoneNumber) },
      })
    ).map((r) => {
      return {
        programId: r.programId,
        referenceId: r.referenceId,
        scope: r.scope,
      };
    });
    const matchingRegistrationData = await this.registrationDataScopedRepository
      .createQueryBuilder('registrationData')
      .leftJoinAndSelect('registrationData.registration', 'registration')
      .andWhere('registrationData.value = :phoneNumber', {
        phoneNumber,
      })
      .getMany();

    for (const d of matchingRegistrationData) {
      const dataName = await d.getDataName();
      if (
        dataName &&
        registrationAttributesPhoneNumberNames.includes(dataName)
      ) {
        matchingRegistrations.push({
          programId: d.registration.programId,
          referenceId: d.registration.referenceId,
          scope: d.registration.scope,
        });
      }
    }

    const uniqueRegistrations = matchingRegistrations.filter(
      (value, index, self) =>
        index === self.findIndex((t) => t.referenceId === value.referenceId),
    );

    const filteredRegistrations = await this.filterRegistrationsByProgramScope(
      uniqueRegistrations,
      userId,
    );

    return await Promise.all(
      filteredRegistrations.map(async (uniqueRegistration) => {
        return await this.getPaginateRegistrationForReferenceId(
          uniqueRegistration.referenceId,
          uniqueRegistration.programId,
        );
      }),
    );
  }

  private async filterRegistrationsByProgramScope(
    registrationObjects: ReferenceProgramIdScopeDto[],
    userId: number,
  ): Promise<ReferenceProgramIdScopeDto[]> {
    const filteredRegistrations: ReferenceProgramIdScopeDto[] = [];
    const programIdScopeObjects =
      await this.userService.getProgramScopeIdsUserHasPermission(
        userId,
        PermissionEnum.RegistrationPersonalREAD,
      );
    for (const registration of registrationObjects) {
      // Filters out registrations of programs to which this user is not assigned
      const programIdScopeObject = programIdScopeObjects.find(
        (p) => p.programId === registration.programId,
      );

      if (programIdScopeObject) {
        // Filters out registrations of a program to which this user is assigned, but not to the scope of the registration
        const findProgramOption = {
          where: {
            programId: Equal(registration.programId),
            referenceId: Equal(registration.referenceId),
          },
        };
        const findOption = convertToScopedOptions<
          RegistrationEntity,
          FindOneOptions<RegistrationEntity>
        >(findProgramOption, [], programIdScopeObject.scope);
        const foundRegistration =
          await this.registrationScopedRepository.findOne(findOption);

        if (foundRegistration) {
          filteredRegistrations.push(registration);
        }
      }
    }
    return filteredRegistrations;
  }

  public async getChosenFspConfigurationId({
    registration,
    newFspConfigurationName,
  }: {
    registration: RegistrationEntity;
    newFspConfigurationName: string;
  }): Promise<number> {
    //Identify new FSP
    const newFspConfig = await this.programFspConfigurationRepository.findOne({
      where: {
        name: Equal(newFspConfigurationName),
        programId: Equal(registration.programId),
      },
    });
    if (!newFspConfig) {
      const error = `FSP with this name not found`;
      throw new Error(error);
    }
    return newFspConfig.id;
  }

  public async getDuplicates(
    referenceId: string,
    programId: number,
  ): Promise<DuplicateReponseDto[]> {
    const registration = await this.getRegistrationOrThrow({
      referenceId,
      programId,
    });
    const duplicates = await this.registrationScopedRepository.getDuplicates({
      registrationId: registration.id,
      programId,
    });
    if (duplicates.length === 0) {
      return [];
    }
    const referenceIds = duplicates.map((d) => d.referenceId);
    // Get the full names of the duplicates using the pagination functionality
    // This is done to avoid duplicating the complex logic of retrieving full names, which is already implemented in the pagination service
    // TODO: In the future, this logic should be refactored to reside in the registration repository
    const registrationViews =
      await this.registrationsPaginationService.getRegistrationViewsByReferenceIds(
        {
          programId,
          referenceIds,
        },
      );

    // Add the name to the duplicate information together in one object
    return duplicates.map((duplicate) => {
      const registration = registrationViews.find(
        (r) => r.id === duplicate.registrationId,
      );
      return {
        registrationId: duplicate.registrationId,
        registrationProgramId: duplicate.registrationProgramId,
        attributeNames: duplicate.attributeNames,
        scope: duplicate.scope,
        name: registration?.name,
        isInScope: registration !== undefined,
      };
    });
  }

  public async createUniques({
    registrationIds,
    programId,
    reason,
  }: {
    registrationIds: number[];
    programId: number;
    reason: string;
  }): Promise<void> {
    const uniqueIds = new Set(registrationIds);
    if (uniqueIds.size !== registrationIds.length) {
      // Find the duplicate IDs
      const duplicateIds = registrationIds.filter(
        (id, index) => registrationIds.indexOf(id) !== index,
      );

      const error = `Duplicate registrationIds found in input: ${duplicateIds.join(', ')}`;
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }

    const registrations = await this.registrationScopedRepository.find({
      where: {
        id: In(registrationIds),
        programId: Equal(programId),
      },
      select: ['id'],
    });

    if (registrations.length !== registrationIds.length) {
      const foundIds = registrations.map((reg) => reg.id);
      const missingIds = registrationIds.filter((id) => !foundIds.includes(id));

      const error = `Not all registrations were found in program ${programId}. Expected ${registrationIds.length} but found ${registrations.length}. Missing registraitonIds: ${missingIds.join(', ')}`;
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
    // Generate all possible pairs of registration IDs and create unique entities
    for (let i = 0; i < registrations.length; i++) {
      for (let j = i + 1; j < registrations.length; j++) {
        const registration1Id = registrations[i].id;
        const registration2Id = registrations[j].id;
        await this.createRegistrationUniquePair({
          registration1Id,
          registration2Id,
          reason,
        });
      }
    }
  }

  private async createRegistrationUniquePair({
    registration1Id,
    registration2Id,
    reason,
  }: {
    registration1Id: number;
    registration2Id: number;
    reason: string;
  }): Promise<void> {
    // Sort the IDs to ensure consistency when storing pairs
    const smallerRegistrationId = Math.min(registration1Id, registration2Id);
    const largerRegistrationId = Math.max(registration1Id, registration2Id);

    // Check if this pair already exists
    const existingUniquePair =
      await this.uniqueRegistrationPairRepository.findOne({
        where: {
          smallerRegistrationId: Equal(smallerRegistrationId),
          largerRegistrationId: Equal(largerRegistrationId),
        },
      });

    // If the pair already exists, do nothing (no need to create a new registration event or throw an error)
    if (existingUniquePair) {
      return;
    }

    await this.uniqueRegistrationPairRepository.store({
      smallerRegistrationId,
      largerRegistrationId,
    });

    // Get registration details for the registration event
    const [registration1, registration2] = await Promise.all([
      this.registrationScopedRepository.findOneOrFail({
        where: { id: Equal(smallerRegistrationId) },
      }),
      this.registrationScopedRepository.findOneOrFail({
        where: { id: Equal(largerRegistrationId) },
      }),
    ]);

    // Create registration event
    await this.registrationEventsService.createForIgnoredDuplicatePair({
      registration1: {
        id: registration1.id,
        registrationProgramId: registration1.registrationProgramId,
      },
      registration2: {
        id: registration2.id,
        registrationProgramId: registration2.registrationProgramId,
      },
      reason,
    });
  }

  public async getContactInformation({
    referenceId,
    programId,
  }: {
    referenceId: string;
    programId: number;
  }): Promise<ContactInformation> {
    const dataFieldNames = [
      FspAttributes.addressStreet,
      FspAttributes.addressHouseNumber,
      FspAttributes.addressHouseNumberAddition,
      FspAttributes.addressPostalCode,
      FspAttributes.addressCity,
      FspAttributes.phoneNumber,
      FspAttributes.fullName,
    ];

    const registrationData = (
      await this.registrationsPaginationService.getRegistrationViewsByReferenceIds(
        {
          referenceIds: [referenceId],
          programId,
          select: dataFieldNames,
        },
      )
    )[0];

    if (!registrationData) {
      throw new HttpException(
        `No registration data found for referenceId: ${referenceId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      name: registrationData[FspAttributes.fullName],
      addressStreet: registrationData[FspAttributes.addressStreet],
      addressHouseNumber: registrationData[FspAttributes.addressHouseNumber],
      addressHouseNumberAddition:
        registrationData[FspAttributes.addressHouseNumberAddition],
      addressPostalCode: registrationData[FspAttributes.addressPostalCode],
      addressCity: registrationData[FspAttributes.addressCity],
      phoneNumber: registrationData[FspAttributes.phoneNumber]!,
    };
  }
}
