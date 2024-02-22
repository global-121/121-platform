/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';
import programEth from '../../seed-data/program/program-joint-response-dorcas.json';
import programOCW from '../../seed-data/program/program-nlrc-ocw.json';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  assertArraysAreEqual,
  assertObjectsAreEqual,
} from '../helpers/assert.helper';
import { getProgram, patchProgram, postProgram } from '../helpers/program.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { UpdateProgramDto } from '../../src/programs/dto/update-program.dto';
import { FspName } from '../../src/fsp/enum/fsp-name.enum';

describe.only('Update program', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it('should update a program', async () => {
    // Arrange
    // TODO: Should this really contain all attributes of a program that can be updated?
    const program = {
      titlePortal: JSON.parse(JSON.stringify({ en: 'new title' })),
      location: "new location",
    };

    // Act
    // Call the update function
    const updateProgramResponse = await patchProgram(2, program as UpdateProgramDto, accessToken);

    // Assert
    // Check the response to see if the attributes were actually updated
    expect(updateProgramResponse.statusCode).toBe(HttpStatus.OK);
    expect(updateProgramResponse.body.location).toBe(program.location);
    const keyToIgnore = [''];
    assertObjectsAreEqual(updateProgramResponse.body.titlePortal, program.titlePortal, keyToIgnore);

  });

  it('should add an fsp to a program', async () => {
    // Arrange
    const program = {
      financialServiceProviders: JSON.parse(JSON.stringify([{ fsp: FspName.excel }])),
    };

    // Act
    const updateProgramResponse = await patchProgram(2, program as UpdateProgramDto, accessToken);

    // Assert
    expect(updateProgramResponse.statusCode).toBe(HttpStatus.OK);
    const hasSpecificKeyValue = updateProgramResponse.body.financialServiceProviders.some(fsp => fsp.fsp === FspName.excel);
    expect(hasSpecificKeyValue).toBeTruthy();
  });

  it('should not be able to add an fsp that does not exists to a program', async () => {
    // Arrange
    const program = {
      financialServiceProviders: JSON.parse(JSON.stringify([{ fsp: 'non-existing-fsp' }])),
    };

    // Act
    const updateProgramResponse = await patchProgram(2, program as UpdateProgramDto, accessToken);

    // Assert
    expect(updateProgramResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  // TODO: Add a test for supplied attributes that do not exist? See validation pipe TODO in ProgramsController and comment in DevOps Task

});
