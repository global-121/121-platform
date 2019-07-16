import { Test, TestingModule } from '@nestjs/testing';
import { CreateConnectionController } from './create-connection.controller';

describe('CreateConnection Controller', () => {
  let controller: CreateConnectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateConnectionController],
    }).compile();

    controller = module.get<CreateConnectionController>(
      CreateConnectionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
