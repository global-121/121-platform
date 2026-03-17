import { HttpStatus } from '@nestjs/common';

import { getMockServer } from '@121-service/test/helpers/utility.helper';

describe('Mock email service', () => {
  const validEmailPayload = {
    email: 'user@example.org',
    subject: 'Test subject',
    body: '<p>Hello, world!</p>',
  };

  it('should accept a valid email', async () => {
    const response = await getMockServer()
      .post('/email/send')
      .send(validEmailPayload);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.message).toBe('Email accepted');
  });

  it('should accept a valid email with attachment', async () => {
    const response = await getMockServer()
      .post('/email/send')
      .send({
        ...validEmailPayload,
        attachment: {
          name: 'report.pdf',
          contentBytes: 'base64encodedcontent',
        },
      });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.message).toBe('Email accepted');
  });

  it('should reject a malformatted email address', async () => {
    const response = await getMockServer()
      .post('/email/send')
      .send({ ...validEmailPayload, email: 'not-an-email' });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should reject an empty subject', async () => {
    const response = await getMockServer()
      .post('/email/send')
      .send({ ...validEmailPayload, subject: '' });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should reject an empty body', async () => {
    const response = await getMockServer()
      .post('/email/send')
      .send({ ...validEmailPayload, body: '' });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should reject a missing email field', async () => {
    const { email: _, ...payloadWithoutEmail } = validEmailPayload;

    const response = await getMockServer()
      .post('/email/send')
      .send(payloadWithoutEmail);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should reject a missing subject field', async () => {
    const { subject: _, ...payloadWithoutSubject } = validEmailPayload;

    const response = await getMockServer()
      .post('/email/send')
      .send(payloadWithoutSubject);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should reject an attachment with empty name', async () => {
    const response = await getMockServer()
      .post('/email/send')
      .send({
        ...validEmailPayload,
        attachment: {
          name: '',
          contentBytes: 'base64encodedcontent',
        },
      });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
