import { DidInfoDto } from './dto/did-info.dto';
import { ConnectionReponseDto } from './dto/connection-response.dto';
import { ConnectionRequestDto } from './dto/connection-request.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateConnectionController } from './create-connection.controller';
import { CreateConnectionService } from './create-connection.service';
import { ConnectionEntity } from './connection.entity';

const newConnectionRequest = {
  did: 'sample:did:s23kjsg',
  nonce: '123456789',
};

const newConnectionResponse = {
  did: 'did:sov:2wJPyULfLLnYTEFYzByfUR',
  verkey: 'verkey:sample',
  nonce: '123456789',
  meta: 'meta:sample',
};

const newConnection = {
  id: 1,
  did: 'xxx',
  programsEnrolled: [],
  programsIncluded: [],
}

const newDidInfo = {
  message: 'encrypted:example',
};

class ConenctionServiceMock {
  public async get(): Promise<ConnectionRequestDto> {
    return newConnectionRequest;
  }
  public async create(connectionResponse: ConnectionReponseDto): Promise<void> {
    connectionResponse;
  }
  public async addLedger(didInfo: DidInfoDto): Promise<void> {
    didInfo;
  }
}

describe('CreateConnection Controller', (): void => {
  let createConnectionController: CreateConnectionController;
  let createConnectionService: CreateConnectionService;

  beforeEach(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [CreateConnectionController],
        providers: [
          {
            provide: CreateConnectionService,
            useValue: new ConenctionServiceMock(),
          },
        ],
      }).compile();
      createConnectionService = module.get<CreateConnectionService>(
        CreateConnectionService,
      );

      createConnectionController = module.get<CreateConnectionController>(
        CreateConnectionController,
      );
    },
  );

  it('should be defined', (): void => {
    expect(createConnectionController).toBeDefined();
  });

  describe('get', (): void => {
    it('should get a connection request', async (): Promise<void> => {
      const spy = jest
        .spyOn(createConnectionService, 'get')
        .mockImplementation(
          (): Promise<ConnectionRequestDto> =>
            Promise.resolve(newConnectionRequest),
        );

      const controllerResult = await createConnectionController.get();
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(newConnectionRequest);
    });
  });

  describe('create', (): void => {
    it('should create connection by posting connection response', async (): Promise<
      void
    > => {
      const spy = jest
        .spyOn(createConnectionService, 'create')
        .mockImplementation((): Promise<ConnectionEntity> => Promise.resolve(newConnection));

      await createConnectionController.create(newConnectionResponse);
      expect(spy).toHaveBeenCalled();
    });
  });
  describe('addLedger', (): void => {
    it('should add did to ledger using did info', async (): Promise<void> => {
      const spy = jest
        .spyOn(createConnectionService, 'addLedger')
        .mockImplementation((): Promise<void> => Promise.resolve());

      await createConnectionController.addLedger(newDidInfo);
      expect(spy).toHaveBeenCalled();
    });
  });
});
