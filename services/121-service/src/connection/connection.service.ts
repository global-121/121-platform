import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectionEntity } from './connection.entity';
import { Repository, Not, IsNull, getRepository } from 'typeorm';
import { ValidationDataAttributesEntity } from './validation-data/validation-attributes.entity';
import { FinancialServiceProviderEntity } from '../programs/fsp/financial-service-provider.entity';
import { FspAttributeEntity } from '../programs/fsp/fsp-attribute.entity';
import { CustomCriterium } from '../programs/program/custom-criterium.entity';
import { TransactionEntity } from '../programs/program/transactions.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { ValidationDataService } from './validation-data/validation-data.service';
import { SmsService } from '../notifications/sms/sms.service';
import { LookupService } from '../notifications/lookup/lookup.service';
import { ActionService } from '../actions/action.service';
import { validate } from 'class-validator';
import { AnswerTypes } from './validation-data/dto/custom-data-attributes';
import { ReferenceIdDto } from '../programs/program/dto/reference-id.dto';
import {
  FspAnswersAttrInterface,
  AnswerSet,
} from '../programs/fsp/fsp-interface';
import { Attributes } from '../registration/dto/update-attribute.dto';

@Injectable()
export class ConnectionService {
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;
  @InjectRepository(ValidationDataAttributesEntity)
  private readonly validationAttributesRepository: Repository<
    ValidationDataAttributesEntity
  >;
  @InjectRepository(FinancialServiceProviderEntity)
  private readonly fspRepository: Repository<FinancialServiceProviderEntity>;
  @InjectRepository(FspAttributeEntity)
  private readonly fspAttributeRepository: Repository<FspAttributeEntity>;
  @InjectRepository(CustomCriterium)
  private readonly customCriteriumRepository: Repository<CustomCriterium>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ValidationDataAttributesEntity)
  private readonly validationDataAttributesRepository: Repository<
    ValidationDataAttributesEntity
  >;

  public constructor(
    private readonly validationDataService: ValidationDataService,
    private readonly smsService: SmsService,
    private readonly lookupService: LookupService,
    private readonly actionService: ActionService,
  ) {}

  public async create(referenceId: string): Promise<ConnectionEntity> {
    let connection = new ConnectionEntity();
    connection.referenceId = referenceId;
    connection.accountCreatedDate = new Date();
    const newConnection = await this.connectionRepository.save(connection);
    return newConnection;
  }

  public async delete(referenceId: string): Promise<void> {
    const connection = await this.connectionRepository.findOne({
      where: { referenceId: referenceId },
    });
    await this.transactionRepository.delete({
      connection: { id: connection.id },
    });

    await this.connectionRepository.delete({
      referenceId: referenceId,
    });
    await this.validationAttributesRepository.delete({
      referenceId: referenceId,
    });
  }

  public async addPhone(
    referenceId: string,
    phoneNumber: string,
    preferredLanguage: string,
    useForInvitationMatching?: boolean,
  ): Promise<void> {
    const sanitizedPhoneNr = await this.lookupService.lookupAndCorrect(
      phoneNumber,
    );

    const importedConnection = await this.findImportedConnectionByPhoneNumber(
      sanitizedPhoneNr,
    );

    if (!useForInvitationMatching || !importedConnection) {
      // If endpoint is used for other purpose OR no imported connection found  ..
      // .. continue with earlier created connection
      const connection = await this.findConnectionOrThrow(referenceId);
      // .. give it an accountCreatedDate
      connection.accountCreatedDate = new Date();
      // .. and store phone number and language
      if (!connection.phoneNumber) {
        connection.phoneNumber = sanitizedPhoneNr;
      }
      connection.preferredLanguage = preferredLanguage;
      await this.connectionRepository.save(connection);
      return;
    }

    // If imported connection found ..
    // .. find temp connection created at create-account step and save it
    const tempConnection = await this.connectionRepository.findOne({
      where: { referenceId: referenceId },
      relations: ['fsp'],
    });
    // .. then delete the connection
    await this.connectionRepository.delete({
      referenceId: referenceId,
    });

    // .. and transfer its relevant attributes to the invite-connection
    importedConnection.referenceId = tempConnection.referenceId;
    importedConnection.accountCreatedDate = tempConnection.accountCreatedDate;
    importedConnection.customData = tempConnection.customData;
    importedConnection.preferredLanguage = preferredLanguage;
    const fsp = await this.fspRepository.findOne({
      where: { id: tempConnection.fsp.id },
    });
    importedConnection.fsp = fsp;

    // .. and store phone number and language
    importedConnection.phoneNumber = sanitizedPhoneNr;
    importedConnection.preferredLanguage = preferredLanguage;
    await this.connectionRepository.save(importedConnection);
  }

  private async findImportedConnectionByPhoneNumber(
    phoneNumber: string,
  ): Promise<ConnectionEntity> {
    return await this.connectionRepository.findOne({
      where: {
        phoneNumber: phoneNumber,
        importedDate: Not(IsNull()),
        accountCreatedDate: IsNull(),
      },
      relations: ['fsp'],
    });
  }

  public async addFsp(
    referenceId: string,
    fspId: number,
  ): Promise<ConnectionEntity> {
    const connection = await this.findConnectionOrThrow(referenceId);
    const fsp = await this.fspRepository.findOne({
      where: { id: fspId },
      relations: ['attributes'],
    });
    connection.fsp = fsp;
    return await this.connectionRepository.save(connection);
  }

  public async addCustomData(
    referenceId: string,
    customDataKey: string,
    customDataValueRaw: string,
  ): Promise<ConnectionEntity> {
    const connection = await this.findConnectionOrThrow(referenceId);
    const customDataValue = await this.cleanData(
      customDataKey,
      customDataValueRaw,
    );
    if (!(customDataKey in connection.customData)) {
      connection.customData[customDataKey] = customDataValue;
    }
    return await this.connectionRepository.save(connection);
  }

  private async findConnectionOrThrow(
    referenceId: string,
  ): Promise<ConnectionEntity> {
    const connection = await this.connectionRepository.findOne({
      where: { referenceId: referenceId },
    });
    if (!connection) {
      const errors = 'This PA is not known.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return connection;
  }

  public async updateAttribute(
    referenceId: string,
    attribute: Attributes,
    value: string | number,
  ): Promise<ConnectionEntity> {
    const connection = await this.findConnectionOrThrow(referenceId);
    let attributeFound = false;

    if (typeof connection[attribute] !== 'undefined') {
      connection[attribute] = value;
      attributeFound = true;
    }
    if (
      connection.customData &&
      typeof connection.customData[attribute] !== 'undefined'
    ) {
      connection.customData[attribute] = await this.cleanData(
        attribute,
        String(value),
      );
      attributeFound = true;
    }

    if (!attributeFound) {
      const errors = 'This attribute is not known for this Person Affected.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const errors = await validate(connection);
    if (errors.length > 0) {
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    return await this.connectionRepository.save(connection);
  }

  public async cleanData(
    customDataKey: string,
    customDataValue: string,
  ): Promise<string> {
    const phonenumberTypedAnswers = [];
    const fspTelAttributes = await this.fspAttributeRepository.find({
      where: { answerType: AnswerTypes.tel },
    });
    for (let fspAttr of fspTelAttributes) {
      phonenumberTypedAnswers.push(fspAttr.name);
    }
    const customCriteriumAttrs = await this.customCriteriumRepository.find({
      where: { answerType: AnswerTypes.tel },
    });
    for (let criteriumAttr of customCriteriumAttrs) {
      phonenumberTypedAnswers.push(criteriumAttr.criterium);
    }
    if (phonenumberTypedAnswers.includes(customDataKey)) {
      return await this.lookupService.lookupAndCorrect(customDataValue);
    } else {
      return customDataValue;
    }
  }
}
