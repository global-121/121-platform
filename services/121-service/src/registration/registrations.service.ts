import { SmsService } from './../notifications/sms/sms.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, In, IsNull, Not, Repository } from 'typeorm';
import { ProgramEntity } from '../programs/program/program.entity';
import { UserEntity } from '../user/user.entity';
import { RegistrationEntity } from './registration.entity';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import {
  ProgramAnswer,
  StoreProgramAnswersDto,
} from './dto/store-program-answers.dto';
import { ProgramAnswerEntity } from './program-answer.entity';
import {
  AnswerTypes,
  CustomDataAttributes,
} from '../connection/validation-data/dto/custom-data-attributes';
import { LookupService } from '../notifications/lookup/lookup.service';
import { ProgramQuestionEntity } from '../programs/program/program-question.entity';
import { FspAttributeEntity } from '../programs/fsp/fsp-attribute.entity';
import { FinancialServiceProviderEntity } from '../programs/fsp/financial-service-provider.entity';
import { LanguageEnum } from './enum/language.enum';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';

@Injectable()
export class RegistrationsService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(RegistrationStatusChangeEntity)
  private readonly registrationStatusChangeRepository: Repository<
    RegistrationStatusChangeEntity
  >;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramAnswerEntity)
  private readonly programAnswerRepository: Repository<ProgramAnswerEntity>;
  @InjectRepository(ProgramQuestionEntity)
  private readonly programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  private readonly fspRepository: Repository<FinancialServiceProviderEntity>;
  @InjectRepository(FspAttributeEntity)
  private readonly fspAttributeRepository: Repository<FspAttributeEntity>;

  public constructor(
    private readonly lookupService: LookupService,
    private readonly smsService: SmsService,
  ) {}

  private async findUserOrThrow(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne(userId);
    if (!user) {
      const errors = 'This user is not known.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return user;
  }

  public async create(
    postData: CreateRegistrationDto,
    userId: number,
  ): Promise<RegistrationEntity> {
    const user = await this.findUserOrThrow(userId);
    let registration = new RegistrationEntity();
    registration.referenceId = postData.referenceId;
    registration.user = user;
    registration.program = await this.programRepository.findOne(
      postData.programId,
    );
    await this.registrationRepository.save(registration);
    return this.setRegistrationStatus(
      postData.referenceId,
      RegistrationStatusEnum.startedRegistation,
    );
  }

  public async setRegistrationStatus(
    referenceId: string,
    status: RegistrationStatusEnum,
  ): Promise<RegistrationEntity> {
    const registrationToUpdate = await this.getRegistrationFromReferenceId(
      referenceId,
    );
    registrationToUpdate.registrationStatus = status;
    return await this.registrationRepository.save(registrationToUpdate);
  }

  private async getRegistrationFromReferenceId(
    referenceId: string,
    relations: string[] = [],
  ): Promise<RegistrationEntity> {
    const registration = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
      relations: relations,
    });
    if (!registration) {
      const errors = 'This referenceId is not known.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return registration;
  }

  public async storeProgramAnswers(
    storeProgramAnswersDto: StoreProgramAnswersDto,
  ): Promise<void> {
    const registration = await this.getRegistrationFromReferenceId(
      storeProgramAnswersDto.referenceId,
      ['program'],
    );
    const programAnswers = await this.cleanAnswers(
      storeProgramAnswersDto.programAnswers,
      registration.program.id,
    );
    for (let answer of programAnswers) {
      const programQuestion = await this.programQuestionRepository.findOne({
        where: { name: answer.programQuestionName },
      });
      const oldAnswer = await this.programAnswerRepository.findOne({
        where: {
          registration: { id: registration.id },
          programQuestion: { id: programQuestion.id },
        },
      });
      if (oldAnswer) {
        oldAnswer.programAnswer = answer.programAnswer;
        await this.programAnswerRepository.save(oldAnswer);
      } else {
        let newAnswer = new ProgramAnswerEntity();
        newAnswer.registration = registration;
        newAnswer.programQuestion = programQuestion;
        newAnswer.programAnswer = answer.programAnswer;
        await this.programAnswerRepository.save(newAnswer);
      }
    }

    await this.storePersistentAnswers(
      programAnswers,
      registration.program.id,
      storeProgramAnswersDto.referenceId,
    );
  }

  public async cleanAnswers(
    programAnswers: ProgramAnswer[],
    programId: number,
  ): Promise<ProgramAnswer[]> {
    const program = await this.programRepository.findOne(programId, {
      relations: ['programQuestions'],
    });
    const phonenumberTypedAnswers = [];
    for (let programQuestion of program.programQuestions) {
      if (programQuestion.answerType == AnswerTypes.tel) {
        phonenumberTypedAnswers.push(programQuestion.name);
      }
    }
    // const fspTelAttributes = await this.fspAttributeRepository.find({
    //   where: { answerType: AnswerTypes.tel },
    // });
    // for (let fspAttr of fspTelAttributes) {
    //   phonenumberTypedAnswers.push(fspAttr.name);
    // }

    const cleanedAnswers = [];
    for (let programAnswer of programAnswers) {
      if (phonenumberTypedAnswers.includes(programAnswer.programQuestionName)) {
        programAnswer.programAnswer = await this.lookupService.lookupAndCorrect(
          programAnswer.programAnswer,
        );
      }
      cleanedAnswers.push(programAnswer);
    }
    return cleanedAnswers;
  }

  public async storePersistentAnswers(
    programAnswers: ProgramAnswer[],
    programId: number,
    referenceId: string,
  ): Promise<void> {
    const cleanedAnswers = await this.cleanAnswers(programAnswers, programId);
    const program = await this.programRepository.findOne(programId, {
      relations: ['programQuestions'],
    });
    const persistentQuestions = [];
    for (let question of program.programQuestions) {
      if (question.persistence) {
        persistentQuestions.push(question.name);
      }
    }

    const registration = await this.getRegistrationFromReferenceId(referenceId);
    let customDataToStore;
    if (!registration.customData) {
      customDataToStore = {};
    } else {
      customDataToStore = registration.customData;
    }

    for (let answer of cleanedAnswers) {
      if (persistentQuestions.includes(answer.programQuestionName)) {
        customDataToStore[answer.programQuestionName] = answer.programAnswer;
      }
      if (answer.programQuestionName === CustomDataAttributes.phoneNumber) {
        registration.phoneNumber = answer.programAnswer;
      }
    }
    registration.customData = JSON.parse(JSON.stringify(customDataToStore));
    await this.registrationRepository.save(registration);
  }

  public async addFsp(
    referenceId: string,
    fspId: number,
  ): Promise<RegistrationEntity> {
    const registration = await this.getRegistrationFromReferenceId(referenceId);
    const fsp = await this.fspRepository.findOne({
      where: { id: fspId },
    });
    registration.fsp = fsp;
    return await this.registrationRepository.save(registration);
  }

  public async addCustomData(
    referenceId: string,
    customDataKey: string,
    customDataValueRaw: string,
  ): Promise<RegistrationEntity> {
    const connection = await this.getRegistrationFromReferenceId(referenceId);
    const customDataValue = await this.cleanCustomDataIfPhoneNr(
      customDataKey,
      customDataValueRaw,
    );
    if (!(customDataKey in connection.customData)) {
      connection.customData[customDataKey] = customDataValue;
    }
    return await this.registrationRepository.save(connection);
  }

  public async cleanCustomDataIfPhoneNr(
    customDataKey: string,
    customDataValue: string,
  ): Promise<string> {
    const answersTypeTel = [];
    const fspAttributesTypeTel = await this.fspAttributeRepository.find({
      where: { answerType: AnswerTypes.tel },
    });
    for (let fspAttr of fspAttributesTypeTel) {
      answersTypeTel.push(fspAttr.name);
    }
    const programQuestionsTypeTel = await this.programQuestionRepository.find({
      where: { answerType: AnswerTypes.tel },
    });
    for (let question of programQuestionsTypeTel) {
      answersTypeTel.push(question.name);
    }
    if (answersTypeTel.includes(customDataKey)) {
      return await this.lookupService.lookupAndCorrect(customDataValue);
    } else {
      return customDataValue;
    }
  }

  public async addPhone(
    referenceId: string,
    phoneNumber: string,
    preferredLanguage: LanguageEnum,
    useForInvitationMatching?: boolean,
  ): Promise<void> {
    const sanitizedPhoneNr = await this.lookupService.lookupAndCorrect(
      phoneNumber,
    );

    const importedRegistration = await this.findImportedRegistrationByPhoneNumber(
      sanitizedPhoneNr,
    );
    console.log('importedRegistration: ', importedRegistration);
    const currentRegistration = await this.getRegistrationFromReferenceId(
      referenceId,
      ['fsp'],
    );
    console.log('currentRegistration: ', currentRegistration);

    if (!useForInvitationMatching || !importedRegistration) {
      // If endpoint is used for other purpose OR no imported registration found  ..
      // .. continue with current registration
      // .. and store phone number and language
      if (!currentRegistration.phoneNumber) {
        currentRegistration.phoneNumber = sanitizedPhoneNr;
      }
      currentRegistration.preferredLanguage = preferredLanguage;
      await this.registrationRepository.save(currentRegistration);
      return;
    }

    // If imported registration found ..
    // .. then transfer relevant attributes from current registration to imported registration
    importedRegistration.referenceId = currentRegistration.referenceId;
    importedRegistration.customData = currentRegistration.customData;
    const fsp = await this.fspRepository.findOne({
      where: { id: currentRegistration.fsp.id },
    });
    console.log('fsp: ', fsp);
    importedRegistration.fsp = fsp;

    // .. and store phone number and language
    importedRegistration.phoneNumber = sanitizedPhoneNr;
    importedRegistration.preferredLanguage = preferredLanguage;

    // .. and set the registration status to 'startedRegistation'
    importedRegistration.registrationStatus =
      RegistrationStatusEnum.startedRegistation;

    // .. then delete the current registration
    await this.registrationStatusChangeRepository.delete({
      registration: currentRegistration,
    });
    await this.registrationRepository.remove(currentRegistration);

    // .. and save the updated import-registration
    await this.registrationRepository.save(importedRegistration);
  }

  private async findImportedRegistrationByPhoneNumber(
    phoneNumber: string,
  ): Promise<RegistrationEntity> {
    const importStatuses = [
      RegistrationStatusEnum.imported,
      RegistrationStatusEnum.invited,
      RegistrationStatusEnum.noLongerEligible,
    ];
    return await this.registrationRepository.findOne({
      where: {
        phoneNumber: phoneNumber,
        registrationStatus: In(importStatuses),
      },
      relations: ['fsp'],
    });
  }

  public async register(referenceId: string): Promise<void> {
    const registration = await this.getRegistrationFromReferenceId(
      referenceId,
      ['program'],
    );

    if (
      RegistrationStatusEnum.startedRegistation !==
      registration.registrationStatus
    ) {
      const errors = `Registration status is not 'startedRegistration'`;
      throw new HttpException(errors, HttpStatus.NOT_FOUND);
    }

    await this.registrationRepository.save(registration);
    // this.calculateInclusionScore(referenceId, programId);
    this.smsService.notifyBySms(
      registration.phoneNumber,
      registration.preferredLanguage,
      registration.program.id,
      null,
      RegistrationStatusEnum.registered,
    );
  }
}
