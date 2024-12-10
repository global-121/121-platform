import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import {
  deleteProgram,
  getProgram,
  startCbeValidationProcess,
} from '@121-service/test/helpers/program.helper';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
  registrationCbe,
  registrationsOCW,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Delete program', () => {
  let accessToken: string;

  it('should delete a nlrc programs', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    // Create some test data which should be cascaded deleted
    await seedPaidRegistrations(registrationsOCW, programIdOCW);
    await seedPaidRegistrations(registrationsPV, programIdPV);

    // Act + Assert
    const secretDto = { secret: process.env.RESET_SECRET! };

    const deleteResponseOCW = await deleteProgram(
      programIdOCW,
      accessToken,
      secretDto,
    );
    expect(deleteResponseOCW.statusCode).toBe(HttpStatus.NO_CONTENT);

    const deleteResponsePV = await deleteProgram(
      programIdPV,
      accessToken,
      secretDto,
    );
    expect(deleteResponsePV.statusCode).toBe(HttpStatus.NO_CONTENT);

    const getProgramResponseOCW = await getProgram(programIdOCW, accessToken);
    expect(getProgramResponseOCW.statusCode).toBe(HttpStatus.NOT_FOUND);

    const getProgramResponsePV = await getProgram(programIdPV, accessToken);
    expect(getProgramResponsePV.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('should delete eth programs', async () => {
    const programIdEth = 1;
    await resetDB(SeedScript.ethJointResponse);
    accessToken = await getAccessToken();

    await seedPaidRegistrations([registrationCbe], programIdEth);
    await startCbeValidationProcess(programIdEth, accessToken);

    // Act + Assert
    const secretDto = { secret: process.env.RESET_SECRET! };
    const deleteResponseEth = await deleteProgram(
      programIdEth,
      accessToken,
      secretDto,
    );
    expect(deleteResponseEth.statusCode).toBe(HttpStatus.NO_CONTENT);

    const getProgramResponseEth = await getProgram(programIdEth, accessToken);
    expect(getProgramResponseEth.statusCode).toBe(HttpStatus.NOT_FOUND);
  });
});
