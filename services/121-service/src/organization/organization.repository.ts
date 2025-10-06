import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OrganizationEntity } from '@121-service/src/organization/organization.entity';

export class OrganizationRepository extends Repository<OrganizationEntity> {
  constructor(
    @InjectRepository(OrganizationEntity)
    private baseRepository: Repository<OrganizationEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async getOrganization(): Promise<OrganizationEntity | null> {
    const organizations = await this.baseRepository.find();
    return organizations[0] || null;
  }

  public async getOrganizationWithRelations(
    relations: string[],
  ): Promise<OrganizationEntity | null> {
    const organizations = await this.baseRepository.find({ relations });
    return organizations[0] || null;
  }
}
