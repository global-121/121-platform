import { SchemaEntity } from './schema.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { SchemaService } from './schema.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../../mock/repositoryMock.factory';
import { HttpModule } from '@nestjs/common';

describe('SchemaService', () => {
  let service: SchemaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
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
