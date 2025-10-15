import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
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

  public async getUsernamePasswordProperties(
    programFspConfigurationId: number,
  ): Promise<UsernamePasswordInterface> {
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

    return this.getUsernamePasswordProperties(programFspConfig.id);
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
