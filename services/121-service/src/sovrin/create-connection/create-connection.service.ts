import { Injectable, HttpException } from '@nestjs/common';
import { ConnectionReponseDto } from './dto/connection-response.dto';
import { ConnectionRequestDto } from './dto/connection-request.dto';
import { DidInfoDto } from './dto/did-info.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectionEntity } from './connection.entity';
import { Repository } from 'typeorm';
import { SovrinSetupService } from '../setup/setup.service';
import { DidDto } from '../../programs/program/dto/did.dto';

@Injectable()
export class CreateConnectionService {
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;

  public constructor(private readonly sovrinSetupService: SovrinSetupService) {}

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
      throw new HttpException({ errors }, 401);
    }

    let connection = new ConnectionEntity();
    connection.did = connectionResponse.did;
    const newConnection = await this.connectionRepository.save(connection);
    return newConnection;
  }

  public async delete(
    didObject: DidDto,
  ) {
    await this.connectionRepository.delete(
      {
        did: didObject.did,
      }
    );
  }


  public async addPhone(
    did: string,
    phoneNumber: string,
    preferredLanguage: string,
  ) {
    const connection = await this.findOne(did);
    connection.phoneNumber = phoneNumber;
    connection.preferredLanguage = preferredLanguage;
    await this.connectionRepository.save(connection);
  }

  public async findOne(did: string): Promise<ConnectionEntity> {
    let connection = await this.connectionRepository.findOne({
      where: { did: did },
    });
    if (!connection) {
      const errors = 'No connection found for PA.';
      throw new HttpException({ errors }, 404);
    }
    return connection;
  }

  public async getConnections(): Promise<ConnectionEntity[]> {
    let connections = await this.connectionRepository.find();
    return connections;
  }

  //This is for Server-side solution
  public async initiateServerside(password: string): Promise<any> {
    `
    ConnectionRequest is generated on server.
    Pool is connected to.
    Wallet for PA is created. Wallet is opened. DID is created and stored in wallet.
    ConnectionResponse is formed based on wallet (no traffic with PA needed, as all on server.)
    Connection is created based on this.
    `;
    // tyknid.getConnectionRequest(connectionResponse.did, connectionResponse.verkey, connectionResponse.meta)`;
    const connectionRequest = {
      did: 'did:sov:2wJPyULfLLnYTEFYzByfUR',
      nonce: '1234567890',
    };

    let poolHandle = await this.sovrinSetupService.connectPool();
    let did_for_ho = await this.sovrinSetupService.createWallet(
      poolHandle,
      connectionRequest,
      password,
    );
    let connectionResponse: ConnectionReponseDto;
    connectionResponse = {
      did: did_for_ho['did_for_ho'],
      verkey: did_for_ho['key_for_ho'],
      nonce: connectionRequest['nonce'],
      meta: 'meta:sample',
    };
    let connection = await this.create(connectionResponse);

    return connection;
  }
}
