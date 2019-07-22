import { Injectable } from '@nestjs/common';
import { ConnectionReponseDto } from './dto/connection-response.dto';
import { ConnectionRequestDto } from './dto/connection-request.dto';
import { DidInfoDto } from './dto/did-info.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectionEntity } from './connection.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CreateConnectionService {
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;

  public constructor() {}
  
  public async get(): Promise<ConnectionRequestDto> {
    // tyknid.getConnectionRequest(connectionResponse.did, connectionResponse.verkey, connectionResponse.meta)`;
    const connectionRequest = {
      did: 'did:sov:2wJPyULfLLnYTEFYzByfUR',
      nonce: '1234567890',
    };
    return connectionRequest;
  }

  public async create(connectionResponse: ConnectionReponseDto): Promise<ConnectionEntity> {
    ` assert nonce(connectionResponse.nonce ==== stored.nonce)
      await tyknid.createConnection(connectionResponse.did, connectionResponse.verkey, connectionResponse.meta)`;
    let connection = new ConnectionEntity;
    connection.did = connectionResponse.did;
    const newConnection = await this.connectionRepository.save(connection);
    console.log(connectionResponse);
    return newConnection;
  }

  public async addLedger(didInfo: DidInfoDto): Promise<void> {
    ` decryptedMessage = await tyknid.decrypt(DidInfoDto)
      tyknid.addDidLedger(decryptedMessage.did, decryptedMessage.verkey)`;
    console.log(didInfo);
  }

  public async getConnections(): Promise<ConnectionEntity[]> {
    let connections = await this.connectionRepository.find();
    return connections;
  }

}
