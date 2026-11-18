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
  const sessionToken = 'session-token-value';

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
    isSensitive,
  }: {
    isSensitive?: boolean;
  }): Promise<string> => {
    const request = service.performRequest({
      method: 'POST',
      url,
      body: { username: 'user@example.org', password: secret },
      isSensitive,
    });
    httpTestingController
      .expectOne(url)
      .flush({ username: 'user@example.org', access_token: sessionToken });
    await request;

    return JSON.stringify(consoleLogSpy.mock.calls);
  };

  it('keeps a sensitive body and the response with its session token out of the logs', async () => {
    // Act
    const loggedOutput = await performRequestAndGetLogs({
      isSensitive: true,
    });

    // Assert
    expect(loggedOutput).not.toContain(secret);
    expect(loggedOutput).not.toContain(sessionToken);
    expect(loggedOutput).toContain('[redacted]');
  });

  it('still sends a sensitive body to the server and returns the full response', async () => {
    // Act
    const request = service.performRequest({
      method: 'POST',
      url,
      body: { password: secret },
      isSensitive: true,
    });
    const testRequest = httpTestingController.expectOne(url);
    testRequest.flush({ access_token: sessionToken });
    const response = await request;

    // Assert
    expect(testRequest.request.body).toEqual({ password: secret });
    expect(response).toEqual({ access_token: sessionToken });
  });

  it('logs a non-sensitive body and response', async () => {
    // Act
    const loggedOutput = await performRequestAndGetLogs({});

    // Assert
    expect(loggedOutput).toContain(secret);
    expect(loggedOutput).toContain(sessionToken);
  });
});
