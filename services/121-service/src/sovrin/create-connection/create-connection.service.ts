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
import { Repository, getRepository } from 'typeorm';
import { DidDto } from '../../programs/program/dto/did.dto';
import { CredentialAttributesEntity } from '../credential/credential-attributes.entity';
import { CredentialRequestEntity } from '../credential/credential-request.entity';
import { FspAttributeEntity } from './../../programs/fsp/fsp-attribute.entity';
import { CredentialEntity } from '../credential/credential.entity';
import { FinancialServiceProviderEntity } from '../../programs/fsp/financial-service-provider.entity';
import { TransactionEntity } from '../../programs/program/transactions.entity';
import { ProgramService } from '../../programs/program/program.service';
import {
  FspAnswersAttrInterface,
  AnswerSet,
} from 'src/programs/fsp/fsp-interface';
import { API } from '../../config';
import { SmsService } from '../../notifications/sms/sms.service';
import { PaStatus } from '../../models/pa-status.model';
import { ConnectionRequestDto } from './dto/connection-request.dto';

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

  public constructor(
    private readonly programService: ProgramService,
    private readonly httpService: HttpService,
    private readonly smsService: SmsService,
    private readonly lookupService: LookupService,
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
        PaStatus.registered,
        programId,
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
  ): Promise<void> {
    const connection = await this.findOne(did);
    if (!connection.phoneNumber) {
      connection.phoneNumber = await this.lookupService.lookupAndCorrect(
        phoneNumber,
      );
    }
    connection.preferredLanguage = preferredLanguage;
    await this.connectionRepository.save(connection);
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
