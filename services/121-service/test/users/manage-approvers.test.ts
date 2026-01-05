import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createApprover,
  deleteApprover,
  getApprovers,
  updateApprover,
} from '@121-service/test/helpers/user.helper';
import {
  getAccessToken,
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
    const sortedApprovers = getResponse.body.sort((obj1, obj2) =>
      obj1.id > obj2.id ? 1 : -1,
    );
    const newApprover = sortedApprovers[1];
    expect(newApprover).toMatchObject({
      userId,
      order,
    });

    // Update
    const approverId = postResponse.body.id;
    const newOrder = 10;
    const patchResponse = await updateApprover({
      programId,
      approverId,
      order: newOrder,
      accessToken,
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

  it('should not allow creating approver with duplicate order for same program', async () => {
    // Arrange
    const programId = 1;
    const userId = 3; // Not the admin-user, as that is approver by default already
    const order = 1; // order 1 is already taken by admin

    // Act
    const postResponse = await createApprover({
      programId,
      userId,
      order,
      accessToken,
    });
    expect(postResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(postResponse.body.message).toMatchInlineSnapshot(
      `"An approver with order 1 already exists for this program"`,
    );
  });

  it('should not allow updating approver to duplicate order for same program', async () => {
    // Arrange
    const programId = 1;
    const userId = 2; // Not the admin-user, as that is approver by default already
    const order = 5;

    const postResponse = await createApprover({
      programId,
      userId,
      order,
      accessToken,
    });
    expect(postResponse.status).toBe(HttpStatus.CREATED);
    const approverId = postResponse.body.id;

    // Act
    const newOrder = 1; // order 1 is already taken by admin
    const patchResponse = await updateApprover({
      programId,
      approverId,
      order: newOrder,
      accessToken,
    });
    expect(patchResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(patchResponse.body.message).toMatchInlineSnapshot(
      `"An approver with order 1 already exists for this program"`,
    );
  });
});
