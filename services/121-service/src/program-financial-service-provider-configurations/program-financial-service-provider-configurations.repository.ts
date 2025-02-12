import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ProjectFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { UsernamePasswordInterface } from '@121-service/src/program-financial-service-provider-configurations/interfaces/username-password.interface';

export class ProgramFinancialServiceProviderConfigurationRepository extends Repository<ProjectFinancialServiceProviderConfigurationEntity> {
  constructor(
    @InjectRepository(ProjectFinancialServiceProviderConfigurationEntity)
    private baseRepository: Repository<ProjectFinancialServiceProviderConfigurationEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async getByProgramIdAndFinancialServiceProviderName({
    programId,
    financialServiceProviderName,
  }: {
    programId: number;
    financialServiceProviderName: FinancialServiceProviders;
  }): Promise<ProjectFinancialServiceProviderConfigurationEntity[]> {
    return await this.baseRepository.find({
      where: {
        programId: Equal(programId),
        financialServiceProviderName: Equal(financialServiceProviderName),
      },
      relations: { properties: true },
    });
  }

  public async getUsernamePasswordProperties(
    programFinancialServiceProviderConfigurationId: number,
  ): Promise<UsernamePasswordInterface> {
    const properties = await this.getProperties(
      programFinancialServiceProviderConfigurationId,
    );
    const propertyUsername = properties.find(
      (c) =>
        c.name === FinancialServiceProviderConfigurationProperties.username,
    );
    const propertyPassword = properties.find(
      (c) =>
        c.name === FinancialServiceProviderConfigurationProperties.password,
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
    const programFspConfig = await this.baseRepository
      .createQueryBuilder('configuration')
      .leftJoin('configuration.transactions', 'transactions')
      .innerJoin('transactions.latestTransaction', 'latestTransaction')
      .leftJoin('latestTransaction.registration', 'registration')
      .leftJoin('registration.images', 'images')
      .leftJoin('images.voucher', 'voucher')
      .where('voucher.id = :intersolveVoucherId', {
        intersolveVoucherId,
      })
      .andWhere('voucher.payment = transactions.payment') // TODO: REFACTOR: this filter is needed as it is not taken care of by the joins above. Better to refactor the entity relations here, probably together with whole Voucher refactor. Also look at module responsiblity then.
      .select('configuration.id AS id')
      .getRawOne(); // use getRawOne (+select) instead of getOne for performance reasons

    if (!programFspConfig) {
      throw new Error(
        `ProgramFspConfig not found based onintersolveVoucherId ${intersolveVoucherId}`,
      );
    }

    return this.getUsernamePasswordProperties(programFspConfig.id);
  }

  // This methods specfically does not throw as it also used to check if the property exists
  public async getPropertyValueByName({
    programFinancialServiceProviderConfigurationId,
    name,
  }: {
    programFinancialServiceProviderConfigurationId: number;
    name: FinancialServiceProviderConfigurationProperties;
  }) {
    const configuration = await this.baseRepository
      .createQueryBuilder('configuration')
      .leftJoinAndSelect('configuration.properties', 'properties')
      .where('configuration.id = :id', {
        id: programFinancialServiceProviderConfigurationId,
      })
      .andWhere('properties.name = :name', { name })
      .getOne();
    return configuration?.properties.find((property) => property.name === name)
      ?.value;
  }

  public async getPropertiesByNamesOrThrow({
    programFinancialServiceProviderConfigurationId,
    names,
  }: {
    programFinancialServiceProviderConfigurationId: number;
    names: string[];
  }) {
    const properties = await this.getProperties(
      programFinancialServiceProviderConfigurationId,
    );

    for (const name of names) {
      if (!properties.find((property) => property.name === name)) {
        throw new Error(
          `Configuration with name ${name} not found for ProgramFinancialServiceProviderConfigurationEntity with id:  ${programFinancialServiceProviderConfigurationId}`,
        );
      }
    }

    return properties.map((property) => ({
      name: property.name,
      value: property.value,
    }));
  }

  private async getProperties(
    programFinancialServiceProviderConfigurationId: number,
  ) {
    const configuration = await this.baseRepository.findOne({
      where: {
        id: Equal(programFinancialServiceProviderConfigurationId),
      },
      relations: ['properties'],
    });

    return configuration ? configuration.properties : [];
  }
}
