import { Injectable, NestMiddleware } from '@nestjs/common';
import { TelemetryClient } from 'applicationinsights';

import { NextFunction, Request, Response } from 'express';

@Injectable()
export class AzureLoggerMiddleware implements NestMiddleware {
  defaultClient: TelemetryClient;

  constructor() {
    if (process.env.APPLICATION_INSIGHT_IKEY) {
      this.defaultClient = new TelemetryClient(
        process.env.APPLICATION_INSIGHT_IKEY,
      );
    }
  }

  use(request: Request, response: Response, next: NextFunction): void {
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
      this.defaultClient.flush();
    });

    next();
  }
}
