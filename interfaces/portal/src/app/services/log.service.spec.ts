import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockedObject,
  vi,
} from 'vitest';

import { GlobalErrorHandler, LogService } from '~/services/log.service';

describe('GlobalErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let mockLogService: MockedObject<LogService>;

  beforeEach(() => {
    mockLogService = vi.mocked({
      logException: vi.fn().mockName('LogService.logException'),
    } as unknown as LogService);

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: LogService, useValue: mockLogService },
      ],
    });

    errorHandler = TestBed.inject(GlobalErrorHandler);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is registered as the global Angular ErrorHandler', () => {
    expect(LogService.APP_PROVIDERS).toContainEqual({
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    });
  });

  it('forwards an Error instance to LogService.logException as-is', () => {
    const error = new Error('Something broke');

    errorHandler.handleError(error);

    expect(mockLogService.logException).toHaveBeenCalledWith(error);
  });

  it('wraps a non-Error value in an Error before logging it', () => {
    errorHandler.handleError('plain string error');

    expect(mockLogService.logException).toHaveBeenCalledTimes(1);
    const loggedException = mockLogService.logException.mock.calls[0][0];
    expect(loggedException).toBeInstanceOf(Error);
    expect(loggedException.message).toBe('plain string error');
  });
});

describe('LogService', () => {
  let service: LogService;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LogService],
    });

    service = TestBed.inject(LogService);
    consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('always logs exceptions to the console, even without Application Insights', () => {
    const error = new Error('boom');

    service.logException(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith('LOG Exception:', error, '');
  });
});
