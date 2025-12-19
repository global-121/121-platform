import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createApprover,
  deleteApprover,
  getApprovers,
} from '@121-service/test/helpers/user.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('manage approvers', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.safaricomProgram, __filename);
    accessToken = await getAccessToken();
  });

  it('should Create, Read, Update and Delete approver successfully', async () => {
    // Arrange
    const programId = 1;
    const userId = 2; // Not the admin-user, as that is approver by default already
    const order = 5;

    // Act
    const postResponse = await createApprover({
      programId,
      userId,
      order,
      accessToken,
    });
    expect(postResponse.status).toBe(HttpStatus.CREATED);

    // Read
    const getResponse = await getApprovers({
      programId,
      accessToken,
    });
    expect(getResponse.status).toBe(HttpStatus.OK);
    expect(getResponse.body).toHaveLength(2); // admin + new
    expect(getResponse.body.sort((a, b) => a.id - b.id)[1]).toMatchObject({
      userId,
      order,
    });

    // Update
    const approverId = postResponse.body.id;
    const newOrder = 10;
    const patchResponse = await getServer()
      .patch(`/programs/${programId}/approvers/${approverId}`)
      .set('Cookie', [accessToken])
      .send({
        order: newOrder,
      });
    expect(patchResponse.status).toBe(HttpStatus.OK);
    expect(patchResponse.body).toMatchObject({
      id: approverId,
      userId,
      order: newOrder,
    });

    // Delete
    const deleteResponse = await deleteApprover({
      programId,
      approverId,
      accessToken,
    });
    expect(deleteResponse.status).toBe(HttpStatus.NO_CONTENT);
    const getAfterDeleteResponse = await getApprovers({
      programId,
      accessToken,
    });
    expect(getAfterDeleteResponse.status).toBe(HttpStatus.OK);
    expect(getAfterDeleteResponse.body).toHaveLength(1); // only admin left
  });
});
