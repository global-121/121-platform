/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import programCbe from '@121-service/src/seed-data/program/program-cbe.json';
import programOCW from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import {
  getProgram,
  postProgram,
} from '@121-service/test/helpers/program.helper';
import {
  cleanProgramForAssertions,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Create program', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should post a program', async () => {
    // Arrange
    // we do this because dates in JSON are not Date objects
    const programOcwJson = JSON.parse(JSON.stringify(programOCW));
    const programCbeJson = JSON.parse(JSON.stringify(programCbe));
    const seedPrograms = [programOcwJson, programCbeJson];

    for (const seedProgram of seedPrograms) {
      // Act
      const createProgramResponse = await postProgram(seedProgram, accessToken);

      // Assert
      const programId = createProgramResponse.body.id;
      const getProgramResponse = await getProgram(programId, accessToken);
      expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);

      const cleanedSeedProgram = cleanProgramForAssertions(seedProgram);
      const cleanedProgramResponse = cleanProgramForAssertions(
        getProgramResponse.body,
      );

      expect(cleanedProgramResponse).toMatchSnapshot(
        `Create program response for program: ${seedProgram.titlePortal.en}`,
      );

      expect(cleanedProgramResponse).toMatchObject(cleanedSeedProgram);
    }
  });

  it('should post a program with the minimum amount of attributes', async () => {
    // Arrange
    const minimalProgram = {
      titlePortal: {
        en: 'Test Title',
      },
      currency: CurrencyCode.EUR,
    };

    // Act
    const createProgramResponse = await postProgram(
      minimalProgram,
      accessToken,
    );

    // Assert
    expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);
    const expectedTitlePortal = 'Test Title';
    const expectedCurrency = CurrencyCode.EUR;
    expect(createProgramResponse.body).toEqual(
      expect.objectContaining({
        titlePortal: expect.objectContaining({
          en: expectedTitlePortal,
        }),
        currency: expectedCurrency,
      }),
    );
  });

  it('should fallback to ["fullName"] as the fullnameNamingConvention if the mininum amount of attributes is provided', async () => {
    // Arrange
    const minimalProgram = {
      titlePortal: {
        en: 'Test Title',
      },
      currency: CurrencyCode.EUR,
    };

    // Act
    const createProgramResponse = await postProgram(
      minimalProgram,
      accessToken,
    );

    // Assert
    expect(createProgramResponse.body).toEqual(
      expect.objectContaining({
        fullnameNamingConvention: ['fullName'],
      }),
    );
  });

  it('should add "fullName" to the programRegistrationAttributes if the mininum amount of attributes is provided', async () => {
    // Arrange
    const minimalProgram = {
      titlePortal: {
        en: 'Test Title',
      },
      currency: CurrencyCode.EUR,
    };

    // Act
    const createProgramResponse = await postProgram(
      minimalProgram,
      accessToken,
    );

    // Assert
    expect(createProgramResponse.body).toEqual(
      expect.objectContaining({
        programRegistrationAttributes: expect.arrayContaining([
          expect.objectContaining({
            name: 'fullName',
            label: expect.objectContaining({ en: 'Full name' }),
            type: 'text',
          }),
        ]),
      }),
    );
  });

  it('should not fallback to ["fullName"] if fullnameNamingConvention is provided', async () => {
    // Arrange
    const minimalProgram = {
      titlePortal: {
        en: 'Test Title',
      },
      currency: CurrencyCode.EUR,
      fullnameNamingConvention: ['firstName', 'lastName'],
    };

    // Act
    const createProgramResponse = await postProgram(
      minimalProgram,
      accessToken,
    );

    // Assert
    expect(createProgramResponse.body).toEqual(
      expect.objectContaining({
        fullnameNamingConvention: ['firstName', 'lastName'],
      }),
    );
  });

  it('should add programRegistrationAttributes for all fullnameNamingConvention fields provided', async () => {
    // Arrange
    const minimalProgram = {
      titlePortal: {
        en: 'Test Title',
      },
      currency: CurrencyCode.EUR,
      fullnameNamingConvention: ['firstName', 'lastName'],
    };

    // Act
    const createProgramResponse = await postProgram(
      minimalProgram,
      accessToken,
    );

    // Assert
    expect(createProgramResponse.body).toEqual(
      expect.objectContaining({
        programRegistrationAttributes: expect.arrayContaining([
          expect.objectContaining({
            name: 'firstName',
            label: expect.objectContaining({ en: 'firstName' }),
            type: 'text',
          }),
          expect.objectContaining({
            name: 'lastName',
            label: expect.objectContaining({ en: 'lastName' }),
            type: 'text',
          }),
        ]),
      }),
    );
  });

  it('should add "phoneNumber" to the programRegistrationAttributes if it\'s not provided', async () => {
    // Arrange
    const minimalProgram = {
      titlePortal: {
        en: 'Test Title',
      },
      currency: CurrencyCode.EUR,
    };

    // Act
    const createProgramResponse = await postProgram(
      minimalProgram,
      accessToken,
    );

    // Assert
    expect(createProgramResponse.body).toEqual(
      expect.objectContaining({
        programRegistrationAttributes: expect.arrayContaining([
          expect.objectContaining({
            name: 'phoneNumber',
            label: expect.objectContaining({ en: 'Phone number' }),
            type: 'text',
          }),
        ]),
      }),
    );
  });

  it('should not be able to post a program with 2 attributes that have the same name', async () => {
    // Arrange
    const programCbeJson = JSON.parse(JSON.stringify(programCbe));
    programCbeJson.programRegistrationAttributes.push(
      programCbeJson.programRegistrationAttributes[0],
    );
    // Act
    const createProgramResponse = await postProgram(
      programCbeJson,
      accessToken,
    );
    const getProgramResponse = await getProgram(4, accessToken);

    // Assert
    expect(createProgramResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(createProgramResponse.body.errors).toBe(
      "The following names: 'fullName' are used more than once program registration attributes",
    );

    // A new program should not have been created
    expect(getProgramResponse.statusCode).toBe(HttpStatus.NOT_FOUND);
  });
});
