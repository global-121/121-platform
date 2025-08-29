import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  deleteAttachment,
  getAttachment,
  getAttachments,
  uploadAttachment,
} from '@121-service/test/helpers/project-attachments.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { projectIdPV } from '@121-service/test/registrations/pagination/pagination-data';

const testImagePath = './test-attachment-data/sample.jpg';
const testImageFilename = 'Test Image';
const testImageMimetype = 'image/jpeg';
const testImageExtension = 'jpg';

const testCsvPath = './test-registration-data/test-registrations-OCW.csv';

describe('Project Attachments', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should upload a document attachment to a project', async () => {
    // Arrange

    // Act
    const response = await uploadAttachment({
      projectId: projectIdPV,
      filePath: testImagePath,
      filename: testImageFilename,
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toHaveProperty('id');
  });

  it('should list all attachments for a project', async () => {
    // Arrange - Upload a test attachment first
    await uploadAttachment({
      projectId: projectIdPV,
      filePath: testImagePath,
      filename: testImageFilename,
      accessToken,
    });

    // Act
    const response = await getAttachments({
      projectId: projectIdPV,
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1); // Should return the uploaded attachment

    const attachment = response.body[0];
    expect(attachment).toMatchSnapshot({
      created: expect.any(String),
      updated: expect.any(String),
    });
  });

  it('should download a specific attachment', async () => {
    // Arrange - Upload a test attachment first
    const uploadResponse = await uploadAttachment({
      projectId: projectIdPV,
      filePath: testImagePath,
      filename: testImageFilename,
      accessToken,
    });

    const attachmentId = uploadResponse.body.id;

    // Act
    const response = await getAttachment({
      projectId: projectIdPV,
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
    const uploadResponse = await uploadAttachment({
      projectId: projectIdPV,
      filePath: testImagePath,
      filename: testImageFilename,
      accessToken,
    });

    const attachmentId = uploadResponse.body.id;

    // Act
    const deleteResponse = await deleteAttachment({
      projectId: projectIdPV,
      attachmentId,
      accessToken,
    });

    // Assert - Deletion successful
    expect(deleteResponse.status).toBe(HttpStatus.NO_CONTENT);

    // Verify the attachment is no longer retrievable
    const getResponse = await getAttachment({
      projectId: projectIdPV,
      attachmentId,
      accessToken,
    });

    expect(getResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should reject files with invalid mime types', async () => {
    // Act
    const response = await uploadAttachment({
      projectId: projectIdPV,
      filePath: testCsvPath,
      filename: 'Test CSV',
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should handle attachment not found', async () => {
    // Act
    const response = await getAttachment({
      projectId: projectIdPV,
      attachmentId: 999999,
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});
