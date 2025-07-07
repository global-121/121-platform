import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getServer } from '@121-service/test/helpers/utility.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

const testImagePath = './test-attachment-data/sample.jpg';
const testImageFilename = 'Test Image';
const testImageMimetype = 'image/jpeg';
const testImageExtension = 'jpg';

const testCsvPath = './test-registration-data/test-registrations-OCW.csv';

describe('Program Attachments', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should upload a document attachment to a program', async () => {
    // Arrange

    // Act
    const response = await getServer()
      .post(`/programs/${programIdPV}/attachments`)
      .set('Cookie', [accessToken])
      .attach('file', testImagePath)
      .field('filename', testImageFilename);

    // Assert
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toHaveProperty('id');
    expect(response.body.filename).toBe(
      `${testImageFilename}.${testImageExtension}`,
    );
    expect(response.body.mimetype).toBe(testImageMimetype);
    expect(response.body.programId).toBe(programIdPV);
  });

  it('should list all attachments for a program', async () => {
    // Arrange - Upload a test attachment first
    await getServer()
      .post(`/programs/${programIdPV}/attachments`)
      .set('Cookie', [accessToken])
      .attach('file', testImagePath)
      .field('filename', testImageFilename);

    // Act
    const response = await getServer()
      .get(`/programs/${programIdPV}/attachments`)
      .set('Cookie', [accessToken]);

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1); // Should return the uploaded attachment

    const attachment = response.body[0];
    expect(attachment).toMatchSnapshot({
      created: expect.any(String),
      updated: expect.any(String),
      blobName: expect.any(String),
      user: {
        created: expect.any(String),
        updated: expect.any(String),
        lastLogin: expect.any(String),
      },
    });
  });

  it('should download a specific attachment', async () => {
    const uploadResponse = await getServer()
      .post(`/programs/${programIdPV}/attachments`)
      .set('Cookie', [accessToken])
      .attach('file', testImagePath)
      .field('filename', testImageFilename);

    const attachmentId = uploadResponse.body.id;

    // Act
    const response = await getServer()
      .get(`/programs/${programIdPV}/attachments/${attachmentId}`)
      .set('Cookie', [accessToken])
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
    const uploadResponse = await getServer()
      .post(`/programs/${programIdPV}/attachments`)
      .set('Cookie', [accessToken])
      .attach('file', testImagePath)
      .field('filename', 'Test Image');

    const attachmentId = uploadResponse.body.id;

    // Verify the attachment exists before deletion
    let getResponse = await getServer()
      .get(`/programs/${programIdPV}/attachments/${attachmentId}`)
      .set('Cookie', [accessToken]);

    expect(getResponse.status).toBe(HttpStatus.OK);

    // Act
    const deleteResponse = await getServer()
      .delete(`/programs/${programIdPV}/attachments/${attachmentId}`)
      .set('Cookie', [accessToken]);

    // Assert - Deletion successful
    expect(deleteResponse.status).toBe(HttpStatus.OK);

    // Verify the attachment is no longer retrievable
    getResponse = await getServer()
      .get(`/programs/${programIdPV}/attachments/${attachmentId}`)
      .set('Cookie', [accessToken]);

    expect(getResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should reject files with invalid mime types', async () => {
    // Act
    const response = await getServer()
      .post(`/programs/${programIdPV}/attachments`)
      .set('Cookie', [accessToken])
      .attach('file', testCsvPath)
      .field('filename', 'Test CSV');

    // Assert
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should handle attachment not found', async () => {
    // Act
    const response = await getServer()
      .get(`/programs/${programIdPV}/attachments/999999`)
      .set('Cookie', [accessToken]);

    // Assert
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});
