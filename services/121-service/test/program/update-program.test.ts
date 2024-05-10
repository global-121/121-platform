import { HttpStatus } from '@nestjs/common';
import { FinancialServiceProviderName } from '../../src/financial-service-providers/enum/financial-service-provider-name.enum';
import { UpdateProgramDto } from '../../src/programs/dto/update-program.dto';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { assertObjectsAreEqual } from '../helpers/assert.helper';
import { patchProgram } from '../helpers/program.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

describe('Update program', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it('should update a program', async () => {
    // Arrange
    // Test with a few possibly to be changed attributes, not all attributes of a program
    const program = {
      titlePortal: { en: 'new title' },
      published: false,
      distributionDuration: 100,
      fixedTransferValue: 500,
      budget: 50000,
    };

    // Act
    // Call the update function
    const updateProgramResponse = await patchProgram(
      2,
      program as UpdateProgramDto,
      accessToken,
    );

    // Assert
    // Check the response to see if the attributes were actually updated
    expect(updateProgramResponse.statusCode).toBe(HttpStatus.OK);
    const keyToIgnore = [''];
    assertObjectsAreEqual(
      updateProgramResponse.body.titlePortal,
      program.titlePortal,
      keyToIgnore,
    );
    expect(updateProgramResponse.body.published).toBe(program.published);
    expect(updateProgramResponse.body.distributionDuration).toBe(
      program.distributionDuration,
    );
    expect(updateProgramResponse.body.fixedTransferValue).toBe(
      program.fixedTransferValue,
    );
    expect(updateProgramResponse.body.budget).toBe(program.budget);
  });

  it('should add an fsp to a program', async () => {
    // Arrange
    const program = {
      financialServiceProviders: JSON.parse(
        JSON.stringify([{ fsp: FinancialServiceProviderName.excel }]),
      ),
    };

    // Act
    const updateProgramResponse = await patchProgram(
      2,
      program as UpdateProgramDto,
      accessToken,
    );

    // Assert
    expect(updateProgramResponse.statusCode).toBe(HttpStatus.OK);
    const hasSpecificKeyValue =
      updateProgramResponse.body.financialServiceProviders.some(
        (fsp) => fsp.fsp === FinancialServiceProviderName.excel,
      );
    expect(hasSpecificKeyValue).toBeTruthy();
  });

  it('should not be able to add an fsp that does not exists to a program', async () => {
    // Arrange
    const program = {
      financialServiceProviders: JSON.parse(
        JSON.stringify([{ fsp: 'non-existing-fsp' }]),
      ),
    };

    // Act
    const updateProgramResponse = await patchProgram(
      2,
      program as UpdateProgramDto,
      accessToken,
    );

    // Assert
    expect(updateProgramResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });
});
