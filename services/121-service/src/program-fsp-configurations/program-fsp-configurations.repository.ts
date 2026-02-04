import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { FspConfigurationPropertyTypes } from '@121-service/src/fsp-integrations/shared/consts/fsp-configuration-property-types.const';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { parseFspConfigurationPropertyValue } from '@121-service/src/fsp-integrations/shared/helpers/parse-fsp-configuration-value.helper';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { UsernamePasswordInterface } from '@121-service/src/program-fsp-configurations/interfaces/username-password.interface';

export class ProgramFspConfigurationRepository extends Repository<ProgramFspConfigurationEntity> {
  constructor(
    @InjectRepository(ProgramFspConfigurationEntity)
    private baseRepository: Repository<ProgramFspConfigurationEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async getByProgramIdAndFspName({
    programId,
    fspName,
  }: {
    programId: number;
    fspName: Fsps;
  }): Promise<ProgramFspConfigurationEntity[]> {
    return await this.baseRepository.find({
      where: {
        programId: Equal(programId),
        fspName: Equal(fspName),
      },
      relations: { properties: true },
    });
  }

  public async getUsernamePasswordProperties({
    programFspConfigurationId,
  }: {
    programFspConfigurationId: number;
  }): Promise<UsernamePasswordInterface> {
    const properties = await this.getProperties(programFspConfigurationId);
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
    const programFspConfig = await this.baseRepository
      .createQueryBuilder('configuration')
      .leftJoin('configuration.transactionEvents', 'events')
      .leftJoin('events.transaction', 'transaction')
      .leftJoin('transaction.registration', 'registration')
      .leftJoin('registration.images', 'images')
      .leftJoin('images.voucher', 'voucher')
      .where('voucher.id = :intersolveVoucherId', {
        intersolveVoucherId,
      })
      .andWhere('voucher."paymentId" = transaction."paymentId"') // TODO: REFACTOR: this filter is needed as it is not taken care of by the joins above. Better to refactor the entity relations here, probably together with whole Voucher refactor. Also look at module responsibility then.
      .select('configuration.id AS id')
      .getRawOne(); // use getRawOne (+select) instead of getOne for performance reasons

    if (!programFspConfig) {
      throw new Error(
        `ProgramFspConfig not found based onintersolveVoucherId ${intersolveVoucherId}`,
      );
    }

    return this.getUsernamePasswordProperties({
      programFspConfigurationId: programFspConfig.id,
    });
  }

  // This methods specifically does not throw as it also used to check if the property exists
  public async getPropertyValueByName({
    programFspConfigurationId,
    name,
  }: {
    programFspConfigurationId: number;
    name: FspConfigurationProperties;
  }) {
    const configuration = await this.baseRepository
      .createQueryBuilder('configuration')
      .leftJoinAndSelect('configuration.properties', 'properties')
      .where('configuration.id = :id', {
        id: programFspConfigurationId,
      })
      .andWhere('properties.name = :name', { name })
      .orderBy('properties.name', 'ASC')
      .getOne();
    return configuration?.properties.find((property) => property.name === name)
      ?.value;
  }

  public async getPropertyValueByNameTypedOrThrow({
    programFspConfigurationId,
    name,
  }: {
    programFspConfigurationId: number;
    name: FspConfigurationProperties;
  }): Promise<any> {
    const value = await this.getPropertyValueByName({
      programFspConfigurationId,
      name,
    });

    if (!value) {
      throw new Error(
        `Configuration with name ${name} not found for ProgramFspConfigurationEntity with id: ${programFspConfigurationId}`,
      );
    }

    const type = FspConfigurationPropertyTypes[name];
    return parseFspConfigurationPropertyValue({
      value,
      type,
    });
  }

  public async getPropertiesByNamesOrThrow({
    programFspConfigurationId,
    names,
  }: {
    programFspConfigurationId: number;
    names: string[];
  }) {
    const properties = await this.getProperties(programFspConfigurationId);

    for (const name of names) {
      if (!properties.find((property) => property.name === name)) {
        throw new Error(
          `Configuration with name ${name} not found for ProgramFspConfigurationEntity with id:  ${programFspConfigurationId}`,
        );
      }
    }

    return properties.map((property) => ({
      name: property.name,
      value: property.value,
    }));
  }

  public async getPropertiesByNamesTypedOrThrow({
    programFspConfigurationId,
    names,
  }: {
    programFspConfigurationId: number;
    names: FspConfigurationProperties[];
  }): Promise<any> {
    const properties = await this.getPropertiesByNamesOrThrow({
      programFspConfigurationId,
      names,
    });

    const result: Record<
      FspConfigurationProperties,
      string | string[] | number | boolean
    > = {} as Record<
      FspConfigurationProperties,
      string | string[] | number | boolean
    >;

    for (const property of properties) {
      const type = FspConfigurationPropertyTypes[property.name];
      result[property.name] = parseFspConfigurationPropertyValue({
        value: property.value,
        type,
      });
    }

    return result;
  }

  private async getProperties(programFspConfigurationId: number) {
    const configuration = await this.baseRepository.findOne({
      where: {
        id: Equal(programFspConfigurationId),
      },
      relations: ['properties'],
    });

    return configuration ? configuration.properties : [];
  }
}
