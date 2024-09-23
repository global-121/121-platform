import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { UsernamePasswordInterface } from '@121-service/src/program-financial-service-provider-configurations/interfaces/username-password.interface';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';

export class ProgramFinancialServiceProviderConfigurationRepository extends Repository<ProgramFinancialServiceProviderConfigurationEntity> {
  constructor(
    @InjectRepository(ProgramFinancialServiceProviderConfigurationEntity)
    private baseRepository: Repository<ProgramFinancialServiceProviderConfigurationEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async findByProgramIdAndFinancialServiceProviderName({
    programId,
    financialServiceProviderName,
    includeProperties,
  }: {
    programId: number;
    financialServiceProviderName: FinancialServiceProviders;
    includeProperties: boolean;
  }): Promise<ProgramFinancialServiceProviderConfigurationEntity[]> {
    return await this.baseRepository.find({
      where: {
        programId: Equal(programId),
        financialServiceProviderName: Equal(financialServiceProviderName),
      },
      relations: includeProperties ? ['properties'] : [],
    });
  }

  public async findUsernamePasswordPropertiesForIds(
    programFinancialServiceProviderConfigurationId: number[],
  ): Promise<
    {
      programFinancialServiceProviderConfigurationId: number;
      credentials: UsernamePasswordInterface;
    }[]
  > {
    return await Promise.all(
      programFinancialServiceProviderConfigurationId.map(async (id) => ({
        programFinancialServiceProviderConfigurationId: id,
        credentials: await this.getUsernamePasswordProperties(id),
      })),
    );
  }

  public async getUsernamePasswordProperties(
    programFinancialServiceProviderConfigurationId: number,
  ): Promise<UsernamePasswordInterface> {
    const properties = await this.getConfigurationProperties(
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

  public async getPropertiesByNamesOrThrow({
    programFinancialServiceProviderConfigurationId,
    names,
  }: {
    programFinancialServiceProviderConfigurationId: number;
    names: string[];
  }) {
    const properties = await this.getConfigurationProperties(
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

  public async getPropertyValueByNameOrThrow({
    programFinancialServiceProviderConfigurationId,
    name,
  }: {
    programFinancialServiceProviderConfigurationId: number;
    name: string;
  }): Promise<string | string[] | Record<string, string> | undefined> {
    const properties = await this.getConfigurationProperties(
      programFinancialServiceProviderConfigurationId,
    );

    const property = properties.find((property) => property.name === name);
    return property?.value;
  }

  private async getConfigurationProperties(
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
