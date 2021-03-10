import { LookupService } from './../../notifications/lookup/lookup.service';
import { CustomCriterium } from './../../programs/program/custom-criterium.entity';
import {
  Injectable,
  HttpException,
  HttpStatus,
  HttpService,
} from '@nestjs/common';
import { ConnectionReponseDto } from './dto/connection-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectionEntity } from './connection.entity';
import { Repository, getRepository, IsNull, Not } from 'typeorm';
import { DidDto } from '../../programs/program/dto/did.dto';
import { CredentialAttributesEntity } from '../credential/credential-attributes.entity';
import { CredentialRequestEntity } from '../credential/credential-request.entity';
import { FspAttributeEntity } from './../../programs/fsp/fsp-attribute.entity';
import { CredentialEntity } from '../credential/credential.entity';
import { FinancialServiceProviderEntity } from '../../programs/fsp/financial-service-provider.entity';
import { TransactionEntity } from '../../programs/program/transactions.entity';
import { ProgramEntity } from '../../programs/program/program.entity';
import { ProgramService } from '../../programs/program/program.service';
import {
  FspAnswersAttrInterface,
  AnswerSet,
} from '../../programs/fsp/fsp-interface';
import { API } from '../../config';
import { SmsService } from '../../notifications/sms/sms.service';
import { PaStatus } from '../../models/pa-status.model';
import { ConnectionRequestDto } from './dto/connection-request.dto';
import { BulkImportDto } from './dto/bulk-import.dto';
import { validate } from 'class-validator';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { ActionService } from '../../actions/action.service';
import { AdditionalActionType } from '../../actions/action.entity';

@Injectable()
export class CreateConnectionService {
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;
  @InjectRepository(CredentialAttributesEntity)
  private readonly credentialAttributesRepository: Repository<
    CredentialAttributesEntity
  >;
  @InjectRepository(CredentialRequestEntity)
  private readonly credentialRequestRepository: Repository<
    CredentialRequestEntity
  >;
  @InjectRepository(CredentialEntity)
  private readonly credentialRepository: Repository<CredentialEntity>;
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

  public constructor(
    private readonly programService: ProgramService,
    private readonly httpService: HttpService,
    private readonly smsService: SmsService,
    private readonly lookupService: LookupService,
    private readonly actionService: ActionService,
  ) {}

  // This is for SSI-solution
  public async get(): Promise<ConnectionRequestDto> {
    const connectionRequest = {
      did: 'did:sov:2wJPyULfLLnYTEFYzByfUR',
      nonce: '1234567890',
    };

    return connectionRequest;
  }

  public async create(
    connectionResponse: ConnectionReponseDto,
  ): Promise<ConnectionEntity> {
    let connections = await this.connectionRepository.find({
      where: { did: connectionResponse['did'] },
    });
    if (connections.length > 0) {
      const errors = 'There is already a secure connection with this PA.';
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }

    let connection = new ConnectionEntity();
    connection.did = connectionResponse.did;
    const newConnection = await this.connectionRepository.save(connection);
    return newConnection;
  }

  public async importBulk(
    csvFile,
    programId: number,
    userId: number,
  ): Promise<string> {
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    let importRecords = await this.csvBufferToArray(csvFile.buffer, ',');
    if (Object.keys(importRecords[0]).length === 1) {
      importRecords = await this.csvBufferToArray(importRecords, ';');
    }
    const validatedImportRecords = await this.validateArray(importRecords);

    let countImported = 0;
    for await (const record of validatedImportRecords) {
      let connections = await this.connectionRepository.find({
        where: { phoneNumber: record.phoneNumber },
      });

      if (connections.length === 0) {
        countImported += 1;
        let connection = new ConnectionEntity();
        connection.phoneNumber = await this.lookupService.lookupAndCorrect(
          record.phoneNumber,
        );
        connection.preferredLanguage = 'en';
        connection.namePartnerOrganization = record.namePartnerOrganization;
        connection.importedDate = new Date();
        await this.connectionRepository.save(connection);
      }
    }

    this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.importPeopleAffected,
    );

