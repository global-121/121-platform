import { Test, TestingModule } from '@nestjs/testing';
import { CreateConnectionController } from './create-connection.controller';
import { CreateConnectionService } from './create-connection.service';

class CountryServiceMock {
  public async findAll(): Promise<any> {
    return true;
  }
}

describe('CreateConnection Controller', (): void => {
  let controller: CreateConnectionController;

  beforeEach(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [CreateConnectionController],
        providers: [
          {
            provide: CreateConnectionService,
            useValue: new CountryServiceMock(),
          },
        ],
      }).compile();

      controller = module.get<CreateConnectionController>(
        CreateConnectionController,
      );
    },
  );

  it('should be defined', (): void => {
    expect(controller).toBeDefined();
  });
});
