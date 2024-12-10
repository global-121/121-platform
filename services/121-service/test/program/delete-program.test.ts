import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import {
  deleteProgram,
  getProgram,
} from '@121-service/test/helpers/program.helper';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Delete program', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it('should delete a program', async () => {
    // arrange
    // Create some related test data
    await seedPaidRegistrations(registrationsOCW, programIdOCW);

    // act
    const response = await deleteProgram(programIdOCW, accessToken, {
      secret: process.env.RESET_SECRET!,
    });
    expect(response.statusCode).toBe(HttpStatus.NO_CONTENT);
    const getProgramResponse = await getProgram(programIdOCW, accessToken);
    expect(getProgramResponse.statusCode).toBe(HttpStatus.NOT_FOUND);
  });
});
