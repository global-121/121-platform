import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  MockInstance,
  vi,
} from 'vitest';

import { HttpWrapperService } from '~/services/http-wrapper.service';

describe('HttpWrapperService', () => {
  const url = 'https://example.org/users/login';
  const secret = 'super-secret-value';

  let service: HttpWrapperService;
  let httpTestingController: HttpTestingController;
  let consoleLogSpy: MockInstance<typeof console.log>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HttpWrapperService);
    httpTestingController = TestBed.inject(HttpTestingController);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      // Silence request logging in test output
    });
  });

  afterEach(() => {
    httpTestingController.verify();
    vi.restoreAllMocks();
  });

  const performRequestAndGetLogs = async ({
    hasSensitiveBody,
  }: {
    hasSensitiveBody?: boolean;
  }): Promise<string> => {
    const request = service.performRequest({
      method: 'POST',
      url,
      body: { username: 'user@example.org', password: secret },
      hasSensitiveBody,
    });
    httpTestingController.expectOne(url).flush({});
    await request;

    return JSON.stringify(consoleLogSpy.mock.calls);
  };

  it('keeps a sensitive body out of the logs', async () => {
    // Act
    const loggedOutput = await performRequestAndGetLogs({
      hasSensitiveBody: true,
    });

    // Assert
    expect(loggedOutput).not.toContain(secret);
    expect(loggedOutput).toContain('[redacted]');
  });

  it('still sends a sensitive body to the server', async () => {
    // Act
    const request = service.performRequest({
      method: 'POST',
      url,
      body: { password: secret },
      hasSensitiveBody: true,
    });
    const testRequest = httpTestingController.expectOne(url);
    testRequest.flush({});
    await request;

    // Assert
    expect(testRequest.request.body).toEqual({ password: secret });
  });

  it('logs a non-sensitive body', async () => {
    // Act
    const loggedOutput = await performRequestAndGetLogs({});

    // Assert
    expect(loggedOutput).toContain(secret);
  });
});
