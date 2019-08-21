import { SchemaEntity } from './schema.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { SchemaService } from './schema.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../../mock/repositoryMock.factory';

describe('SchemaService', () => {
  let service: SchemaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchemaService,
        {
          provide: getRepositoryToken(SchemaEntity),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    service = module.get<SchemaService>(SchemaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
