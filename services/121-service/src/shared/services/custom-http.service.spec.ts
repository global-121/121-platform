import { HttpService } from '@nestjs/axios';
import { KnownSeverityLevel } from 'applicationinsights';
import fs from 'node:fs';
import https from 'node:https';
import { of, throwError } from 'rxjs';

import { SensitivePiiValue } from '@121-service/src/shared/consts/sensitive-pii-value.class';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

jest.mock('fs');

describe('External HTTP telemetry', () => {
  let service: CustomHttpService;
  const client = {
    trackTrace: jest.fn(),
    trackException: jest.fn(),
    flush: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CustomHttpService({} as HttpService);
    service.defaultClient = client as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([false, true])(
    'should omit payloads and URL identifiers for failed=%s',
    (failed) => {
      // Arrange
      const request = {
        url: 'https://user:password@example.test/people/person-123?token=secret',
        payload: {
          username: 'person@example.test',
          password: 'secret',
          value: new SensitivePiiValue('personal-data'),
        },
      };
      const response = {
        status: failed ? 503 : 200,
        statusText: 'May contain personal-data',
        data: { phone: 'personal-data' },
      };

      // Act
      if (failed) {
        service.logErrorRequest(request, response);
      } else {
        service.logMessageRequest(request, response);
      }

      // Assert
      expect(client.trackTrace).toHaveBeenCalledWith({
        message: failed
          ? 'External HTTP request failed'
          : 'External HTTP request completed',
        severity: failed
          ? KnownSeverityLevel.Error
          : KnownSeverityLevel.Information,
        properties: {
          externalUrl: 'https://example.test',
          statusCode: String(response.status),
        },
      });
      expect(client.trackException).not.toHaveBeenCalled();
      expect(client.flush).not.toHaveBeenCalled();
    },
  );

  it('should omit absent metadata without inspecting circular payloads', () => {
    // Arrange
    const payload: { circular?: unknown } = {};
    payload.circular = payload;

    // Act
    service.logMessageRequest({ payload }, { data: payload });

    // Assert
    expect(client.trackTrace).toHaveBeenCalledWith({
      message: 'External HTTP request completed',
      severity: KnownSeverityLevel.Information,
      properties: {},
    });
  });

  it('should report invalid URLs without logging their content', () => {
    // Arrange
    jest.spyOn(console, 'warn').mockImplementation();

    // Act
    service.logMessageRequest({ url: 'invalid secret URL' }, { status: 200 });

    // Assert
    expect(console.warn).toHaveBeenCalledWith(
      'Omitted an invalid external request URL from telemetry',
    );
    expect(client.trackTrace).toHaveBeenCalledWith(
      expect.objectContaining({ properties: { statusCode: '200' } }),
    );
  });

  it('should skip telemetry without a client', () => {
    // Arrange
    service.defaultClient = undefined;

    // Act
    service.logMessageRequest({}, {});
    service.logErrorRequest({}, {});

    // Assert
    expect(client.trackTrace).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'should report SDK failures for failed=%s',
    (failed) => {
      // Arrange
      const error = new Error('SDK unavailable');
      client.trackTrace.mockImplementationOnce(() => {
        throw error;
      });
      jest.spyOn(console, 'error').mockImplementation();

      // Act
      if (failed) {
        service.logErrorRequest({}, {});
      } else {
        service.logMessageRequest({}, {});
      }

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('An error occurred'),
        error,
      );
    },
  );

  it.each([false, true])(
    'should preserve outbound values and response behavior for failed=%s',
    async (failed) => {
      // Arrange
      const response = {
        status: failed ? 400 : 200,
        statusText: 'Result',
        data: {},
      };
      const post = jest
        .fn()
        .mockReturnValue(
          failed ? throwError(() => ({ response })) : of(response),
        );
      service = new CustomHttpService({ post } as unknown as HttpService);
      service.defaultClient = client as any;
      const payload = {
        fullName: new SensitivePiiValue('Jane Doe'),
        nested: [{ value: new SensitivePiiValue('sensitive') }],
      };

      // Act
      const result = await service.post('https://example.test', payload);

      // Assert
      expect(post.mock.calls[0][1]).toEqual({
        fullName: 'Jane Doe',
        nested: [{ value: 'sensitive' }],
      });
      expect(payload.fullName).toBeInstanceOf(SensitivePiiValue);
      expect(result).toBe(response);
      expect(JSON.stringify(client.trackTrace.mock.calls)).not.toContain(
        'Jane Doe',
      );
    },
  );

  it('should preserve non-plain outbound payloads', async () => {
    // Arrange
    const post = jest.fn().mockReturnValue(of({ status: 200, data: {} }));
    service = new CustomHttpService({ post } as unknown as HttpService);
    const payload = new FormData();
    payload.append('file', 'content');

    // Act
    await service.post('https://example.test', payload);

    // Assert
    expect(post.mock.calls[0][1]).toBe(payload);
  });
});

describe('HTTPS agent configuration', () => {
  const service = new CustomHttpService({} as HttpService);

  it.each([undefined, 'test-passphrase'])(
    'should retain certificate options with passphrase %s',
    (passphrase) => {
      // Arrange
      const certificate = Buffer.from('test-certificate');
      jest.mocked(fs.readFileSync).mockReturnValue(certificate);

      // Act
      const agent = service.createHttpsAgentWithCertificate(
        'test.p12',
        passphrase,
      );

      // Assert
      expect(agent).toBeInstanceOf(https.Agent);
      expect(agent.options.pfx).toBe(certificate);
      expect(agent.options.passphrase).toBe(passphrase);
    },
  );

  it('should retain weak-certificate options for existing integrations', () => {
    // Arrange
    const certificate = Buffer.from('test-certificate');
    jest.mocked(fs.readFileSync).mockReturnValue(certificate);

    // Act
    const agent = service.createHttpsAgentWithWeakSelfSignedCertificateOnly(
      'test.pem',
      { keepAlive: true, maxSockets: 50 },
    );

    // Assert
    expect(agent.options.ca).toBe(certificate);
    expect(agent.options.keepAlive).toBe(true);
    expect(agent.options.maxSockets).toBe(50);
  });

  it('should retain missing-certificate errors', () => {
    // Arrange
    jest.mocked(fs.readFileSync).mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });

    // Act & Assert
    expect(() =>
      service.createHttpsAgentWithWeakSelfSignedCertificateOnly('missing.pem'),
    ).toThrow('Certificate not found at: missing.pem');
  });
});
