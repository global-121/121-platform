import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { UpdateOrganizationDto } from '@121-service/src/organization/dto/update-organization.dto';
import { OrganizationEntity } from '@121-service/src/organization/organization.entity';
import { OrganizationRepository } from '@121-service/src/organization/organization.repository';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  public async getOrganization(): Promise<OrganizationEntity> {
    return await this.getOrganizationOrThrow([]);
  }

  public async updateOrganization(
    updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<OrganizationEntity> {
    const organization = await this.getOrganizationOrThrow([]);

    for (const attribute in updateOrganizationDto) {
      organization[attribute] = updateOrganizationDto[attribute];
    }

    await this.organizationRepository.save(organization);
    return organization;
  }

  private async getOrganizationOrThrow(
    relations: string[],
  ): Promise<OrganizationEntity> {
    const organization =
      await this.organizationRepository.getOrganizationWithRelations(relations);
    if (!organization) {
      const errors = `No organization found`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return organization;
  }
}
