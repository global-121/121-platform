import { type Span, SpanKind } from '@opentelemetry/api';
import type { AzureMonitorOpenTelemetryOptions } from 'applicationinsights';
import type { ClientRequest, IncomingMessage } from 'node:http';

type SpanProcessor = NonNullable<
  AzureMonitorOpenTelemetryOptions['spanProcessors']
>[number];

export function enrichHttpRequest({
  span,
  request,
}: {
  span: Span;
  request: IncomingMessage | ClientRequest;
}): void {
  if (
    !('route' in request) ||
    !request.route ||
    typeof request.route !== 'object' ||
    !('path' in request.route) ||
    typeof request.route.path !== 'string'
  ) {
    return;
  }

  span.setAttribute('http.route', request.route.path);
  span.updateName(`${request.method} ${request.route.path}`);
}

export function createTelemetryPrivacyProcessor(): SpanProcessor {
  return {
    onStart: () => undefined,
    onEnding: (span) => {
      for (const key of ['http.url', 'url.full']) {
        const value = span.attributes[key];
        if (typeof value !== 'string') {
          continue;
        }
        if (!URL.canParse(value)) {
          delete span.attributes[key];
          console.warn('Removed an invalid telemetry URL');
          continue;
        }
        const url = new URL(value);
        const route = span.attributes['http.route'];
        span.attributes[key] =
          url.origin + (typeof route === 'string' ? route : '');
      }

      for (const key of [
        'http.target',
        'url.path',
        'url.query',
        'db.statement',
        'db.query.text',
        'db.user',
        'db.connection_string',
      ]) {
        delete span.attributes[key];
      }
      if (span.kind === SpanKind.SERVER) {
        for (const key of [
          'client.address',
          'client.port',
          'http.client_ip',
          'net.peer.ip',
          'net.peer.port',
          'net.peer.name',
          'net.sock.peer.addr',
          'net.sock.peer.port',
          'network.peer.address',
          'network.peer.port',
        ]) {
          delete span.attributes[key];
        }
      }
    },
    onEnd: () => undefined,
    forceFlush: () => Promise.resolve(),
    shutdown: () => Promise.resolve(),
  };
}
