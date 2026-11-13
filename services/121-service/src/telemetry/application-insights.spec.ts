import * as appInsights from 'applicationinsights';
import type { IncomingMessage } from 'node:http';

import { env } from '@121-service/src/env';
import { INTERFACE_NAME_HEADER } from '@121-service/src/shared/enum/interface-names.enum';
import { initializeApplicationInsights } from '@121-service/src/telemetry/application-insights';

jest.mock('applicationinsights', () => ({
  ...jest.requireActual('applicationinsights'),
  setup: jest.fn(),
}));
jest.mock('@121-service/src/env', () => ({
  env: { APPLICATIONINSIGHTS_CONNECTION_STRING: undefined },
}));

describe('Application Insights initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(appInsights.setup).mockReturnValue(appInsights.Configuration);
    jest
      .spyOn(appInsights.Configuration, 'setAzureMonitorOptions')
      .mockReturnValue(appInsights.Configuration);
    jest
      .spyOn(appInsights.Configuration, 'start')
      .mockReturnValue(appInsights.Configuration);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should leave telemetry disabled without a connection string', () => {
    // Arrange
    jest.replaceProperty(env, 'APPLICATIONINSIGHTS_CONNECTION_STRING', undefined);

    // Act
    initializeApplicationInsights();

    // Assert
    expect(appInsights.setup).not.toHaveBeenCalled();
    expect(appInsights.Configuration.start).not.toHaveBeenCalled();
  });

  it.each([
    ['portal', { interface: 'portal' }],
    [undefined, {}],
    ['', {}],
    [['portal', 'integration'], { interface: ['portal', 'integration'] }],
  ])('should preserve interface enrichment for header %j', (header, expected) => {
    // Arrange
    const connectionString =
      'InstrumentationKey=00000000-0000-4000-8000-000000000001';
    jest.replaceProperty(
      env,
      'APPLICATIONINSIGHTS_CONNECTION_STRING',
      connectionString,
    );

    // Act
    initializeApplicationInsights();
    const options = jest.mocked(appInsights.Configuration.setAzureMonitorOptions)
      .mock.calls[0][0];
    const httpOptions = options.instrumentationOptions!.http as {
      startIncomingSpanHook: (
        request: Pick<IncomingMessage, 'headers'>,
      ) => Record<string, string | string[]>;
    };
    const attributes = httpOptions.startIncomingSpanHook({
      headers: { [INTERFACE_NAME_HEADER]: header },
    });

    // Assert
    expect(attributes).toEqual(expected);
    expect(options.tracesPerSecond).toBe(0);
    expect(appInsights.setup).toHaveBeenCalledWith(connectionString);
    expect(appInsights.Configuration.start).toHaveBeenCalledTimes(1);
    expect(
      jest.mocked(appInsights.Configuration.setAzureMonitorOptions).mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      jest.mocked(appInsights.Configuration.start).mock.invocationCallOrder[0],
    );
  });
});
