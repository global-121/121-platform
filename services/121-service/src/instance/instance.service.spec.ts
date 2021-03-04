import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InstanceService } from './instance.service';
import { InstanceEntity } from './instance.entity';
import { MockType } from '../mock/mock.type';
import { Repository } from 'typeorm';

const instanceRepositoryMockFactory: () => MockType<Repository<any>> = jest.fn(
  (): any => ({
    findOne: jest.fn(() => new InstanceEntity()),
  }),
);

describe('Instance service', (): void => {
  let service: InstanceService;

  beforeAll(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          InstanceService,
          {
            provide: getRepositoryToken(InstanceEntity),
            useFactory: instanceRepositoryMockFactory,
          },
        ],
      }).compile();

      service = module.get<InstanceService>(InstanceService);
    },
  );

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('getInstance', (): void => {
    it('should return an instance', async (): Promise<void> => {
      const instance = new InstanceEntity();

      const result = await service.getInstance();

      expect(result).toStrictEqual(instance);
    });
  });
});
