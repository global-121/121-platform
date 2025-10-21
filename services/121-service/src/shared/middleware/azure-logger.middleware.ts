import { Injectable, NestMiddleware } from '@nestjs/common';
import { defaultClient, TelemetryClient } from 'applicationinsights';
import { NextFunction, Request, Response } from 'express';

import { env } from '@121-service/src/env';

@Injectable()
export class AzureLoggerMiddleware implements NestMiddleware {
  defaultClient: TelemetryClient;

  constructor() {
    if (!!env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
      this.defaultClient = defaultClient;
    }
  }

  use(request: Request, response: Response, next: NextFunction): void {
    if (this.defaultClient) {
      const ip = request.(headers as any)['x-forwarded-for'];
      const body = request.body;
      const { method, path: url } = request;

      response.on('close', () => {
        const { statusCode, statusMessage } = response;
        const requestLog = `Request: ${method} ${url} from: ${ip}. Request body: ${JSON.stringify(
          body,
        )}`;
        const responseLog = `Response: ${statusCode} ${statusMessage}`;
        this.defaultClient.trackTrace({
          message: `${requestLog} - ${responseLog}}`,
        });
        this.flushLogs();
      });
    }

    next();
  }

  private flushLogs(): void {
    try {
      this.defaultClient.flush();
    } catch (flushError) {
      console.error(
        'An error occurred in AzureLoggerMiddleware::flushLogs:',
        flushError,
      );
    }
  }
}
