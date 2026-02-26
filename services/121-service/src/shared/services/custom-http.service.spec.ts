import { HttpStatus } from '@nestjs/common';
import fs from 'node:fs';
import https from 'node:https';

import { CookieNames } from '@121-service/src/shared/enum/cookie.enums';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

jest.mock('fs');

describe('CustomHttpService', () => {
  let service: CustomHttpService;

  beforeEach(() => {
    service = new CustomHttpService({} as any);
  });

  describe('createHttpsAgentWithCertificate', () => {
    it('should create an HTTPS agent with a certificate and passphrase', () => {
      const certificatePath = 'path/to/certificate.p12';
      const password = 'test-password';
      const dummyCertificate = Buffer.from('dummy-certificate');

      (fs.readFileSync as jest.Mock).mockReturnValue(dummyCertificate);

      const agent = service.createHttpsAgentWithCertificate(
        certificatePath,
        password,
      );

      expect(agent).toBeInstanceOf(https.Agent);
      expect(agent.options.pfx).toBe(dummyCertificate);
      expect(agent.options.passphrase).toBe(password);
    });

    it('should create an HTTPS agent with a certificate without passphrase', () => {
      const certificatePath = 'path/to/certificate.p12';
      const dummyCertificate = Buffer.from('dummy-certificate');

      (fs.readFileSync as jest.Mock).mockReturnValue(dummyCertificate);

      const agent = service.createHttpsAgentWithCertificate(certificatePath);

      expect(agent).toBeInstanceOf(https.Agent);
      expect(agent.options.pfx).toBe(dummyCertificate);
      expect(agent.options.passphrase).toBeUndefined();
    });
  });

  describe('createHttpsAgentWithWeakSelfSignedCertificateOnly', () => {
    it('should create an HTTPS agent with a self-signed certificate and extra options', () => {
      const certificatePath = 'path/to/certificate.crt';
      const dummyCertificate = Buffer.from('dummy-ca-certificate');
      const extraOpts = { keepAlive: true, maxSockets: 50 };

      (fs.readFileSync as jest.Mock).mockReturnValue(dummyCertificate);

      const agent = service.createHttpsAgentWithWeakSelfSignedCertificateOnly(
        certificatePath,
        extraOpts,
      );

      expect(agent).toBeInstanceOf(https.Agent);
      expect(agent.options.ca).toBe(dummyCertificate);
      expect(agent.options.keepAlive).toBe(true);
      expect(agent.options.maxSockets).toBe(50);
    });

    it('should throw an error if self-signed certificate file is not found', () => {
      const certificatePath = 'path/to/nonexistent.crt';
      const fileError = new Error('ENOENT: no such file or directory');

      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw fileError;
      });

      expect(() => {
        service.createHttpsAgentWithWeakSelfSignedCertificateOnly(
          certificatePath,
        );
      }).toThrowErrorMatchingInlineSnapshot(`
       "Certificate not found at: path/to/nonexistent.crt
       Cause: ENOENT: no such file or directory"
      `);
    });
  });

  describe('logMessageRequest', () => {
    const mockTrackTrace = jest.fn();
    const mockFlush = jest.fn();

    const getTracedMessage = (): string =>
      mockTrackTrace.mock.calls[0][0].message;

    beforeEach(() => {
      jest.clearAllMocks();
      service.defaultClient = {
        trackTrace: mockTrackTrace,
        flush: mockFlush,
      } as any;
    });

    it.each([
      {
        caseName: 'password value',
        sensitiveValue: 'super-secret-password',
        request: {
          url: 'http://example.com/api',
          payload: { password: 'super-secret-password' },
        },
        response: { status: HttpStatus.OK, statusText: 'OK', data: {} },
      },
      {
        caseName: 'access_token value',
        sensitiveValue: 'eyJhbGciOiJSUzI1NiJ9.sensitive-token-value',
        request: {
          url: 'http://example.com/api',
          payload: {
            access_token: 'eyJhbGciOiJSUzI1NiJ9.sensitive-token-value',
          },
        },
        response: { status: HttpStatus.OK, statusText: 'OK', data: {} },
      },
      {
        caseName: `${CookieNames.general} cookie value`,
        sensitiveValue: `${CookieNames.general}=secret-session-value`,
        request: { url: 'http://example.com/api', payload: null },
        response: {
          status: HttpStatus.OK,
          statusText: 'OK',
          data: {
            [CookieNames.general]: `${CookieNames.general}=secret-session-value`,
          },
        },
      },
      {
        caseName: `${CookieNames.portal} cookie value`,
        sensitiveValue: `${CookieNames.portal}=secret-portal-value`,
        request: { url: 'http://example.com/api', payload: null },
        response: {
          status: HttpStatus.OK,
          statusText: 'OK',
          data: {
            [CookieNames.portal]: `${CookieNames.portal}=secret-portal-value`,
          },
        },
      },
    ])(
      'should not include the actual $caseName in the logged message',
      ({ request, response, sensitiveValue }) => {

        // Act
        service.logMessageRequest(request, response);

        // Assert
        expect(getTracedMessage()).not.toContain(sensitiveValue);
        expect(getTracedMessage()).toContain('**REDACTED**');
      },
    );

    it('should mask the username but still include its first characters in the logged message', () => {
      service.logMessageRequest(
        {
          url: 'http://example.com/api',
          payload: { username: 'user@example.com', password: 'secret' },
        },
        { status: HttpStatus.OK, statusText: 'OK', data: {} },
      );

      expect(getTracedMessage()).toContain('use'); // First 3 characters are kept
      expect(getTracedMessage()).not.toContain('user@example.com'); // Full value is not present
    });

    it('should still include non-sensitive data in the logged message', () => {
      service.logMessageRequest(
        {
          url: 'http://example.com/api',
          payload: { transactionReference: 'TXN-12345', amount: 100 },
        },
        {
          status: HttpStatus.OK,
          statusText: 'OK',
          data: { resultCode: 'SUCCESS' },
        },
      );

      expect(getTracedMessage()).toContain('TXN-12345');
      expect(getTracedMessage()).toContain('SUCCESS');
    });

    it('should not mutate the original request payload object', () => {
      const originalPayload = {
        password: 'secret',
        access_token: 'token',
        username: 'user@example.com',
        amount: 42,
      };
      const payloadCopy = { ...originalPayload };

      service.logMessageRequest(
        { url: 'http://example.com/api', payload: originalPayload },
        { status: HttpStatus.OK, statusText: 'OK', data: {} },
      );

      expect(originalPayload).toEqual(payloadCopy);
    });

    it('should handle a null payload without throwing', () => {
      expect(() => {
        service.logMessageRequest(
          { url: 'http://example.com/api', payload: null },
          { status: HttpStatus.OK, statusText: 'OK', data: null },
        );
      }).not.toThrow();
    });
  });

  describe('logErrorRequest', () => {
    const mockTrackException = jest.fn();
    const mockFlush = jest.fn();

    const getExceptionMessage = (): string =>
      mockTrackException.mock.calls[0][0].exception.message;

    beforeEach(() => {
      jest.clearAllMocks();
      service.defaultClient = {
        trackException: mockTrackException,
        flush: mockFlush,
      } as any;
    });

    it.each([
      {
        caseName: 'password value',
        sensitiveValue: 'super-secret-password',
        request: {
          url: 'http://example.com/api',
          payload: { password: 'super-secret-password' },
        },
        errorResponse: {
          status: HttpStatus.UNAUTHORIZED,
          statusText: 'Unauthorized',
          data: {},
        },
      },
      {
        caseName: 'access_token value',
        sensitiveValue: 'eyJhbGciOiJSUzI1NiJ9.sensitive-token-value',
        request: { url: 'http://example.com/api', payload: null },
        errorResponse: {
          status: HttpStatus.UNAUTHORIZED,
          statusText: 'Unauthorized',
          data: { access_token: 'eyJhbGciOiJSUzI1NiJ9.sensitive-token-value' },
        },
      },
      {
        caseName: `${CookieNames.general} cookie value`,
        sensitiveValue: `${CookieNames.general}=secret-session-value`,
        request: { url: 'http://example.com/api', payload: null },
        errorResponse: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          statusText: 'Internal Server Error',
          data: {
            [CookieNames.general]: `${CookieNames.general}=secret-session-value`,
          },
        },
      },
      {
        caseName: `${CookieNames.portal} cookie value`,
        sensitiveValue: `${CookieNames.portal}=secret-portal-value`,
        request: { url: 'http://example.com/api', payload: null },
        errorResponse: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          statusText: 'Internal Server Error',
          data: {
            [CookieNames.portal]: `${CookieNames.portal}=secret-portal-value`,
          },
        },
      },
    ])(
      'should not include the actual $caseName in the logged error',
      ({ request, errorResponse, sensitiveValue }) => {

        // Act
        service.logErrorRequest(request, errorResponse);

        // Assert
        expect(getExceptionMessage()).not.toContain(sensitiveValue);
        expect(getExceptionMessage()).toContain('**REDACTED**');
      },
    );

    it('should mask the username but still include its first characters in the logged error', () => {
      service.logErrorRequest(
        {
          url: 'http://example.com/api',
          payload: { username: 'user@example.com', password: 'secret' },
        },
        {
          status: HttpStatus.UNAUTHORIZED,
          statusText: 'Unauthorized',
          data: {},
        },
      );

      expect(getExceptionMessage()).toContain('use'); // First 3 characters are kept
      expect(getExceptionMessage()).not.toContain('user@example.com'); // Full value is not present
    });

    it('should still include non-sensitive data in the logged error', () => {
      service.logErrorRequest(
        {
          url: 'http://example.com/api',
          payload: { transactionReference: 'TXN-12345' },
        },
        {
          status: HttpStatus.BAD_REQUEST,
          statusText: 'Bad Request',
          data: { errorCode: 'INVALID_AMOUNT' },
        },
      );

      expect(getExceptionMessage()).toContain('TXN-12345');
      expect(getExceptionMessage()).toContain('INVALID_AMOUNT');
    });

    it('should not mutate the original request payload object', () => {
      const originalPayload = {
        password: 'secret',
        access_token: 'token',
        username: 'user@example.com',
        amount: 42,
      };
      const payloadCopy = { ...originalPayload };

      service.logErrorRequest(
        { url: 'http://example.com/api', payload: originalPayload },
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          statusText: 'Internal Server Error',
          data: {},
        },
      );

      expect(originalPayload).toEqual(payloadCopy);
    });

    it('should handle a null payload and null error data without throwing', () => {
      expect(() => {
        service.logErrorRequest(
          { url: 'http://example.com/api', payload: null },
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            statusText: 'Internal Server Error',
            data: null,
          },
        );
      }).not.toThrow();
    });
  });
});
