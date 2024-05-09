import { DataSource } from 'typeorm';

/**
 * Get the name of a Queue to be mocked
 *
 * @param name Of the queue to be mocked
 * @returns Queue name to be used for mocking
 */
export function getQueueName(name: string | undefined): string {
  return `BullQueue_${name}`;
}

/**
 * Get a mocked DataSource
 *
 * @param entityName Name of the target entity
 * @returns A partially mocked DataSource
 */
export function getDataSourceMock(entityName: string): Partial<DataSource> {
  return {
    createEntityManager: jest.fn().mockImplementation(() => {
      return {
        getRepository: jest.fn().mockReturnValue({
          metadata: {
            name: entityName,
            relations: [],
          },
          find: jest.fn().mockResolvedValue([]),
          findAndCount: jest.fn().mockResolvedValue([[], 0]),
          findOne: jest.fn().mockResolvedValue({}),
          createQueryBuilder: jest.fn().mockReturnValue({
            // TODO: mock querybuilder here (?)
          }),
          save: jest.fn().mockResolvedValue({}),
          insert: jest.fn().mockResolvedValue({}),
          remove: jest.fn().mockResolvedValue({}),
          delete: jest.fn().mockResolvedValue({}),
          update: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockReturnValue({}),
        }),
      };
    }),
  };
}
