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

  it('should create an Excel configuration through the dedicated endpoint', async () => {
    const response = await getServer()
      .post(`/programs/${programId}/fsp-configurations/excel`)
      .set('Cookie', [accessToken])
      .send({
        name: 'dedicated-excel',
        label: { en: 'Dedicated Excel' },
        uniqueIdentifierField: 'phoneNumber',
      });

    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.fspName).toBe(Fsps.excel);

    const retrieved = await getServer()
      .get(`/programs/${programId}/fsp-configurations/dedicated-excel/excel`)
      .set('Cookie', [accessToken]);

    expect(retrieved.statusCode).toBe(HttpStatus.OK);
    expect(retrieved.body).toEqual({
      uniqueIdentifierField: 'phoneNumber',
      exportFields: [],
    });
  });

  it('should update an Excel configuration and clear omitted optional export fields', async () => {
    const response = await getServer()
      .patch(`/programs/${programId}/fsp-configurations/${configurationName}/excel`)
      .set('Cookie', [accessToken])
      .send({
        label: { en: 'Updated Excel' },
        uniqueIdentifierField: 'fullName',
      });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.label).toEqual({ en: 'Updated Excel' });

    const retrieved = await getServer()
      .get(`/programs/${programId}/fsp-configurations/${configurationName}/excel`)
      .set('Cookie', [accessToken]);

    expect(retrieved.body).toEqual({
      uniqueIdentifierField: 'fullName',
      exportFields: [],
    });
  });

  it.each([
    { uniqueIdentifierField: '', exportFields: [] },
    { uniqueIdentifierField: 'phoneNumber', exportFields: 'fullName' },
    { uniqueIdentifierField: 'phoneNumber', exportFields: [123] },
    { uniqueIdentifierField: 'phoneNumber', exportFields: ['fullName', 'fullName'] },
  ])('should reject invalid Excel fields: $uniqueIdentifierField / $exportFields', async (fields) => {
    const response = await getServer()
      .post(`/programs/${programId}/fsp-configurations/excel`)
      .set('Cookie', [accessToken])
      .send({ name: 'invalid-excel', label: { en: 'Invalid Excel' }, ...fields });

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should return empty export fields when optional fields are not configured', async () => {
    const optionalConfigurationName = 'excel-without-export-fields';
    const created = await postProgramFspConfiguration({
      programId,
      body: {
        name: optionalConfigurationName,
        label: { en: 'Excel without export fields' },
        fspName: Fsps.excel,
        properties: [
          {
            name: FspConfigurationProperties.columnToMatch,
            value: 'phoneNumber',
          },
        ],
      },
      accessToken,
    });
    expect(created.statusCode).toBe(HttpStatus.CREATED);

    const response = await getServer()
      .get(`/programs/${programId}/fsp-configurations/${optionalConfigurationName}/excel`)
      .set('Cookie', [accessToken]);

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body).toEqual({
      uniqueIdentifierField: 'phoneNumber',
      exportFields: [],
    });
  });

  it('should return an empty identifier when the configuration has no properties', async () => {
    const emptyConfigurationName = 'excel-without-properties';
    const created = await postProgramFspConfiguration({
      programId,
      body: {
        name: emptyConfigurationName,
        label: { en: 'Excel without properties' },
        fspName: Fsps.excel,
        properties: [],
      },
      accessToken,
    });
    expect(created.statusCode).toBe(HttpStatus.CREATED);

    const response = await getServer()
      .get(`/programs/${programId}/fsp-configurations/${emptyConfigurationName}/excel`)
      .set('Cookie', [accessToken]);

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body).toEqual({
      uniqueIdentifierField: '',
      exportFields: [],
    });
  });

  it('should return 404 for an existing non-Excel configuration', async () => {
    const nonExcelConfigurationName = 'visa-test-configuration';
    const created = await postProgramFspConfiguration({
      programId,
      body: {
        name: nonExcelConfigurationName,
        label: { en: 'Visa test configuration' },
        fspName: Fsps.intersolveVisa,
        properties: [],
      },
      accessToken,
    });
    expect(created.statusCode).toBe(HttpStatus.CREATED);

    const response = await getServer()
      .get(`/programs/${programId}/fsp-configurations/${nonExcelConfigurationName}/excel`)
      .set('Cookie', [accessToken]);

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('should return 404 for an unknown configuration name', async () => {
    const response = await getServer()
      .get(`/programs/${programId}/fsp-configurations/unknown-name/excel`)
      .set('Cookie', [accessToken]);

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(response.body.message).toContain(
      'Excel FSP-configuration with name unknown-name not found',
    );
  });
});
