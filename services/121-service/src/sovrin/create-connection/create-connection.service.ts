import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConnectionReponseDto } from './dto/connection-response.dto';
import { ConnectionRequestDto } from './dto/connection-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectionEntity } from './connection.entity';
import { Repository } from 'typeorm';
import { DidDto } from '../../programs/program/dto/did.dto';
import { CredentialAttributesEntity } from '../credential/credential-attributes.entity';
import { CredentialRequestEntity } from '../credential/credential-request.entity';
import { CredentialEntity } from '../credential/credential.entity';
import { AppointmentEntity } from '../../schedule/appointment/appointment.entity';
import { FinancialServiceProviderEntity } from '../../programs/fsp/financial-service-provider.entity';

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
  @InjectRepository(AppointmentEntity)
  private readonly appointmentRepository: Repository<AppointmentEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  private readonly fspRepository: Repository<FinancialServiceProviderEntity>;

  public constructor() { }

  // This is for SSI-solution
  public async get(): Promise<ConnectionRequestDto> {
    // tyknid.getConnectionRequest(connectionResponse.did, connectionResponse.verkey, connectionResponse.meta)`;
    const connectionRequest = {
      did: 'did:sov:2wJPyULfLLnYTEFYzByfUR',
      nonce: '1234567890',
    };

    return connectionRequest;
  }

  public async create(
    connectionResponse: ConnectionReponseDto,
  ): Promise<ConnectionEntity> {
    ` assert nonce(connectionResponse.nonce ==== stored.nonce)
      await tyknid.createConnection(connectionResponse.did, connectionResponse.verkey, connectionResponse.meta)`;
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
    await this.appointmentRepository.delete({
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
    connection.customData[customDataKey] = customDataValue;
    return await this.connectionRepository.save(connection);
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

}