    return `There are ${countImported} records imported. Note that records with existing phone-numbers are skipped.`;
  }

  private async csvBufferToArray(buffer, separator): Promise<object[]> {
    const stream = new Readable();
    stream.push(buffer.toString());
    stream.push(null);
    let parsedData = [];
    return await new Promise((resolve, reject): void => {
      stream
        .pipe(csv({ separator: separator }))
        .on('error', (error): void => reject(error))
        .on('data', (row): number => parsedData.push(row))
        .on('end', (): void => {
          resolve(parsedData);
        });
    });
  }

  private async validateArray(csvArray): Promise<BulkImportDto[]> {
    const errors = [];
    const validatatedArray = [];
    for (const [i, row] of csvArray.entries()) {
      let importRecord = new BulkImportDto();
      importRecord.phoneNumber = row.phoneNumber;
      importRecord.namePartnerOrganization = row.namePartnerOrganization;
      const result = await validate(importRecord);
      if (result.length > 0) {
        const errorObj = { lineNumber: i + 1, validationError: result };
        errors.push(errorObj);
      }
      validatatedArray.push(importRecord);
    }
    if (errors.length > 0) {
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }
    return validatatedArray;
  }

  public async applyProgram(did: string, programId: number): Promise<void> {
    const connection = await this.findOne(did);
    if (!connection.appliedDate) {
      connection.appliedDate = new Date();
      connection.programsApplied.push(+programId);
      await this.connectionRepository.save(connection);
      this.programService.calculateInclusionPrefilledAnswers(did, programId);
      this.smsService.notifyBySms(
        connection.phoneNumber,
        connection.preferredLanguage,
        programId,
        null,
        PaStatus.registered,
      );
    }
  }

  public async delete(didObject: DidDto): Promise<void> {
    const connection = await this.connectionRepository.findOne({
      where: { did: didObject.did },
    });
    await this.transactionRepository.delete({
      connection: { id: connection.id },
    });

    await this.connectionRepository.delete({
      did: didObject.did,
    });
    await this.credentialAttributesRepository.delete({
      did: didObject.did,
    });
    await this.credentialRequestRepository.delete({
      did: didObject.did,
    });
    await this.credentialRepository.delete({
      did: didObject.did,
    });
  }

  public async addPhone(
    did: string,
    phoneNumber: string,
    preferredLanguage: string,
    useForInvitationMatching?: boolean,
  ): Promise<void> {
    const sanitizedPhoneNr = await this.lookupService.lookupAndCorrect(
      phoneNumber,
    );

    // Find invitedConnection based on phone-number
    const invitedConnection = await this.connectionRepository.findOne({
      where: {
        phoneNumber: sanitizedPhoneNr,
        importedDate: Not(IsNull()),
        accountCreatedDate: IsNull(),
      },
      relations: ['fsp'],
    });

    if (!useForInvitationMatching || !invitedConnection) {
      // If endpoint is used for other purpose OR no invite found  ..
      // .. continue with earlier created connection
      const connection = await this.findOne(did);
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

    // If invite found ..
    // .. find temp connection created at create-identity step and save it
    const tempConnection = await this.connectionRepository.findOne({
      where: { did: did },
      relations: ['fsp'],
    });
    // .. then delete the connection
    await this.delete({ did: did });

    // .. and transfer its relevant attributes to the invite-connection
    invitedConnection.did = tempConnection.did;
    invitedConnection.accountCreatedDate = tempConnection.created;
    invitedConnection.customData = tempConnection.customData;
    const fsp = await this.fspRepository.findOne({
      where: { id: tempConnection.fsp.id },
    });
    invitedConnection.fsp = fsp;

    // .. and store phone number and language
    invitedConnection.phoneNumber = sanitizedPhoneNr;
    invitedConnection.preferredLanguage = preferredLanguage;
    await this.connectionRepository.save(invitedConnection);
  }

  public async addFsp(did: string, fspId: number): Promise<ConnectionEntity> {
    const connection = await this.findOne(did);
    const fsp = await this.fspRepository.findOne(fspId);
    connection.fsp = fsp;
    return await this.connectionRepository.save(connection);
  }

  public async addCustomData(
    did: string,
    customDataKey: string,
    customDataValueRaw: string,
  ): Promise<ConnectionEntity> {
    const connection = await this.findOne(did);
    const customDataValue = await this.cleanData(
      customDataKey,
      customDataValueRaw,
    );
    if (!(customDataKey in connection.customData)) {
      connection.customData[customDataKey] = customDataValue;
    }
    return await this.connectionRepository.save(connection);
  }

  public async cleanData(
    customDataKey: string,
    customDataValue: string,
  ): Promise<string> {
    const answerTypeTel = 'tel';
    const phonenumberTypedAnswers = [];
    const fspTelAttributes = await this.fspAttributeRepository.find({
      where: { answerType: answerTypeTel },
    });
    for (let fspAttr of fspTelAttributes) {
      phonenumberTypedAnswers.push(fspAttr.name);
    }
    const customCriteriumAttrs = await this.customCriteriumRepository.find({
      where: { answerType: answerTypeTel },
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

  public async getDidByPhoneAndOrName(
    phoneNumber?: string,
    name?: string,
  ): Promise<ConnectionEntity[]> {
    const connections = await this.connectionRepository.find();
    return connections.filter(c => {
      return (
        (name &&
          (c.customData['name'] === name ||
            c.customData['nameFirst'] === name ||
            c.customData['nameLast'] === name ||
            c.customData['firstName'] === name ||
            c.customData['secondName'] === name ||
            c.customData['thirdName'] === name)) ||
        (phoneNumber &&
          (c.customData['phoneNumber'] === phoneNumber ||
            c.customData['whatsappPhoneNumber'] === phoneNumber ||
            c.phoneNumber === phoneNumber))
      );
    });
  }

  public async addCustomDataOverwrite(
    did: string,
    customDataKey: string,
    customDataValueRaw: string,
  ): Promise<ConnectionEntity> {
    const customDataValue = await this.cleanData(
      customDataKey,
      customDataValueRaw,
    );
    const connection = await this.findOne(did);
    if (!connection) {
      const errors = 'This PA is not known.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    if (!connection.customData[customDataKey]) {
      const errors = 'This custom data property is not known for this PA.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    connection.customData[customDataKey] = customDataValue;
    return await this.connectionRepository.save(connection);
  }

  public async phoneNumberOverwrite(
    did: string,
    phoneNumber: string,
  ): Promise<ConnectionEntity> {
    const connection = await this.findOne(did);
    if (!connection) {
      const errors = 'This PA is not known.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    phoneNumber = await this.lookupService.lookupAndCorrect(phoneNumber);
    // Save as notification first, in case it is not a known custom-data property, which would yield an HTTP-exception
    connection.phoneNumber = phoneNumber;
    await this.connectionRepository.save(connection);

    return await this.addCustomDataOverwrite(did, 'phoneNumber', phoneNumber);
  }

  public async addQrIdentifier(
    did: string,
    qrIdentifier: string,
  ): Promise<void> {
    const connection = await this.findOne(did);
    const duplicateConnection = await this.connectionRepository.findOne({
      where: { qrIdentifier: qrIdentifier },
    });
    if (duplicateConnection) {
      const errors = 'This QR identifier already exists';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    connection.qrIdentifier = qrIdentifier;
    await this.connectionRepository.save(connection);
  }

  public async findDidWithQrIdentifier(qrIdentifier: string): Promise<DidDto> {
    let connection = await this.connectionRepository.findOne({
      where: { qrIdentifier: qrIdentifier },
    });
    if (!connection) {
      const errors = 'No connection found for QR';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return { did: connection.did };
  }

  public async findOne(did: string): Promise<ConnectionEntity> {
    let connection = await this.connectionRepository.findOne({
      where: { did: did },
    });
    if (!connection) {
      const errors = 'No connection found for PA.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return connection;
  }

  public async getFspAnswersAttributes(
    did: string,
  ): Promise<FspAnswersAttrInterface> {
    const qb = await getRepository(ConnectionEntity)
      .createQueryBuilder('connection')
      .leftJoinAndSelect('connection.fsp', 'fsp')
      .leftJoinAndSelect('fsp.attributes', ' fsp_attribute.fsp')
      .where('connection.did = :did', { did: did });
    const connection = await qb.getOne();
    const fspAnswers = this.getFspAnswers(
      connection.fsp.attributes,
      connection.customData,
    );
    return {
      attributes: connection.fsp.attributes,
      answers: fspAnswers,
      did: did,
    };
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

  public async deleteRegistration(did: string): Promise<void> {
    //1. Delete PA Account
    const wallet = await this.httpService
      .post(API.paAccounts.deleteAccount, {
        did: did,
        apiKey: process.env.PA_API_KEY,
      })
      .toPromise();

    //2. Delete wallet
    await this.httpService
      .post(API.userIMS.deleteWallet, { wallet: JSON.parse(wallet.data) })
      .toPromise();

    //3. Delete data in 121-service
    this.delete({ did });

    console.log(`Deleted PA: ${did}`);
  }
}
