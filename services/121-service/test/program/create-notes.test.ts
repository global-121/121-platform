/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { changePhase, getNotes, postNote } from '../helpers/program.helper';
import { importRegistrations } from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

describe('Create notes', () => {
  let accessToken: string;
  const programId = 3;
  const referenceId = '456984cc-1066-48f3-b70b-0e16c3fe5bce';
  const registration = {
    referenceId: referenceId,
    preferredLanguage: 'en',
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

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await changePhase(
      programId,
      ProgramPhase.registrationValidation,
      accessToken,
    );

    await importRegistrations(programId, [registration], accessToken);
  });

  it('should post a note', async () => {
    // Arrange
    const text = 'test note';

    // Act
    const postNoteResponse = await postNote(
      referenceId,
      text,
      programId,
      accessToken,
    );

    // Assert
    expect(postNoteResponse.statusCode).toBe(HttpStatus.CREATED);
    expect(postNoteResponse.body.text).toBe(text);
  });

  it('should get a note', async () => {
    // Arrange
    const text = 'test note';

    await postNote(referenceId, text, programId, accessToken);

    // Act
    const getNoteResponse = await getNotes(referenceId, programId, accessToken);

    // console.log(getNoteResponse);

    // Assert
    expect(getNoteResponse.statusCode).toBe(HttpStatus.OK);
    expect(getNoteResponse.body.length).toBe(1);
    expect(getNoteResponse.body[0].text).toBe(text);
  });
});
