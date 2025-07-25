import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindOneOptions, In, Repository } from 'typeorm';

import { env } from '@121-service/src/env';
import { EventsService } from '@121-service/src/events/events.service';
import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { getFspSettingByNameOrThrow } from '@121-service/src/fsps/fsp-settings.helpers';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/message-job.dto';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { IntersolveVisaWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisa121ErrorText } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
import { ContactInformation } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/partials/contact-information.interface';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVisaApiError } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-api.error';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
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
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utilts/registration-utils.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { UniqueRegistrationPairRepository } from '@121-service/src/registration/repositories/unique-registration-pair.repository';
import { InclusionScoreService } from '@121-service/src/registration/services/inclusion-score.service';
import { RegistrationsImportService } from '@121-service/src/registration/services/registrations-import.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserEntity } from '@121-service/src/user/user.entity';
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
    private readonly queueMessageService: MessageQueuesService,
    private readonly inclusionScoreService: InclusionScoreService,
    private readonly registrationsImportService: RegistrationsImportService,
    private readonly registrationDataService: RegistrationDataService,
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly userService: UserService,
    private readonly registrationUtilsService: RegistrationUtilsService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly eventsService: EventsService,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly registrationDataScopedRepository: RegistrationDataScopedRepository,
    private readonly registrationsInputValidator: RegistrationsInputValidator,
    private readonly uniqueRegistrationPairRepository: UniqueRegistrationPairRepository,
  ) {}

  // This methods can be used to get the same formattted data as the pagination query using referenceId
  public async getPaginateRegistrationForReferenceId(
    referenceId: string,
    programId: number,
  ) {
    const queryBuilder = this.registrationViewScopedRepository
      .createQueryBuilder('registration')
      .andWhere({ referenceId });
    const paginateResult =
      await this.registrationsPaginationService.getPaginate(
        { path: '' },
        programId,
        true,
        false,
        queryBuilder,
      );
    return paginateResult.data[0];
  }

  // This methods can be used to get the same formattted data as the pagination query using referenceId
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
      await this.registrationsPaginationService.getPaginate(
        { path: '' },
        programId,
        true,
        false,
        queryBuilder,
      );
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
    await this.eventsService.createFromRegistrationViews(
      registrationBeforeUpdate,
      registrationAfterUpdate,
      { explicitRegistrationPropertyNames: ['status'] },
    );
    return registrationAfterUpdate;
  }

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
    this.throwIfProgramIsNotPublished(program.published);
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
    this.throwIfProgramIsNotPublished(program.published);
    return await this.registrationsImportService.importRegistrations(
      jsonData,
      program,
      userId,
    );
  }

  private throwIfProgramIsNotPublished(published: boolean): void {
    if (!published) {
      const errors =
        'Registrations are not allowed for this program yet, try again later.';
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
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
      await this.eventsService.createFromRegistrationViews(
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
    const savedRegistration =
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

    const intersolveVisaAttributeNames = getFspSettingByNameOrThrow(
      Fsps.intersolveVisa,
    ).attributes.map((attr) => attr.name) as string[];
    if (
      env.INTERSOLVE_VISA_SEND_UPDATED_CONTACT_INFORMATION &&
      intersolveVisaAttributeNames.includes(attribute)
    ) {
      await this.sendContactInformationToIntersolve(registration);
    }

    return this.getRegistrationOrThrow({
      referenceId: savedRegistration.referenceId,
      relations: ['program'],
    });
  }

  private async sendContactInformationToIntersolve(
    registration: RegistrationEntity,
  ): Promise<void> {
    const registrationHasVisaCustomer =
      await this.intersolveVisaService.hasIntersolveCustomer(registration.id);
    if (registrationHasVisaCustomer) {
      type ContactInformationKeys = keyof ContactInformation;
      const fieldNames: ContactInformationKeys[] = [
        FspAttributes.addressStreet,
        FspAttributes.addressHouseNumber,
        FspAttributes.addressHouseNumberAddition,
        FspAttributes.addressPostalCode,
        FspAttributes.addressCity,
        FspAttributes.phoneNumber,
      ];
      const registrationData =
        await this.registrationDataScopedRepository.getRegistrationDataArrayByName(
          registration,
          fieldNames,
        );

      if (!registrationData || registrationData.length === 0) {
        throw new HttpException(
          `No registration data found for referenceId: ${registration.referenceId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const mappedRegistrationData = registrationData.reduce(
        (acc, { name, value }) => {
          acc[name] = value;
          return acc;
        },
        {},
      );

      await this.intersolveVisaService.sendUpdatedContactInformation({
        registrationId: registration.id,
        contactInformation: {
          addressStreet: mappedRegistrationData[`addressStreet`],
          addressHouseNumber: mappedRegistrationData[`addressHouseNumber`],
          addressHouseNumberAddition:
            mappedRegistrationData[`addressHouseNumberAddition`],
          addressPostalCode: mappedRegistrationData[`addressPostalCode`],
          addressCity: mappedRegistrationData[`addressCity`],
          phoneNumber: mappedRegistrationData[`phoneNumber`],
        },
      });
    }
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

    // If the pair already exists, do nothing (no need to create a new event or throw an error)
    if (existingUniquePair) {
      return;
    }

    await this.uniqueRegistrationPairRepository.store({
      smallerRegistrationId,
      largerRegistrationId,
    });

    // Get registration details for the event
    const [registration1, registration2] = await Promise.all([
      this.registrationScopedRepository.findOneOrFail({
        where: { id: Equal(smallerRegistrationId) },
      }),
      this.registrationScopedRepository.findOneOrFail({
        where: { id: Equal(largerRegistrationId) },
      }),
    ]);

    // Create event
    await this.eventsService.createForIgnoredDuplicatePair({
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

  public async retrieveAndUpdateIntersolveVisaWalletAndCards(
    referenceId: string,
    programId: number,
  ): Promise<IntersolveVisaWalletDto> {
    const registration = await this.getRegistrationOrThrow({
      referenceId,
      relations: [],
      programId,
    });
    return await this.intersolveVisaService.retrieveAndUpdateWallet(
      registration.id,
    );
  }

  public async getIntersolveVisaWalletAndCards(
    referenceId: string,
    programId: number,
  ): Promise<IntersolveVisaWalletDto> {
    const registration = await this.getRegistrationOrThrow({
      referenceId,
      relations: [],
      programId,
    });
    return await this.intersolveVisaService.getWalletWithCards(registration.id);
  }

  /**
   * This function reissues a visa card and sends a message.
   * - It first retrieves the registration associated with the given reference ID and program ID and he Intersolve Visa configuration for the program.
   * - It than checks that all required data fields are present in the registration data.
   * - It then calls the Intersolve Visa service to reissue the card with the registration data and Intersolve Visa configuration.
   * - Finally, it adds a message to the queue to be sent to the registrant.
   *
   * @param {string} referenceId - The reference ID of the registration.
   * @param {number} programId - The ID of the program.
   * @throws {HttpException} Throws an HttpException if no registration is found for the given reference ID, if no registration data is found for the reference ID, or if a required data field is missing from the registration data.
   * @returns {Promise<void>}
   */
  public async reissueCardAndSendMessage(
    referenceId: string,
    programId: number,
    userId: number,
  ) {
    const registration = await this.getRegistrationOrThrow({
      referenceId,
      programId,
      relations: ['programFspConfiguration'],
    });
    if (
      !registration.programFspConfigurationId ||
      registration.programFspConfiguration?.fspName !== Fsps.intersolveVisa
    ) {
      throw new HttpException(
        `This registration is not associated with the Intersolve Visa Fsp.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const intersolveVisaConfig =
      await this.programFspConfigurationRepository.getPropertiesByNamesOrThrow({
        programFspConfigurationId: registration.programFspConfigurationId,
        names: [
          FspConfigurationProperties.brandCode,
          FspConfigurationProperties.coverLetterCode,
        ],
      });

    //  TODO: REFACTOR: This 'ugly' code is now also in payments.service.createAndAddIntersolveVisaTransactionJobs. This should be refactored when there's a better way of getting registration data.
    const intersolveVisaAttributes = getFspSettingByNameOrThrow(
      Fsps.intersolveVisa,
    ).attributes;

    const intersolveVisaAttributeNames = intersolveVisaAttributes.map(
      (q) => q.name,
    );
    const dataFieldNames = [
      FspAttributes.fullName,
      FspAttributes.phoneNumber,
      ...intersolveVisaAttributeNames,
    ];

    const registrationData =
      await this.registrationDataScopedRepository.getRegistrationDataArrayByName(
        registration,
        dataFieldNames,
      );

    if (!registrationData || registrationData.length === 0) {
      throw new HttpException(
        `No registration data found for referenceId: ${referenceId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const mappedRegistrationData = registrationData.reduce(
      (acc, { name, value }) => {
        acc[name] = value;
        return acc;
      },
      {},
    );

    for (const name of dataFieldNames) {
      if (name === FspAttributes.addressHouseNumberAddition) continue; // Skip non-required property
      if (
        mappedRegistrationData[name] === null ||
        mappedRegistrationData[name] === undefined ||
        mappedRegistrationData[name] === ''
      ) {
        throw new HttpException(
          `Property ${name} is undefined`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    await this.sendContactInformationToIntersolve(registration);

    try {
      await this.intersolveVisaService.reissueCard({
        registrationId: registration.id,
        // Why do we need this?
        reference: registration.referenceId,
        name: mappedRegistrationData[FspAttributes.fullName],
        contactInformation: {
          addressStreet: mappedRegistrationData[FspAttributes.addressStreet],
          addressHouseNumber:
            mappedRegistrationData[FspAttributes.addressHouseNumber],
          addressHouseNumberAddition:
            mappedRegistrationData[FspAttributes.addressHouseNumberAddition],
          addressPostalCode:
            mappedRegistrationData[FspAttributes.addressPostalCode],
          addressCity: mappedRegistrationData[FspAttributes.addressCity],
          phoneNumber: mappedRegistrationData[FspAttributes.phoneNumber], // In the above for loop it is checked that this is not undefined or empty
        },
        brandCode: intersolveVisaConfig.find(
          (c) => c.name === FspConfigurationProperties.brandCode,
        )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
        coverLetterCode: intersolveVisaConfig.find(
          (c) => c.name === FspConfigurationProperties.coverLetterCode,
        )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
      });
    } catch (error) {
      if (error instanceof IntersolveVisaApiError) {
        throw new HttpException(
          `${IntersolveVisa121ErrorText.reissueCard} - ${error.message}`,
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw error;
      }
    }

    await this.queueMessageService.addMessageJob({
      registration,
      messageTemplateKey: ProgramNotificationEnum.reissueVisaCard,
      messageContentType: MessageContentType.custom,
      messageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
      userId,
    });
  }

  /**
   * Pauses or unpauses a card associated with a given token code and sends a message to the registrant.
   * - It retrieves the registration, pauses or unpauses the card, sends a message to the registrant, and returns the updated wallet.
   *
   * @param {string} referenceId - The reference ID of the registration.
   * @param {number} programId - The ID of the program.
   * @param {string} tokenCode - The token code of the card to pause or unpause.
   * @param {boolean} pause - Whether to pause (true) or unpause (false) the card.
   * @throws {HttpException} Throws an HttpException if no registration is found for the given reference ID.
   * @returns {Promise<IntersolveVisaChildWalletEntity>} The updated wallet.
   */
  public async pauseCardAndSendMessage(
    referenceId: string,
    programId: number,
    tokenCode: string,
    pause: boolean,
    userId: number,
  ): Promise<IntersolveVisaChildWalletEntity> {
    const registration = await this.getRegistrationOrThrow({
      referenceId,
      programId,
    });
    const updatedWallet = await this.intersolveVisaService.pauseCardOrThrow(
      tokenCode,
      pause,
    );
    await this.queueMessageService.addMessageJob({
      registration,
      messageTemplateKey: pause
        ? ProgramNotificationEnum.pauseVisaCard
        : ProgramNotificationEnum.unpauseVisaCard,
      messageContentType: MessageContentType.custom,
      messageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
      userId,
    });
    return updatedWallet;
  }

  /**
   * Retrieves a registration by reference ID and program ID, and sends its contact information to Intersolve. Used only for debugging purposes.
   */
  public async getRegistrationAndSendContactInformationToIntersolve(
    referenceId: string,
    programId: number,
  ): Promise<void> {
    const registration = await this.getRegistrationOrThrow({
      referenceId,
      programId,
    });
    await this.sendContactInformationToIntersolve(registration);
  }
}
