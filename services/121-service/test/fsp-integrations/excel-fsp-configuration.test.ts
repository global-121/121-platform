import { HttpStatus } from '@nestjs/common';

import { ExcelFspConfigurationResponseDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/excel-fsp-configuration-response.dto';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { postProgramFspConfiguration } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Excel FSP configuration', () => {
  const programId = 1;
  const configurationName = 'Excel FSP test config';

  let accessToken: string;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.testMultiple });
    accessToken = await getAccessToken();

    await postProgramFspConfiguration({
      programId,
      body: {
        name: configurationName,
        label: { en: 'Excel FSP test' },
        fspName: Fsps.excel,
        properties: [
          {
            name: FspConfigurationProperties.columnToMatch,
            value: 'phoneNumber',
          },
          {
            name: FspConfigurationProperties.columnsToExport,
            value: ['fullName', 'phoneNumber'],
          },
        ],
      },
      accessToken,
    });
  });

  it('should return the Excel configuration in structured shape', async () => {
    const response = await getServer()
      .get(`/programs/${programId}/fsp-configurations/${configurationName}/excel`)
      .set('Cookie', [accessToken]);

    expect(response.statusCode).toBe(HttpStatus.OK);
    const body = response.body as ExcelFspConfigurationResponseDto;
    expect(body.uniqueIdentifierField).toBe('phoneNumber');
    expect(body.exportFields).toEqual(['fullName', 'phoneNumber']);
  });

  it('should return 404 for a non-Excel configuration name', async () => {
    const response = await getServer()
      .get(`/programs/${programId}/fsp-configurations/unknown-name/excel`)
      .set('Cookie', [accessToken]);

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(response.body.message).toContain(
      'Excel FSP-configuration with name unknown-name not found',
    );
  });
});
