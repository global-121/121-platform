import { HttpStatus } from '@nestjs/common';

import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createApprover,
  deleteApprover,
  getApprovers,
  getCurrentUser,
  updateApprover,
} from '@121-service/test/helpers/user.helper';
import {
  getAccessToken,
  getAccessTokenScoped,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

let accessToken: string;
let postResponse;
const programId = 2;
const userId = 2; // Not the admin-user, as that is approver by default already
const order = 5;

beforeEach(async () => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  accessToken = await getAccessToken();

  postResponse = await createApprover({
    programId,
    userId,
    order,
    accessToken,
  });
});

describe('Create Approver', () => {
  it('should create approver successfully', async () => {
    expect(postResponse.status).toBe(HttpStatus.CREATED);
  });

  it('should throw on creating approver with duplicate order for same program', async () => {
    const userIdDup = 3; // different user
    const orderDup = 1; // order 1 is already taken by admin

    const postResponse = await createApprover({
      programId,
      userId: userIdDup,
      order: orderDup,
      accessToken,
    });
    expect(postResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(postResponse.body.message).toMatchInlineSnapshot(
      `"An approver with order 1 already exists for this program"`,
    );
  });

  it('should throw on creating approver for user that is already approver in the program', async () => {
    const orderNew = 3;

    const postResponse = await createApprover({
      programId,
      userId,
      order: orderNew,
      accessToken,
    });
    expect(postResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(postResponse.body.message).toMatchInlineSnapshot(
      `"User is already an approver for this program"`,
    );
  });

  it('should throw on creating approver for user that has assignment with scope in the program', async () => {
    const accessTokenScoped = await getAccessTokenScoped(DebugScope.Kisumu);
    const userScoped = await getCurrentUser({
      accessToken: accessTokenScoped,
    });
    const orderNew = 3;

    const postResponse = await createApprover({
      programId,
      userId: userScoped.body.user.id,
      order: orderNew,
      accessToken,
    });
    expect(postResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(postResponse.body.message).toMatchInlineSnapshot(
      `"Only users without scope (for a program) can be made approver (for that program). Edit the scope of the user-program assignment first (if intended) and retry here."`,
    );
  });
});

describe('Read Approvers', () => {
  it('should read approvers including the new one', async () => {
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
  });
});

describe('Update Approver', () => {
  it('should update approver order', async () => {
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
  });

  it('should not allow updating approver to duplicate order for same program', async () => {
    const approverId = postResponse.body.id;
    const newOrderDup = 1; // order 1 is already taken by admin
    const patchResponse = await updateApprover({
      programId,
      approverId,
      order: newOrderDup,
      accessToken,
    });
    expect(patchResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(patchResponse.body.message).toMatchInlineSnapshot(
      `"An approver with order 1 already exists for this program"`,
    );
  });
});

describe('Delete Approver', () => {
  it('should delete approver and only have admin left', async () => {
    const approverId = postResponse.body.id;
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
