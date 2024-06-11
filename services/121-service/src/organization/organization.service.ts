import { UpdateOrganizationDto } from '@121-service/src/organization/dto/update-organization.dto';
import { OrganizationEntity } from '@121-service/src/organization/organization.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OrganizationService {
  @InjectRepository(OrganizationEntity)
  private readonly organizationRepository: Repository<OrganizationEntity>;

  public async getOrganization(): Promise<OrganizationEntity> {
    const organizations = await this.organizationRepository.find();
    return organizations[0];
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
    const organization = (
      await this.organizationRepository.find({ relations })
    )?.[0];
    if (!organization) {
      const errors = `No organization found`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return organization;
  }
}
