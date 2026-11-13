import { SpanKind } from '@opentelemetry/api';
import { IncomingMessage } from 'node:http';
import { Socket } from 'node:net';

import {
  createTelemetryPrivacyProcessor,
  enrichHttpRequest,
} from '@121-service/src/telemetry/telemetry-privacy.helper';

describe('Privacy-safe dependency and request telemetry', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each<[unknown, string | undefined]>([
    [undefined, undefined],
    [null, undefined],
    ['invalid route', undefined],
    [{}, undefined],
    [{ path: /callback/ }, undefined],
    [{ path: '/callback/:reference' }, '/callback/:reference'],
  ])(
    'should use only string route templates from route %j',
    (route, expected) => {
      // Arrange
      const span = { setAttribute: jest.fn(), updateName: jest.fn() };
      const request = Object.assign(new IncomingMessage(new Socket()), {
        method: 'POST',
        route,
      });

      // Act
      enrichHttpRequest({ span: span as any, request });

      // Assert
      expect(span.setAttribute.mock.calls).toEqual(
        expected ? [['http.route', expected]] : [],
      );
      expect(span.updateName.mock.calls).toEqual(
        expected ? [[`POST ${expected}`]] : [],
      );
    },
  );

  it.each([undefined, '/people/:reference'])(
    'should exclude URL credentials, identifiers, query strings and database text for route %s',
    (route) => {
      // Arrange
      const attributes = {
        'http.url':
          'https://user:password@example.test/people/person-123?token=secret',
        'url.full':
          'https://example.test/people/person-123?token=secret#fragment',
        'http.target': '/people/person-123?token=secret',
        'url.path': '/people/person-123',
        'url.query': 'token=secret',
        'db.statement': "select * from people where phone = 'personal-data'",
        'db.query.text': 'set personal-key secret-value',
        'db.operation.name': 'set',
        interface: 'portal',
        ...(route ? { 'http.route': route } : {}),
      };

      // Act
      createTelemetryPrivacyProcessor().onEnding!({ attributes } as any);

      // Assert
      expect(attributes).toEqual({
        'http.url': `https://example.test${route ?? ''}`,
        'url.full': `https://example.test${route ?? ''}`,
        'db.operation.name': 'set',
        interface: 'portal',
        ...(route ? { 'http.route': route } : {}),
      });
    },
  );

  it('should report malformed URLs without exporting their content', () => {
    // Arrange
    const attributes = { 'http.url': 'invalid secret URL', 'url.full': 42 };
    jest.spyOn(console, 'warn').mockImplementation();

    // Act
    createTelemetryPrivacyProcessor().onEnding!({ attributes } as any);

    // Assert
    expect(attributes).toEqual({ 'url.full': 42 });
    expect(console.warn).toHaveBeenCalledWith(
      'Removed an invalid telemetry URL',
    );
  });

  it.each([SpanKind.SERVER, SpanKind.CLIENT])(
    'should remove caller addresses only from server spans (kind=%s)',
    (kind) => {
      // Arrange
      const attributes = {
        'client.address': 'caller-address',
        'net.peer.ip': 'peer-address',
        'db.user': 'database-user',
        'db.connection_string': 'database-connection',
      };

      // Act
      createTelemetryPrivacyProcessor().onEnding!({ attributes, kind } as any);

      // Assert
      expect(attributes).toEqual(
        kind === SpanKind.SERVER
          ? {}
          : {
              'client.address': 'caller-address',
              'net.peer.ip': 'peer-address',
            },
      );
    },
  );
});
