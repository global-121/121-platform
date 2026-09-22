import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';
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
  let programAttributeNames: string[];

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.testMultiple });
    accessToken = await getAccessToken();
    const attributesResponse = await getServer()
      .get(
        `/programs/${programId}/attributes?includeProgramRegistrationAttributes=true`,
      )
      .set('Cookie', [accessToken]);
    programAttributeNames = attributesResponse.body.map(
      ({ name }) => name as string,
    );

    await postProgramFspConfiguration({
      programId,
      body: {
        name: configurationName,
        label: { en: 'Excel FSP test' },
        fspName: Fsps.excel,
      },
      accessToken,
    });
  });

  it('should return empty details while a generic Excel configuration is pending', async () => {
    const response = await getServer()
      .get(
        `/programs/${programId}/fsp-configurations/${configurationName}/excel`,
      )
      .set('Cookie', [accessToken]);

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body).toEqual({
      name: configurationName,
      label: { en: 'Excel FSP test' },
      uniqueIdentifierField: '',
      exportFields: [],
    });
  });

  it('should keep generic Excel identity pending until its details are saved', async () => {
    const response = await getServer()
      .get(`/programs/${programId}/fsp-configurations`)
      .set('Cookie', [accessToken]);

    expect(
      response.body.find(
        (configuration) => configuration.name === configurationName,
      ).state,
    ).toBe(FspConfigurationStates.configurationPending);

    const saved = await getServer()
      .put(
        `/programs/${programId}/fsp-configurations/${configurationName}/excel`,
      )
      .set('Cookie', [accessToken])
      .send({ uniqueIdentifierField: 'phoneNumber' });

    expect(saved.statusCode).toBe(HttpStatus.OK);
    expect(saved.body).toMatchObject({
      name: configurationName,
      label: { en: 'Excel FSP test' },
      uniqueIdentifierField: 'phoneNumber',
    });
    expect(saved.body.exportFields).toEqual(programAttributeNames);

    const updatedConfigurations = await getServer()
      .get(`/programs/${programId}/fsp-configurations`)
      .set('Cookie', [accessToken]);
    expect(
      updatedConfigurations.body.find(
        (configuration) => configuration.name === configurationName,
      ).state,
    ).toBe(FspConfigurationStates.configured);
  });

  it('should default omitted export fields to all attributes and allow an empty selection', async () => {
    const response = await getServer()
      .put(
        `/programs/${programId}/fsp-configurations/${configurationName}/excel`,
      )
      .set('Cookie', [accessToken])
      .send({
        uniqueIdentifierField: 'fullName',
        exportFields: ['phoneNumber'],
      });

    expect(response.statusCode).toBe(HttpStatus.OK);

    const updated = await getServer()
      .put(
        `/programs/${programId}/fsp-configurations/${configurationName}/excel`,
      )
      .set('Cookie', [accessToken])
      .send({ uniqueIdentifierField: 'fullName' });

    expect(updated.statusCode).toBe(HttpStatus.OK);
    expect(updated.body.uniqueIdentifierField).toBe('fullName');
    expect(updated.body.exportFields).toEqual(programAttributeNames);

    const cleared = await getServer()
      .put(
        `/programs/${programId}/fsp-configurations/${configurationName}/excel`,
      )
      .set('Cookie', [accessToken])
      .send({ uniqueIdentifierField: 'fullName', exportFields: [] });

    expect(cleared.statusCode).toBe(HttpStatus.OK);
    expect(cleared.body.exportFields).toEqual([]);
  });

  it.each([
    { uniqueIdentifierField: '', exportFields: [] },
    { uniqueIdentifierField: 'notAnAttribute', exportFields: [] },
    { uniqueIdentifierField: 'phoneNumber', exportFields: 'fullName' },
    { uniqueIdentifierField: 'phoneNumber', exportFields: [123] },
    {
      uniqueIdentifierField: 'phoneNumber',
      exportFields: ['fullName', 'fullName'],
    },
  ])(
    'should reject invalid Excel fields: $uniqueIdentifierField / $exportFields',
    async (fields) => {
      const response = await getServer()
        .put(
          `/programs/${programId}/fsp-configurations/${configurationName}/excel`,
        )
        .set('Cookie', [accessToken])
        .send(fields);

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    },
  );

  it('should keep Excel configured after a generic label update', async () => {
    const saveExcelDetails = await getServer()
      .put(
        `/programs/${programId}/fsp-configurations/${configurationName}/excel`,
      )
      .set('Cookie', [accessToken])
      .send({ uniqueIdentifierField: 'phoneNumber' });
    expect(saveExcelDetails.statusCode).toBe(HttpStatus.OK);

    const updateLabel = await getServer()
      .patch(`/programs/${programId}/fsp-configurations/${configurationName}`)
      .set('Cookie', [accessToken])
      .send({ label: { en: 'Updated Excel FSP' } });

    expect(updateLabel.statusCode).toBe(HttpStatus.OK);
    expect(updateLabel.body.state).toBe(FspConfigurationStates.configured);
  });

  it('should allow the generic Excel configuration to be created without properties', async () => {
    const emptyConfigurationName = 'excel-without-properties';
    const created = await postProgramFspConfiguration({
      programId,
      body: {
        name: emptyConfigurationName,
        label: { en: 'Excel without properties' },
        fspName: Fsps.excel,
      },
      accessToken,
    });
    expect(created.statusCode).toBe(HttpStatus.CREATED);

    const response = await getServer()
      .get(
        `/programs/${programId}/fsp-configurations/${emptyConfigurationName}/excel`,
      )
      .set('Cookie', [accessToken]);

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body).toEqual({
      name: emptyConfigurationName,
      label: { en: 'Excel without properties' },
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
      .get(
        `/programs/${programId}/fsp-configurations/${nonExcelConfigurationName}/excel`,
      )
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
