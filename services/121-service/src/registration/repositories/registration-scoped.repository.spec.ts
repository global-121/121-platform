import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

describe('RegistrationScopedRepository - getFullNamesByRegistrationIds', () => {
  let repository: RegistrationScopedRepository;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };

    const mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockEntityManager = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    };

    const mockDataSource = {
      createEntityManager: jest.fn().mockReturnValue(mockEntityManager),
    };

    const module = await Test.createTestingModule({
      providers: [
        RegistrationScopedRepository,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: 'REQUEST',
          useValue: {} as ScopedUserRequest,
        },
      ],
    }).compile();

    // Use resolve() instead of get() because that does not work for request-scoped providers
    repository = await module.resolve<RegistrationScopedRepository>(
      RegistrationScopedRepository,
    );

    repository.createQueryBuilder = jest.fn().mockImplementation(() => {
      return mockQueryBuilder;
    });
  });

  it('should return empty names when fullNameNamingConvention is empty', async () => {
    // Arrange
    const registrationIds = [1, 2, 3];
    const fullNameNamingConvention: string[] = [];
    const programId = 1;

    // Act
    const result = await repository.getFullNamesByRegistrationIds({
      registrationIds,
      fullNameNamingConvention,
      programId,
    });

    // Assert
    expect(result).toEqual([
      { registrationId: 1, name: '' },
      { registrationId: 2, name: '' },
      { registrationId: 3, name: '' },
    ]);
  });

  it('should return empty array when registration id array is empty', async () => {
    // Arrange
    const registrationIds: number[] = [];
    const fullNameNamingConvention = ['firstName', 'lastName'];
    const programId = 1;

    // Act
    const result = await repository.getFullNamesByRegistrationIds({
      registrationIds,
      fullNameNamingConvention,
      programId,
    });

    // Assert
    expect(result).toEqual([]);
  });

  it('should construct full names with single naming convention attribute', async () => {
    // Arrange
    const registrationIds = [1, 2, 3];
    const fullNameNamingConvention = ['firstName'];
    const programId = 1;

    mockQueryBuilder.getRawMany.mockResolvedValueOnce([
      { registrationId: 1, value: 'John' },
      { registrationId: 2, value: 'Jane' },
      { registrationId: 3, value: 'Bob' },
    ]);

    // Act
    const result = await repository.getFullNamesByRegistrationIds({
      registrationIds,
      fullNameNamingConvention,
      programId,
    });

    // Assert
    expect(result).toEqual([
      { registrationId: 1, name: 'John' },
      { registrationId: 2, name: 'Jane' },
      { registrationId: 3, name: 'Bob' },
    ]);
  });

  it('should construct full names with multiple naming convention attributes', async () => {
    // Arrange
    const registrationIds = [1, 2];
    const fullNameNamingConvention = ['firstName', 'lastName'];
    const programId = 1;

    mockQueryBuilder.getRawMany
      // First call for "firstName"
      .mockResolvedValueOnce([
        { registrationId: 1, value: 'John' },
        { registrationId: 2, value: 'Jane' },
      ])
      // Second call for "lastName"
      .mockResolvedValueOnce([
        { registrationId: 1, value: 'Doe' },
        { registrationId: 2, value: 'Smith' },
      ]);

    // Act
    const result = await repository.getFullNamesByRegistrationIds({
      registrationIds,
      fullNameNamingConvention,
      programId,
    });

    // Assert
    expect(result).toEqual([
      { registrationId: 1, name: 'John Doe' },
      { registrationId: 2, name: 'Jane Smith' },
    ]);
  });

  it('should handle missing attribute values for some registrations', async () => {
    // Arrange
    const registrationIds = [1, 2, 3];
    const fullNameNamingConvention = ['firstName', 'lastName'];
    const programId = 1;

    mockQueryBuilder.getRawMany
      // First call for "firstName" - registration 3 is missing
      .mockResolvedValueOnce([
        { registrationId: 1, value: 'John' },
        { registrationId: 2, value: 'Jane' },
      ])
      // Second call for "lastName" - registration 1 is missing
      .mockResolvedValueOnce([
        { registrationId: 2, value: 'Smith' },
        { registrationId: 3, value: 'Johnson' },
      ]);

    // Act
    const result = await repository.getFullNamesByRegistrationIds({
      registrationIds,
      fullNameNamingConvention,
      programId,
    });

    // Assert
    expect(result).toEqual([
      { registrationId: 1, name: 'John' }, // No lastName
      { registrationId: 2, name: 'Jane Smith' }, // Complete
      { registrationId: 3, name: 'Johnson' }, // No firstName
    ]);
  });

  it('should handle empty attribute values', async () => {
    // Arrange
    const registrationIds = [1, 2];
    const fullNameNamingConvention = ['firstName', 'middleName', 'lastName'];
    const programId = 1;

    mockQueryBuilder.getRawMany
      .mockResolvedValueOnce([
        { registrationId: 1, value: 'John' },
        { registrationId: 2, value: 'Jane' },
      ]) // firstName
      .mockResolvedValueOnce([
        { registrationId: 1, value: '' }, // Empty middleName
        { registrationId: 2, value: 'Marie' },
      ]) // middleName
      .mockResolvedValueOnce([
        { registrationId: 1, value: 'Doe' },
        { registrationId: 2, value: 'Smith' },
      ]); // lastName

    // Act
    const result = await repository.getFullNamesByRegistrationIds({
      registrationIds,
      fullNameNamingConvention,
      programId,
    });

    // Assert
    expect(result).toEqual([
      { registrationId: 1, name: 'John Doe' }, // Empty middleName is skipped
      { registrationId: 2, name: 'Jane Marie Smith' },
    ]);
  });

  it('should process more than 30,000 registration IDs correctly', async () => {
    // Arrange
    const totalRegistrations = 35000;
    const registrationIds = Array.from(
      { length: totalRegistrations },
      (_, i) => i + 1,
    );
    const fullNameNamingConvention = ['firstName'];
    const programId = 1;

    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockImplementation((_whereClause, _params) => {
        // Extract the IDs from the most recent andWhere call
        const ids = mockQueryBuilder.andWhere.mock.calls
          .filter((call) => call[0] === 'registration.id IN (:...ids)')
          .map((call) => call[1]?.ids || [])
          .flat();

        // Return data for those IDs
        return Promise.resolve(
          ids.map((id) => ({
            registrationId: id,
            value: `Name ${id}`,
          })),
        );
      }),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };

    // Override createQueryBuilder method
    repository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

    // Act
    const result = await repository.getFullNamesByRegistrationIds({
      registrationIds,
      fullNameNamingConvention,
      programId,
    });

    // Assert
    expect(result.length).toBe(totalRegistrations);

    // Check a few sample values to ensure data integrity
    expect(result[0]).toEqual({ registrationId: 1, name: 'Name 1' });
    expect(result[1000]).toEqual({ registrationId: 1001, name: 'Name 1001' });
    expect(result[34999]).toEqual({
      registrationId: 35000,
      name: 'Name 35000',
    });
  });
});
