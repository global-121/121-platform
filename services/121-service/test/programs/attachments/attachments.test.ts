import { HttpStatus } from '@nestjs/common';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import { postProgram } from '@121-service/test/helpers/program.helper';
import {
  deleteAttachment,
  getAttachment,
  getAttachments,
  renameAttachment,
  uploadAttachment,
  uploadAttachments,
} from '@121-service/test/helpers/program-attachments.helper';
import { getAllUsers } from '@121-service/test/helpers/user.helper';
import {
  assignUserToProgram,
  getAccessToken,
  getAccessTokenScoped,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

const testImagePath = './test-attachment-data/sample.jpg';
const testImageFilename = 'Test Image';
const testImageMimetype = 'image/jpeg';
const testImageExtension = 'jpg';

const testCsvPath = './test-registration-data/test-registrations-OCW.csv';

const baseProgram = {
  titlePortal: { en: 'Attachments Test Program' },
  currency: CurrencyCode.EUR,
};

describe('Program Attachments', () => {
  let accessToken: string;
  let kisumuUserId: number;
  let turkanaUserId: number;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();

    const allUsersResponse = await getAllUsers(accessToken);
    const users = allUsersResponse.body as { id: number; username: string }[];
    const userByUsername = new Map(users.map((u) => [u.username, u.id]));
    kisumuUserId = userByUsername.get(`${DebugScope.Kisumu}@example.org`)!;
    turkanaUserId = userByUsername.get(`${DebugScope.Turkana}@example.org`)!;
  });

  async function setup({
    enableScope = true,
  }: { enableScope?: boolean } = {}): Promise<number> {
    const response = await postProgram(
      { ...baseProgram, enableScope },
      accessToken,
    );
    const programId = response.body.id;

    await assignUserToProgram({
      programId,
      userId: kisumuUserId,
      roles: [DefaultUserRole.CvaManager],
      scope: enableScope ? DebugScope.Kisumu : undefined,
      adminAccessToken: accessToken,
    });
    await assignUserToProgram({
      programId,
      userId: turkanaUserId,
      roles: [DefaultUserRole.CvaManager],
      scope: enableScope ? DebugScope.Turkana : undefined,
      adminAccessToken: accessToken,
    });

    return programId;
  }

  it('should upload a document attachment to a program', async () => {
    // Arrange
    const programId = await setup();

    // Act
    const response = await uploadAttachment({
      programId,
      filePath: testImagePath,
      filename: testImageFilename,
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toHaveProperty('id');
  });

  it('should return an error when too many files are uploaded', async () => {
    const programId = await setup();

    const response = await uploadAttachments({
      programId,
      filePaths: [testImagePath, testImagePath],
      filename: testImageFilename,
      accessToken,
    });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toBe('Too many files');
  });

  it('should rename an attachment in a program', async () => {
    // Arrange
    const programId = await setup();
    const uploadResponse = await uploadAttachment({
      programId,
      filePath: testImagePath,
      filename: testImageFilename,
      accessToken,
    });

    const attachmentId = uploadResponse.body.id;
    const newFilename = 'Renamed Test Image';
    // Act
    const renameResponse = await renameAttachment({
      programId,
      attachmentId,
      newFilename,
      accessToken,
    });
    // Assert
    expect(renameResponse.status).toBe(HttpStatus.OK);

    const getAttachmentResponse = await getAttachment({
      programId,
      attachmentId,
      accessToken,
    });

    const attachmentFilename = getAttachmentResponse.header[
      'content-disposition'
    ]
      .split('filename=')[1]
      .replaceAll('"', '');
    expect(attachmentFilename).toBe(`${newFilename}.${testImageExtension}`);
  });

  it('should list all attachments for a program', async () => {
    // Arrange
    const programId = await setup();
    await uploadAttachment({
      programId,
      filePath: testImagePath,
      filename: testImageFilename,
      accessToken,
    });

    // Act
    const response = await getAttachments({
      programId,
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);

    const attachment = response.body[0];
    expect(attachment).toMatchSnapshot({
      id: expect.any(Number),
      programId: expect.any(Number),
      created: expect.any(String),
      updated: expect.any(String),
      user: expect.objectContaining({ id: expect.any(Number) }),
      scope: expect.any(String),
    });
  });

  it('should download a specific attachment', async () => {
    // Arrange
    const programId = await setup();
    const uploadResponse = await uploadAttachment({
      programId,
      filePath: testImagePath,
      filename: testImageFilename,
      accessToken,
    });

    const attachmentId = uploadResponse.body.id;

    // Act
    const response = await getAttachment({
      programId,
      attachmentId,
      accessToken,
    })
      .buffer()
      .parse((res, callback) => {
        // Collect the response data as a buffer
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        res.on('end', () => {
          callback(null, Buffer.concat(chunks));
        });
      });

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.headers['content-type']).toBe(testImageMimetype);
    expect(response.headers['content-disposition']).toContain(
      `attachment; filename="${testImageFilename}.${testImageExtension}"`,
    );
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should delete a specific attachment', async () => {
    // Arrange
    const programId = await setup();
    const uploadResponse = await uploadAttachment({
      programId,
      filePath: testImagePath,
      filename: testImageFilename,
      accessToken,
    });

    const attachmentId = uploadResponse.body.id;

    // Act
    const deleteResponse = await deleteAttachment({
      programId,
      attachmentId,
      accessToken,
    });

    // Assert - Deletion successful
    expect(deleteResponse.status).toBe(HttpStatus.NO_CONTENT);

    // Verify the attachment is no longer retrievable
    const getResponse = await getAttachment({
      programId,
      attachmentId,
      accessToken,
    });

    expect(getResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should reject files with invalid mime types', async () => {
    // Arrange
    const programId = await setup();

    // Act
    const response = await uploadAttachment({
      programId,
      filePath: testCsvPath,
      filename: 'Test CSV',
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should handle attachment not found', async () => {
    // Arrange
    const programId = await setup();

    // Act
    const response = await getAttachment({
      programId,
      attachmentId: 999999,
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  describe('Scoping', () => {
    it('should only list attachments that are accessible for the user scope', async () => {
      // Arrange
      const programId = await setup({ enableScope: true });
      const kisumuAccessToken = await getAccessTokenScoped(DebugScope.Kisumu);
      const turkanaAccessToken = await getAccessTokenScoped(DebugScope.Turkana);

      await uploadAttachment({
        programId,
        filePath: testImagePath,
        filename: 'Kisumu Attachment',
        accessToken: kisumuAccessToken,
      });
      await uploadAttachment({
        programId,
        filePath: testImagePath,
        filename: 'Turkana Attachment',
        accessToken: turkanaAccessToken,
      });

      // Act
      const kisumuListResponse = await getAttachments({
        programId,
        accessToken: kisumuAccessToken,
      });
      const turkanaListResponse = await getAttachments({
        programId,
        accessToken: turkanaAccessToken,
      });

      // Assert
      expect(kisumuListResponse.status).toBe(HttpStatus.OK);
      expect(kisumuListResponse.body).toHaveLength(1);
      expect(kisumuListResponse.body[0].filename).toContain('Kisumu');

      expect(turkanaListResponse.status).toBe(HttpStatus.OK);
      expect(turkanaListResponse.body).toHaveLength(1);
      expect(turkanaListResponse.body[0].filename).toContain('Turkana');
    });

    it('should only download attachments that are accessible for the user scope', async () => {
      // Arrange
      const programId = await setup({ enableScope: true });
      const kisumuAccessToken = await getAccessTokenScoped(DebugScope.Kisumu);
      const turkanaAccessToken = await getAccessTokenScoped(DebugScope.Turkana);

      const uploadResponse = await uploadAttachment({
        programId,
        filePath: testImagePath,
        filename: testImageFilename,
        accessToken: turkanaAccessToken,
      });
      const attachmentId = uploadResponse.body.id;

      // Act
      const inScopeResponse = await getAttachment({
        programId,
        attachmentId,
        accessToken: turkanaAccessToken,
      });
      const outOfScopeResponse = await getAttachment({
        programId,
        attachmentId,
        accessToken: kisumuAccessToken,
      });

      // Assert
      expect(inScopeResponse.status).toBe(HttpStatus.OK);
      expect(outOfScopeResponse.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should only rename attachments that are accessible for the user scope', async () => {
      // Arrange
      const programId = await setup({ enableScope: true });
      const kisumuAccessToken = await getAccessTokenScoped(DebugScope.Kisumu);
      const turkanaAccessToken = await getAccessTokenScoped(DebugScope.Turkana);

      const uploadResponse = await uploadAttachment({
        programId,
        filePath: testImagePath,
        filename: testImageFilename,
        accessToken: turkanaAccessToken,
      });
      const attachmentId = uploadResponse.body.id;

      // Act
      const inScopeResponse = await renameAttachment({
        programId,
        attachmentId,
        newFilename: 'Renamed by Turkana',
        accessToken: turkanaAccessToken,
      });
      const outOfScopeResponse = await renameAttachment({
        programId,
        attachmentId,
        newFilename: 'Renamed by Kisumu',
        accessToken: kisumuAccessToken,
      });

      // Assert
      expect(inScopeResponse.status).toBe(HttpStatus.OK);
      expect(outOfScopeResponse.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should only delete attachments that are accessible for the user scope', async () => {
      // Arrange
      const programId = await setup({ enableScope: true });
      const kisumuAccessToken = await getAccessTokenScoped(DebugScope.Kisumu);
      const turkanaAccessToken = await getAccessTokenScoped(DebugScope.Turkana);

      const uploadResponse = await uploadAttachment({
        programId,
        filePath: testImagePath,
        filename: testImageFilename,
        accessToken: turkanaAccessToken,
      });
      const attachmentId = uploadResponse.body.id;

      // Act
      const outOfScopeResponse = await deleteAttachment({
        programId,
        attachmentId,
        accessToken: kisumuAccessToken,
      });
      const inScopeResponse = await deleteAttachment({
        programId,
        attachmentId,
        accessToken: turkanaAccessToken,
      });

      // Assert
      expect(outOfScopeResponse.status).toBe(HttpStatus.NOT_FOUND);
      expect(inScopeResponse.status).toBe(HttpStatus.NO_CONTENT);
    });

    it('should return all attachments regardless of scope when enableScope is false', async () => {
      // Arrange
      const programId = await setup({ enableScope: false });
      const kisumuAccessToken = await getAccessTokenScoped(DebugScope.Kisumu);
      const turkanaAccessToken = await getAccessTokenScoped(DebugScope.Turkana);

      await uploadAttachment({
        programId,
        filePath: testImagePath,
        filename: 'Kisumu Attachment',
        accessToken: kisumuAccessToken,
      });
      await uploadAttachment({
        programId,
        filePath: testImagePath,
        filename: 'Turkana Attachment',
        accessToken: turkanaAccessToken,
      });

      // Act
      const kisumuListResponse = await getAttachments({
        programId,
        accessToken: kisumuAccessToken,
      });

      // Assert
      expect(kisumuListResponse.status).toBe(HttpStatus.OK);
      expect(kisumuListResponse.body).toHaveLength(2);
    });
  });
});
