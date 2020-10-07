import {
  Injectable,
  HttpException,
  HttpStatus,
  HttpService,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConnectionReponseDto } from './dto/connection-response.dto';
import { ConnectionRequestDto } from './dto/connection-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectionEntity } from './connection.entity';
import { Repository, getRepository } from 'typeorm';
import { DidDto } from '../../programs/program/dto/did.dto';
import { CredentialAttributesEntity } from '../credential/credential-attributes.entity';
import { CredentialRequestEntity } from '../credential/credential-request.entity';
import { FspAttributeEntity } from './../../programs/fsp/fsp-attribute.entity';
import { CredentialEntity } from '../credential/credential.entity';
import { FinancialServiceProviderEntity } from '../../programs/fsp/financial-service-provider.entity';
import { ProgramService } from '../../programs/program/program.service';
import {
  FspAnswersAttrInterface,
  AnswerSet,
} from 'src/programs/fsp/fsp-interface';
import { API } from '../../config';

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

  public constructor(
    private readonly programService: ProgramService,
    private readonly httpService: HttpService,
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
    }
  }

  public async delete(didObject: DidDto): Promise<void> {
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
    connection.phoneNumber = phoneNumber;
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
    customDataValue: string,
  ): Promise<ConnectionEntity> {
    const connection = await this.findOne(did);
    if (!(customDataKey in connection.customData)) {
      connection.customData[customDataKey] = customDataValue;
    }
    return await this.connectionRepository.save(connection);
  }

  public async addCustomDataOverwrite(
    did: string,
    customDataKey: string,
    customDataValue: string,
  ): Promise<ConnectionEntity> {
    const connection = await this.findOne(did);
    connection.customData[customDataKey] = customDataValue;
    return await this.connectionRepository.save(connection);
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

  public async getConnections(): Promise<ConnectionEntity[]> {
    let connections = await this.connectionRepository.find();
    return connections;
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
