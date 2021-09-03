import { Repository } from 'typeorm';
import { MockType } from './mock.type';

export const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(
  (): any => ({
    findOne: jest.fn(entity => entity),
    findAndCount: jest.fn(entity => entity),
    findAll: jest.fn(entity => entity),
    create: jest.fn(entity => entity),
    save: jest.fn(entity => entity),
    delete: jest.fn(entity => entity),
    publish: jest.fn(entity => entity),
  }),
);
