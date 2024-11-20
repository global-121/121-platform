import { Injectable, NestMiddleware } from '@nestjs/common';
import { TelemetryClient } from 'applicationinsights';
import { NextFunction, Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import appInsights = require('applicationinsights');

@Injectable()
export class AzureLoggerMiddleware implements NestMiddleware {
  defaultClient: TelemetryClient;

  constructor() {
    if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
      this.defaultClient = appInsights.defaultClient;
    }
  }

  use(request: Request, response: Response, next: NextFunction): void {
    if (this.defaultClient) {
      const ip = request.headers['x-forwarded-for'];
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
    this.defaultClient
      .flush()
      .then(() => {
        return;
      })
      .catch((flushError) => {
        console.error('An error occured in logError:', flushError);
      });
  }
}
