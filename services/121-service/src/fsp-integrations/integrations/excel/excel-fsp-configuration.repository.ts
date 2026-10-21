import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { ExcelFspConfigurationEntity } from '@121-service/src/fsp-integrations/integrations/excel/entities/excel-fsp-configuration.entity';

export class ExcelFspConfigurationRepository extends Repository<ExcelFspConfigurationEntity> {
  public constructor(
    @InjectRepository(ExcelFspConfigurationEntity)
    private readonly baseRepository: Repository<ExcelFspConfigurationEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async getByProgramFspConfigurationId({
    programFspConfigurationId,
  }: {
    programFspConfigurationId: number;
  }): Promise<ExcelFspConfigurationEntity | null> {
    return this.baseRepository.findOne({
      where: { programFspConfigurationId: Equal(programFspConfigurationId) },
    });
  }

  public async saveConfiguration({
    programFspConfigurationId,
    uniqueIdentifierField,
    exportFields,
  }: {
    programFspConfigurationId: number;
    uniqueIdentifierField: string;
    exportFields: string[];
  }): Promise<ExcelFspConfigurationEntity> {
    const configuration =
      (await this.getByProgramFspConfigurationId({
        programFspConfigurationId,
      })) ?? new ExcelFspConfigurationEntity();

    configuration.programFspConfigurationId = programFspConfigurationId;
    configuration.uniqueIdentifierField = uniqueIdentifierField;
    configuration.exportFields = exportFields;

    return this.baseRepository.save(configuration);
  }
}
