import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { ProjectFspConfigurationEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration.entity';
import { UsernamePasswordInterface } from '@121-service/src/project-fsp-configurations/interfaces/username-password.interface';

export class ProjectFspConfigurationRepository extends Repository<ProjectFspConfigurationEntity> {
  constructor(
    @InjectRepository(ProjectFspConfigurationEntity)
    private baseRepository: Repository<ProjectFspConfigurationEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async getByProjectIdAndFspName({
    projectId,
    fspName,
  }: {
    projectId: number;
    fspName: Fsps;
  }): Promise<ProjectFspConfigurationEntity[]> {
    return await this.baseRepository.find({
      where: {
        projectId: Equal(projectId),
        fspName: Equal(fspName),
      },
      relations: { properties: true },
    });
  }

  public async getUsernamePasswordProperties(
    projectFspConfigurationId: number,
  ): Promise<UsernamePasswordInterface> {
    const properties = await this.getProperties(projectFspConfigurationId);
    const propertyUsername = properties.find(
      (c) => c.name === FspConfigurationProperties.username,
    );
    const propertyPassword = properties.find(
      (c) => c.name === FspConfigurationProperties.password,
    );

    const response: UsernamePasswordInterface = {
      username: null,
      password: null,
    };

    if (typeof propertyUsername?.value == 'string') {
      response.username = propertyUsername.value;
    }
    if (typeof propertyPassword?.value == 'string') {
      response.password = propertyPassword.value;
    }
    return response;
  }

  public async getUsernamePasswordPropertiesByVoucherId(
    intersolveVoucherId: number,
  ): Promise<UsernamePasswordInterface> {
    const projectFspConfig = await this.baseRepository
      .createQueryBuilder('configuration')
      .leftJoin('configuration.transactions', 'transactions')
      .innerJoin('transactions.latestTransaction', 'latestTransaction')
      .leftJoin('latestTransaction.registration', 'registration')
      .leftJoin('registration.images', 'images')
      .leftJoin('images.voucher', 'voucher')
      .where('voucher.id = :intersolveVoucherId', {
        intersolveVoucherId,
      })
      .andWhere('voucher."paymentId" = transactions."paymentId"') // TODO: REFACTOR: this filter is needed as it is not taken care of by the joins above. Better to refactor the entity relations here, probably together with whole Voucher refactor. Also look at module responsiblity then.
      .select('configuration.id AS id')
      .getRawOne(); // use getRawOne (+select) instead of getOne for performance reasons

    if (!projectFspConfig) {
      throw new Error(
        `ProjectFspConfig not found based onintersolveVoucherId ${intersolveVoucherId}`,
      );
    }

    return this.getUsernamePasswordProperties(projectFspConfig.id);
  }

  // This methods specfically does not throw as it also used to check if the property exists
  public async getPropertyValueByName({
    projectFspConfigurationId,
    name,
  }: {
    projectFspConfigurationId: number;
    name: FspConfigurationProperties;
  }) {
    const configuration = await this.baseRepository
      .createQueryBuilder('configuration')
      .leftJoinAndSelect('configuration.properties', 'properties')
      .where('configuration.id = :id', {
        id: projectFspConfigurationId,
      })
      .andWhere('properties.name = :name', { name })
      .orderBy('properties.name', 'ASC')
      .getOne();
    return configuration?.properties.find((property) => property.name === name)
      ?.value;
  }

  public async getPropertiesByNamesOrThrow({
    projectFspConfigurationId,
    names,
  }: {
    projectFspConfigurationId: number;
    names: string[];
  }) {
    const properties = await this.getProperties(projectFspConfigurationId);

    for (const name of names) {
      if (!properties.find((property) => property.name === name)) {
        throw new Error(
          `Configuration with name ${name} not found for ProjectFspConfigurationEntity with id:  ${projectFspConfigurationId}`,
        );
      }
    }

    return properties.map((property) => ({
      name: property.name,
      value: property.value,
    }));
  }

  private async getProperties(projectFspConfigurationId: number) {
    const configuration = await this.baseRepository.findOne({
      where: {
        id: Equal(projectFspConfigurationId),
      },
      relations: ['properties'],
    });

    return configuration ? configuration.properties : [];
  }
}
