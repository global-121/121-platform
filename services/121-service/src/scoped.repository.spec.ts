import { Repository } from 'typeorm';

import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

describe('ScopedRepository', () => {
  let scopedRepository: ScopedRepository<RegistrationAttributeDataEntity>;

  beforeEach(() => {
    const requestWithUser = {
      user: { scope: '', accessGroups: [] },
    } as unknown as ScopedUserRequest;
    const repository = {
      target: RegistrationAttributeDataEntity,
      manager: {},
      metadata: { name: RegistrationAttributeDataEntity.name },
    } as unknown as Repository<RegistrationAttributeDataEntity>;

    scopedRepository = new ScopedRepository(requestWithUser, repository);
  });

  // The scoped query builder path bypasses the guard of TypeORM's findOne, so the repository has to apply it itself
  it.each(['findOne', 'findOneOrFail'] as const)(
    'should throw for %s without selection conditions',
    async (method) => {
      // Act & Assert
      await expect(scopedRepository[method]({})).rejects.toThrow(
        'You must provide selection conditions in order to find a single row.',
      );
    },
  );
});
