import { Test } from '@nestjs/testing';

import { ExcelFspConfigurationService } from '@121-service/src/fsp-integrations/integrations/excel/excel-fsp-configuration.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramFspConfigurationsService } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.service';

describe('ExcelFspConfigurationService', () => {
  let service: ExcelFspConfigurationService;
  const getConfiguration = jest.fn();

  beforeEach(async () => {
    getConfiguration.mockReset();
    const module = await Test.createTestingModule({
      providers: [
        ExcelFspConfigurationService,
        {
          provide: ProgramFspConfigurationRepository,
          useValue: { getExcelConfigurationByProgramIdAndName: getConfiguration },
        },
        {
          provide: ProgramFspConfigurationsService,
          useValue: {},
        },
      ],
    }).compile();
    service = module.get(ExcelFspConfigurationService);
  });

  it.each([
    {
      scenario: 'a non-string identifier',
      identifier: 123,
      exportFields: ['fullName'],
      expected: { uniqueIdentifierField: '', exportFields: ['fullName'] },
    },
    {
      scenario: 'non-array export fields',
      identifier: 'phoneNumber',
      exportFields: 'fullName',
      expected: { uniqueIdentifierField: 'phoneNumber', exportFields: [] },
    },
  ])('should fall back for $scenario', async ({ identifier, exportFields, expected }) => {
    const configuration = new ProgramFspConfigurationEntity();
    configuration.properties = [
      Object.assign(new ProgramFspConfigurationPropertyEntity(), {
        name: FspConfigurationProperties.columnToMatch,
        value: identifier,
      }),
      Object.assign(new ProgramFspConfigurationPropertyEntity(), {
        name: FspConfigurationProperties.columnsToExport,
        value: exportFields,
      }),
    ];
    getConfiguration.mockResolvedValue(configuration);

    const result = await service.getConfiguration({
      programId: 1,
      configurationName: 'excel-test',
    });

    expect(result).toEqual(expected);
  });
});