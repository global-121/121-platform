import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  deleteProgram,
  getProgram,
  startCbeValidationProcess,
} from '@121-service/test/helpers/program.helper';
import {
  getAttachments,
  uploadAttachment,
} from '@121-service/test/helpers/program-attachments.helper';
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

  it('should delete nlrc programs', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    // Create some test data which should be cascaded deleted
    await seedPaidRegistrations({
      registrations: registrationsOCW,
      programId: programIdOCW,
    });
    await seedPaidRegistrations({
      registrations: registrationsPV,
      programId: programIdPV,
    });

    // Act + Assert
    const secretDto = { secret: env.RESET_SECRET };

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

  it('should delete CBE programs', async () => {
    const programIdCbe = 1;
    await resetDB(SeedScript.cbeProgram, __filename);
    accessToken = await getAccessToken();

    await seedPaidRegistrations({
      registrations: [registrationCbe],
      programId: programIdCbe,
    });
    await startCbeValidationProcess(programIdCbe, accessToken);

    // Act + Assert
    const secretDto = { secret: env.RESET_SECRET };
    const deleteResponseCbe = await deleteProgram(
      programIdCbe,
      accessToken,
      secretDto,
    );
    expect(deleteResponseCbe.statusCode).toBe(HttpStatus.NO_CONTENT);

    const getProgramResponseCbe = await getProgram(programIdCbe, accessToken);
    expect(getProgramResponseCbe.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('should delete a program with attachments', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    const testImagePath = './test-attachment-data/sample.jpg';
    const testImageFilename = 'Test Image';

    const response = await uploadAttachment({
      programId: programIdPV,
      filePath: testImagePath,
      filename: testImageFilename,
      accessToken,
    });

    expect(response.status).toBe(HttpStatus.CREATED);

    // Act + Assert
    const secretDto = { secret: env.RESET_SECRET };

    const deleteResponsePV = await deleteProgram(
      programIdPV,
      accessToken,
      secretDto,
    );
    expect(deleteResponsePV.statusCode).toBe(HttpStatus.NO_CONTENT);

    const getProgramResponsePV = await getProgram(programIdPV, accessToken);
    expect(getProgramResponsePV.statusCode).toBe(HttpStatus.NOT_FOUND);

    const attachment = await getAttachments({
      programId: programIdPV,
      accessToken,
    });

    // Assert
    expect(attachment.status).toBe(HttpStatus.FORBIDDEN);
  });
});
