/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { LanguageEnum } from '../../src/shared/enum/language.enums';
import { getNotes, postNote } from '../helpers/program.helper';
import { importRegistrations } from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

describe('Notes', () => {
  let accessToken: string;
  const programId = 3;
  const registration = {
    referenceId: '456984cc-1066-48f3-b70b-0e16c3fe5bce',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '14155238886',
    fspName: 'Intersolve-jumbo-physical',
    whatsappPhoneNumber: '14155238886',
    addressStreet: 'Teststraat',
    addressHouseNumber: '1',
    addressHouseNumberAddition: '',
    addressPostalCode: '1234AB',
    addressCity: 'Stad',
  };

  const noteText = 'test note';

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await importRegistrations(programId, [registration], accessToken);
  });

  it('should post a note', async () => {
    // Act
    const postNoteResponse = await postNote(
      registration.referenceId,
      noteText,
      programId,
      accessToken,
    );

    // Assert
    expect(postNoteResponse.statusCode).toBe(HttpStatus.CREATED);
  });

  it('should get a note', async () => {
    await postNote(registration.referenceId, noteText, programId, accessToken);

    // Act
    const getNoteResponse = await getNotes(
      registration.referenceId,
      programId,
      accessToken,
    );

    // Assert
    expect(getNoteResponse.statusCode).toBe(HttpStatus.OK);
    expect(getNoteResponse.body.length).toBe(1);
    expect(getNoteResponse.body[0].text).toBe(noteText);
  });
});
