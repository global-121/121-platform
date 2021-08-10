import { LookupService } from '../../notifications/lookup/lookup.service';
import { ValidationIssueDataDto } from './dto/validation-issue-data.dto';
import {
  Injectable,
  HttpException,
  Inject,
  forwardRef,
  HttpStatus,
} from '@nestjs/common';
import { ProgramEntity } from '../../programs/program/program.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, getRepository } from 'typeorm';
import { ProgramService } from '../../programs/program/program.service';
import { PrefilledAnswerDto } from './dto/prefilled-answers.dto';
import { ValidationDataAttributesEntity } from './validation-attributes.entity';
import { ConnectionEntity } from '../connection.entity';
import { UserEntity } from '../../user/user.entity';
import { DownloadData } from './interfaces/download-data.interface';
import {
  FspAnswersAttrInterface,
  AnswerSet,
} from '../../programs/fsp/fsp-interface';
import { FspAttributeEntity } from '../../programs/fsp/fsp-attribute.entity';
import { CustomCriterium } from 'src/programs/program/custom-criterium.entity';
import {
  AnswerTypes,
  CustomDataAttributes,
} from './dto/custom-data-attributes';

@Injectable()
export class ValidationDataService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ValidationDataAttributesEntity)
  private readonly validationDataAttributesRepository: Repository<
    ValidationDataAttributesEntity
  >;
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;
  @InjectRepository(FspAttributeEntity)
  private readonly fspAttributeRepository: Repository<FspAttributeEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;

  public constructor(
    @Inject(forwardRef(() => ProgramService))
    private readonly programService: ProgramService,
    private readonly lookupService: LookupService,
  ) {}

  // PA: get attributes based on programId
  public async getAttributes(programId: number): Promise<any[]> {
    let selectedProgram = await this.programService.findOne(programId);
    let attributes = [];
    if (selectedProgram) {
      for (let criterium of selectedProgram.programQuestions) {
        attributes.push(criterium);
      }
    } else {
      const errors = 'Program does not exist or is not published';
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    return attributes;
  }

  // PA: post answers to attributes
  public async uploadPrefilledAnswers(
    referenceId: string,
    programId: number,
    prefilledAnswersRaw: PrefilledAnswerDto[],
  ): Promise<any[]> {
    //Then save new information
    const prefilledAnswers = await this.cleanAnswers(
      prefilledAnswersRaw,
      programId,
    );
    let validationDatas = [];
    for (let answer of prefilledAnswers) {
      const oldAttribute = await this.validationDataAttributesRepository.findOne(
        {
          where: {
            referenceId: referenceId,
            programId: programId,
            attribute: answer.attribute,
          },
        },
      );
      if (oldAttribute) {
        oldAttribute.answer = answer.answer;
        const oldValidationData = await this.validationDataAttributesRepository.save(
          oldAttribute,
        );
        validationDatas.push(oldValidationData);
      } else {
        let validationData = new ValidationDataAttributesEntity();
        validationData.referenceId = referenceId;
        validationData.attributeId = answer.attributeId;
        validationData.attribute = answer.attribute;
        validationData.answer = answer.answer;
        let newValidationData;
        validationData.programId = programId;

        newValidationData = await this.validationDataAttributesRepository.save(
          validationData,
        );
        validationDatas.push(newValidationData);
      }
    }

    const connection = await this.connectionRepository.findOne({
      where: { referenceId: referenceId },
    });
    if (
      !connection.customData ||
      Object.keys(connection.customData).length === 0
    ) {
      await this.storePersistentAnswers(
        prefilledAnswers,
        programId,
        referenceId,
      );
    }
    return validationDatas;
  }

  public async cleanAnswers(
    answers: PrefilledAnswerDto[],
    programId: number,
  ): Promise<PrefilledAnswerDto[]> {
    const program = await this.programService.findOne(programId);
    const phonenumberTypedAnswers = [];
    for (let criterium of program.programQuestions) {
      if (criterium.answerType == AnswerTypes.tel) {
        phonenumberTypedAnswers.push(criterium.name);
      }
    }
    const fspTelAttributes = await this.fspAttributeRepository.find({
      where: { answerType: AnswerTypes.tel },
    });
    for (let fspAttr of fspTelAttributes) {
      phonenumberTypedAnswers.push(fspAttr.name);
    }

    const cleanedAnswers = [];
    for (let answer of answers) {
      if (phonenumberTypedAnswers.includes(answer.attribute)) {
        answer.answer = await this.lookupService.lookupAndCorrect(
          answer.answer,
        );
      }
      cleanedAnswers.push(answer);
    }
    return cleanedAnswers;
  }

  public async storePersistentAnswers(
    answersRaw,
    programId,
    referenceId,
  ): Promise<void> {
    const answers = await this.cleanAnswers(answersRaw, programId);
    let program = await this.programRepository.findOne(programId, {
      relations: ['programQuestions'],
    });
    const persistentCriteria = [];
    for (let criterium of program.programQuestions) {
      if (criterium.persistence) {
        persistentCriteria.push(criterium.name);
      }
    }

    let connection = await this.connectionRepository.findOne({
      where: { referenceId: referenceId },
    });

    const customDataToStore = {};
    for (let answer of answers) {
      if (persistentCriteria.includes(answer.attribute)) {
        customDataToStore[answer.attribute] = answer.answer;
      }
      if (answer.attribute === CustomDataAttributes.phoneNumber) {
        connection.phoneNumber = answer.answer;
      }
    }
    connection.customData = JSON.parse(JSON.stringify(customDataToStore));
    await this.connectionRepository.save(connection);
  }

  // AW: get answers to attributes for a given PA (identified first through referenceId/QR)
  public async getPrefilledAnswers(
    referenceId: string,
    programId: number,
  ): Promise<ValidationDataAttributesEntity[]> {
    let validationData;
    validationData = await this.validationDataAttributesRepository.find({
      where: { referenceId: referenceId, programId: programId },
    });
    return validationData;
  }

  public async downloadData(userId: number): Promise<DownloadData> {
    const user = await this.userRepository.findOne(userId, {
      relations: ['assignedProgram'],
    });
    if (!user || !user.assignedProgram || user.assignedProgram.length === 0) {
      const errors = 'User not found or no assigned programs';
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    const data = {
      answers: await this.getAllPrefilledAnswers(user),
      fspData: await this.getAllFspAnswerData(),
      qrConnectionMapping: await this.getQrConnectionMapping(),
    };
    return data;
  }

  public async getAllPrefilledAnswers(
    user: UserEntity,
  ): Promise<ValidationDataAttributesEntity[]> {
    const programIds = user.assignedProgram.map(program => {
      return { programId: program.id };
    });
    const answers = await this.validationDataAttributesRepository.find({
      where: programIds,
    });
    return answers;
  }

  public async getAllFspAnswerData(): Promise<FspAnswersAttrInterface[]> {
    const connections = await getRepository(ConnectionEntity)
      .createQueryBuilder('connection')
      .leftJoinAndSelect('connection.fsp', 'fsp')
      .leftJoinAndSelect('fsp.attributes', ' fsp_attribute.fsp')
      .where('connection.fsp IS NOT NULL')
      .andWhere('connection.validationDate IS NULL') // Filter to only download data for PA's not validated yet
      .getMany();

    const fspDataPerConnection = [];
    for (const connection of connections) {
      const answers = this.getFspAnswers(
        connection.fsp.attributes,
        connection.customData,
      );
      const fspData = {
        attributes: connection.fsp.attributes,
        answers: answers,
        referenceId: connection.referenceId,
      };
      fspDataPerConnection.push(fspData);
    }
    return fspDataPerConnection;
  }

  public getFspAnswers(
    fspAttributes: FspAttributeEntity[],
    customData: JSON,
  ): AnswerSet {
    const fspAttributeNames = [];
    for (const attribute of fspAttributes) {
      fspAttributeNames.push(attribute.name);
    }
    const fspCustomData = {};
    for (const key in customData) {
      if (fspAttributeNames.includes(key)) {
        fspCustomData[key] = {
          code: key,
          value: customData[key],
        };
      }
    }
    return fspCustomData;
  }

  public async getQrConnectionMapping(): Promise<ConnectionEntity[]> {
    return await this.connectionRepository
      .createQueryBuilder('connection')
      .select(['connection.qrIdentifier', 'connection.referenceId'])
      .where('connection.validationDate IS NULL') // Filter to only download data for PA's not validated yet
      .getMany();
  }

  // AW: delete answers to attributes for a given PA after issuing validationData (identified first through referenceId/QR)
  public async deletePrefilledAnswers(
    referenceId: string,
    programId: number,
  ): Promise<DeleteResult> {
    return await this.validationDataAttributesRepository.delete({
      referenceId: referenceId,
      programId: programId,
    });
  }

  // Used by Aidworker
  public async issueValidation(payload: ValidationIssueDataDto): Promise<void> {
    await this.storePersistentAnswers(
      payload.attributes,
      payload.programId,
      payload.referenceId,
    );

    await this.uploadPrefilledAnswers(
      payload.referenceId,
      payload.programId,
      payload.attributes,
    );

    await this.calculateInclusionScore(payload.referenceId, payload.programId);

    await this.deletePrefilledAnswers(payload.referenceId, payload.programId);

    await this.updateConnectionStatus(payload.referenceId);
  }

  private async updateConnectionStatus(referenceId): Promise<void> {
    let connection = await this.connectionRepository.findOne({
      where: { referenceId: referenceId },
    });
    connection.validationDate = new Date();
    await this.connectionRepository.save(connection);
  }

  public async calculateInclusionScore(
    referenceId: string,
    programId: number,
  ): Promise<void> {
    const scoreList = await this.createQuestionAnswerListPrefilled(
      referenceId,
      programId,
    );

    let program = await this.programRepository.findOne(programId, {
      relations: ['programQuestions'],
    });
    // const score = this.calculateScoreAllCriteria(
    //   program.programQuestions,
    //   scoreList,
    // );
    let connection = await this.connectionRepository.findOne({
      where: { referenceId: referenceId },
    });

    // connection.inclusionScore = score;

    await this.connectionRepository.save(connection);
  }

  private async createQuestionAnswerListPrefilled(
    referenceId: string,
    programId: number,
  ): Promise<object> {
    const prefilledAnswers = await this.getPrefilledAnswers(
      referenceId,
      programId,
    );
    const scoreList = {};
    for (let prefilledAnswer of prefilledAnswers) {
      let attrValue = prefilledAnswer.answer;
      let newKeyName = prefilledAnswer.attribute;
      scoreList[newKeyName] = attrValue;
    }
    return scoreList;
  }

  private calculateScoreAllCriteria(
    programCriteria: CustomCriterium[],
    scoreList: object,
  ): number {
    let totalScore = 0;
    for (let criterium of programCriteria) {
      let criteriumName = criterium.criterium;
      if (scoreList[criteriumName]) {
        let answerPA = scoreList[criteriumName];
        switch (criterium.answerType) {
          case 'dropdown': {
            totalScore =
              totalScore + this.getScoreForDropDown(criterium, answerPA);
          }
          case 'numeric':
            totalScore =
              totalScore + this.getScoreForNumeric(criterium, answerPA);
        }
      }
    }
    return totalScore;
  }

  private getScoreForDropDown(
    criterium: CustomCriterium,
    answerPA: object,
  ): number {
    // If questions has no scoring system return 0;
    if (Object.keys(criterium.scoring).length === 0) {
      return 0;
    }
    let score = 0;
    const options = JSON.parse(JSON.stringify(criterium.options));
    for (let value of options) {
      if (value.option == answerPA) {
        score = criterium.scoring[value.option];
      }
    }
    return score;
  }

  private getScoreForNumeric(
    criterium: CustomCriterium,
    answerPA: number,
  ): number {
    let score = 0;
    if (criterium.scoring['multiplier']) {
      if (isNaN(answerPA)) {
        answerPA = 0;
      }
      score = criterium.scoring['multiplier'] * answerPA;
    }
    return score;
  }
}
