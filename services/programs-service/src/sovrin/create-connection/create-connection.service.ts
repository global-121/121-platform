import { Injectable } from '@nestjs/common';
import { ConnectionReponseDto } from './dto/connection-response.dto';
import { ConnectionRequestDto } from './dto/connection-request.dto';
import { DidInfoDto } from './dto/did-info.dto';

@Injectable()
export class CreateConnectionService {
  public async get(): Promise<ConnectionRequestDto> {
    // tyknid.getConnectionRequest(connectionResponse.did, connectionResponse.verkey, connectionResponse.meta)`;
    const connectionRequest = {
      did: 'did:sov:2wJPyULfLLnYTEFYzByfUR',
      nonce: '1234567890',
    };
    return connectionRequest;
  }

  public async create(connectionResponse: ConnectionReponseDto): Promise<void> {
    ` assert nonce(connectionResponse.nonce ==== stored.nonce)
      await tyknid.createConnection(connectionResponse.did, connectionResponse.verkey, connectionResponse.meta)`;
    console.log(connectionResponse);
  }

  public async addLedger(didInfo: DidInfoDto): Promise<void> {
    ` decryptedMessage = await tyknid.decrypt(DidInfoDto)
      tyknid.addDidLedger(decryptedMessage.did, decryptedMessage.verkey)`;
    console.log(didInfo);
  }
}
