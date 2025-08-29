/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { postNote } from '@121-service/test/helpers/project.helper';
import { importRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationOCW1 } from '@121-service/test/registrations/pagination/pagination-data';

describe('Notes', () => {
  let accessToken: string;
  const projectId = 3;

  const noteText = 'test note';

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await importRegistrations(projectId, [registrationOCW1], accessToken);
  });

  it('should post a note', async () => {
    // Act
    const postNoteResponse = await postNote(
      registrationOCW1.referenceId,
      noteText,
      projectId,
      accessToken,
    );

    // Assert
    expect(postNoteResponse.statusCode).toBe(HttpStatus.CREATED);
  });
});
