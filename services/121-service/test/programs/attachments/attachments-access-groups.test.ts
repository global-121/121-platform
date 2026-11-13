import { HttpStatus } from '@nestjs/common';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import {
  getAccessGroupAssignments,
  setupAccessGroupLevels,
} from '@121-service/test/helpers/access-group.helper';
import { postProgram } from '@121-service/test/helpers/program.helper';
import {
  deleteAttachment,
  getAttachment,
  getAttachments,
  renameAttachment,
  uploadAttachment,
} from '@121-service/test/helpers/program-attachments.helper';
import {
  createAccessTokenWithPermissions,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

const testImagePath = './test-attachment-data/sample.jpg';

const baseProgram = {
  titlePortal: { en: 'Attachments Access Groups Test Program' },
  currency: CurrencyCode.EUR,
};

const attachmentPermissions = [
  PermissionEnum.ProgramAttachmentsCREATE,
  PermissionEnum.ProgramAttachmentsREAD,
  PermissionEnum.ProgramAttachmentsUPDATE,
  PermissionEnum.ProgramAttachmentsDELETE,
];

describe('Program Attachments - access groups', () => {
  // Haarlem and Amsterdam are siblings within the same province
  const haarlemPath = 'noord-holland/haarlem';
  const amsterdamPath = 'noord-holland/amsterdam';
  const provincePath = 'noord-holland';

  let adminAccessToken: string;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.productionInitialState });
    adminAccessToken = await getAccessToken();
  });

  async function setupProgram({
    enableScope,
  }: {
    enableScope: boolean;
  }): Promise<number> {
    const response = await postProgram(
      { ...baseProgram, enableScope },
      adminAccessToken,
    );
    const programId = response.body.id;

    await setupAccessGroupLevels({
      programId,
      paths: [haarlemPath, amsterdamPath],
      accessToken: adminAccessToken,
    });

    return programId;
  }

  it('should only list attachments that are accessible for the user access groups', async () => {
    // Arrange
    const programId = await setupProgram({ enableScope: false });
    const haarlemAccessToken = await createAccessTokenWithPermissions({
      permissions: attachmentPermissions,
      programId,
      adminAccessToken,
      accessGroups: getAccessGroupAssignments({ path: haarlemPath }),
    });
    const amsterdamAccessToken = await createAccessTokenWithPermissions({
      permissions: attachmentPermissions,
      programId,
      adminAccessToken,
      accessGroups: getAccessGroupAssignments({ path: amsterdamPath }),
    });
    const provinceAccessToken = await createAccessTokenWithPermissions({
      permissions: attachmentPermissions,
      programId,
      adminAccessToken,
      accessGroups: getAccessGroupAssignments({ path: provincePath }),
    });

    await uploadAttachment({
      programId,
      filePath: testImagePath,
      filename: 'Haarlem Attachment',
      accessToken: haarlemAccessToken,
    });
    await uploadAttachment({
      programId,
      filePath: testImagePath,
      filename: 'Amsterdam Attachment',
      accessToken: amsterdamAccessToken,
    });

    // Act
    const haarlemListResponse = await getAttachments({
      programId,
      accessToken: haarlemAccessToken,
    });
    const provinceListResponse = await getAttachments({
      programId,
      accessToken: provinceAccessToken,
    });

    // Assert
    expect(haarlemListResponse.status).toBe(HttpStatus.OK);
    expect(haarlemListResponse.body).toHaveLength(1);
    expect(haarlemListResponse.body[0].filename).toContain('Haarlem');
    expect(haarlemListResponse.body[0].accessGroups).toEqual(
      getAccessGroupAssignments({ path: haarlemPath }),
    );

    expect(provinceListResponse.status).toBe(HttpStatus.OK);
    expect(provinceListResponse.body).toHaveLength(2);
  });

  it('should only download attachments that are accessible for the user access groups', async () => {
    // Arrange
    const programId = await setupProgram({ enableScope: false });
    const haarlemAccessToken = await createAccessTokenWithPermissions({
      permissions: attachmentPermissions,
      programId,
      adminAccessToken,
      accessGroups: getAccessGroupAssignments({ path: haarlemPath }),
    });
    const amsterdamAccessToken = await createAccessTokenWithPermissions({
      permissions: attachmentPermissions,
      programId,
      adminAccessToken,
      accessGroups: getAccessGroupAssignments({ path: amsterdamPath }),
    });
    const uploadResponse = await uploadAttachment({
      programId,
      filePath: testImagePath,
      filename: 'Amsterdam Attachment',
      accessToken: amsterdamAccessToken,
    });
    const attachmentId = uploadResponse.body.id;

    // Act
    const inAccessGroupResponse = await getAttachment({
      programId,
      attachmentId,
      accessToken: amsterdamAccessToken,
    });
    const outOfAccessGroupResponse = await getAttachment({
      programId,
      attachmentId,
      accessToken: haarlemAccessToken,
    });

    // Assert
    expect(inAccessGroupResponse.status).toBe(HttpStatus.OK);
    expect(outOfAccessGroupResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should only rename attachments that are accessible for the user access groups', async () => {
    // Arrange
    const programId = await setupProgram({ enableScope: false });
    const haarlemAccessToken = await createAccessTokenWithPermissions({
      permissions: attachmentPermissions,
      programId,
      adminAccessToken,
      accessGroups: getAccessGroupAssignments({ path: haarlemPath }),
    });
    const amsterdamAccessToken = await createAccessTokenWithPermissions({
      permissions: attachmentPermissions,
      programId,
      adminAccessToken,
      accessGroups: getAccessGroupAssignments({ path: amsterdamPath }),
    });
    const uploadResponse = await uploadAttachment({
      programId,
      filePath: testImagePath,
      filename: 'Amsterdam Attachment',
      accessToken: amsterdamAccessToken,
    });
    const attachmentId = uploadResponse.body.id;

    // Act
    const inAccessGroupResponse = await renameAttachment({
      programId,
      attachmentId,
      newFilename: 'Renamed by Amsterdam',
      accessToken: amsterdamAccessToken,
    });
    const outOfAccessGroupResponse = await renameAttachment({
      programId,
      attachmentId,
      newFilename: 'Renamed by Haarlem',
      accessToken: haarlemAccessToken,
    });

    // Assert
    expect(inAccessGroupResponse.status).toBe(HttpStatus.OK);
    expect(outOfAccessGroupResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should only delete attachments that are accessible for the user access groups', async () => {
    // Arrange
    const programId = await setupProgram({ enableScope: false });
    const haarlemAccessToken = await createAccessTokenWithPermissions({
      permissions: attachmentPermissions,
      programId,
      adminAccessToken,
      accessGroups: getAccessGroupAssignments({ path: haarlemPath }),
    });
    const amsterdamAccessToken = await createAccessTokenWithPermissions({
      permissions: attachmentPermissions,
      programId,
      adminAccessToken,
      accessGroups: getAccessGroupAssignments({ path: amsterdamPath }),
    });
    const uploadResponse = await uploadAttachment({
      programId,
      filePath: testImagePath,
      filename: 'Amsterdam Attachment',
      accessToken: amsterdamAccessToken,
    });
    const attachmentId = uploadResponse.body.id;

    // Act
    const outOfAccessGroupResponse = await deleteAttachment({
      programId,
      attachmentId,
      accessToken: haarlemAccessToken,
    });
    const inAccessGroupResponse = await deleteAttachment({
      programId,
      attachmentId,
      accessToken: amsterdamAccessToken,
    });

    // Assert
    expect(outOfAccessGroupResponse.status).toBe(HttpStatus.NOT_FOUND);
    expect(inAccessGroupResponse.status).toBe(HttpStatus.NO_CONTENT);
  });

  it('should only list attachments that are within both the scope and the access groups of the user when enableScope is true', async () => {
    // Arrange
    const programId = await setupProgram({ enableScope: true });
    const userAccessToken = await createAccessTokenWithPermissions({
      permissions: attachmentPermissions,
      programId,
      adminAccessToken,
      scope: DebugScope.Kisumu,
      accessGroups: getAccessGroupAssignments({ path: haarlemPath }),
    });
    const withinAccessGroupOnlyAccessToken = await createAccessTokenWithPermissions({
      permissions: attachmentPermissions,
      programId,
      adminAccessToken,
      scope: DebugScope.Turkana,
      accessGroups: getAccessGroupAssignments({ path: haarlemPath }),
    });
    const withinScopeOnlyAccessToken = await createAccessTokenWithPermissions({
      permissions: attachmentPermissions,
      programId,
      adminAccessToken,
      scope: DebugScope.Kisumu,
      accessGroups: getAccessGroupAssignments({ path: amsterdamPath }),
    });

    await uploadAttachment({
      programId,
      filePath: testImagePath,
      filename: 'Within scope and access group',
      accessToken: userAccessToken,
    });
    await uploadAttachment({
      programId,
      filePath: testImagePath,
      filename: 'Within access group only',
      accessToken: withinAccessGroupOnlyAccessToken,
    });
    await uploadAttachment({
      programId,
      filePath: testImagePath,
      filename: 'Within scope only',
      accessToken: withinScopeOnlyAccessToken,
    });

    // Act
    const listResponse = await getAttachments({
      programId,
      accessToken: userAccessToken,
    });

    // Assert
    expect(listResponse.status).toBe(HttpStatus.OK);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].filename).toContain(
      'Within scope and access group',
    );
  });
});
