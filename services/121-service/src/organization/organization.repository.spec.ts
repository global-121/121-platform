import { TestBed } from '@automock/jest';

import { OrganizationRepository } from '@121-service/src/organization/organization.repository';

describe('OrganizationRepository', () => {
  let organizationRepository: OrganizationRepository;

  beforeEach(() => {
    const { unit: organizationRepositoryUnit } = TestBed.create(
      OrganizationRepository,
    ).compile();

    organizationRepository = organizationRepositoryUnit;
  });

  it('should be defined', () => {
    expect(organizationRepository).toBeDefined();
  });
});
