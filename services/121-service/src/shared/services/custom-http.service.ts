import { CookieNames } from '@121-service/src/shared/enum/cookie.enums';
import { maskValueKeepStart } from '@121-service/src/utils/mask-value.helper';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { TelemetryClient } from 'applicationinsights';
import { isPlainObject } from 'lodash';
import { catchError, lastValueFrom, map, of } from 'rxjs';

export class Header {
  public name: string;
  public value?: string;
}

class Request {
  public headers?: Header[];
  public url: string;
  public payload: any;
}

class Response {
  public status: number;
  public statusText: string;
  public data: any;
}

@Injectable()
export class CustomHttpService {
  defaultClient: TelemetryClient;

  public constructor(private readonly httpService: HttpService) {
    if (process.env.APPLICATION_INSIGHT_IKEY) {
      this.defaultClient = new TelemetryClient(
        process.env.APPLICATION_INSIGHT_IKEY,
      );
    }
  }

  public async get<T>(url: string, headers?: Header[]): Promise<T> {
    return await lastValueFrom(
      this.httpService
        .get(url, {
          headers: this.createHeaders(headers),
        })
        .pipe(
          map((response) => {
            this.logMessageRequest({ headers, url, payload: null }, response);
            return response;
          }),
          catchError((err) => {
            const errorResponse = err.response || this.setNoResponseError(err);
            this.logErrorRequest(
              { headers, url, payload: null },
              errorResponse,
            );
            return of(errorResponse);
          }),
        ),
    );
  }

  public async post<T>(
    url: string,
    payload: any,
    headers?: Header[],
  ): Promise<T> {
    return await lastValueFrom(
      this.httpService
        .post(url, payload, {
          headers: this.createHeaders(headers),
        })
        .pipe(
          map((response) => {
            this.logMessageRequest(
              { headers, url, payload: payload },
              response,
            );
            return response;
          }),
          catchError((err) => {
            const errorResponse = err.response || this.setNoResponseError(err);
            this.logErrorRequest(
              { headers, url, payload: payload },
              errorResponse,
            );
            return of(errorResponse);
          }),
        ),
    );
  }

  public async put<T>(
    url: string,
    payload: any,
    headers?: Header[],
  ): Promise<T> {
    return await lastValueFrom(
      this.httpService
        .put(url, payload, {
          headers: this.createHeaders(headers),
        })
        .pipe(
          map((response) => {
            this.logMessageRequest(
              { headers, url, payload: payload },
              response,
            );
            return response;
          }),
          catchError((err) => {
            const errorResponse = err.response || this.setNoResponseError(err);
            this.logErrorRequest(
              { headers, url, payload: payload },
              errorResponse,
            );
            return of(errorResponse);
          }),
        ),
    );
  }

  public async patch<T>(
    url: string,
    payload: any,
    headers?: Header[],
  ): Promise<T> {
    return await lastValueFrom(
      this.httpService
        .patch(url, payload, {
          headers: this.createHeaders(headers),
        })
        .pipe(
          map((response) => {
            this.logMessageRequest(
              { headers, url, payload: payload },
              response,
            );
            return response;
          }),
          catchError((err) => {
            const errorResponse = err.response || this.setNoResponseError(err);
            this.logErrorRequest(
              { headers, url, payload: payload },
              errorResponse,
            );
            return of(errorResponse);
          }),
        ),
    );
  }

  private createHeaders(headers?: Header[]): object {
    const returnHeaders = {
      'Content-Type': 'application/json',
    };
    if (headers) {
      for (const header of headers) {
        returnHeaders[header.name] = header.value;
      }
    }
    return returnHeaders;
  }

  private setNoResponseError(err: any): Response {
    return {
      status: err.errno,
      statusText: err.code,
      data: err.cause,
    };
  }

  public logMessageRequest(
    request: Partial<Request>,
    response: Partial<Response>,
  ): void {
    if (this.defaultClient) {
      try {
        const requestPayload = JSON.stringify(
          this.redactSensitiveDataProperties(request.payload),
        );
        const responseBody = JSON.stringify(
          this.redactSensitiveDataProperties(response.data),
        );

        const requestContent = `URL: ${request.url}. Payload: ${requestPayload}`;
        const responseContent = `Response: ${response.status} ${response.statusText} - Body: ${responseBody}`;

        // NOTE: trim to 16,000 characters each for request and response, because of limit in application insights
        const message = `${requestContent.substring(0, 16_000)} - ${responseContent.substring(0, 16_000)}`;

        this.defaultClient.trackTrace({
          message,
          properties: {
            externalUrl: request.url,
          },
        });
        this.defaultClient.flush();
      } catch (error) {
        console.log('An error occured in logMessageRequest: ', error);
      }
    }
  }

  public logErrorRequest(
    request: Partial<Request>,
    error: Partial<Response>,
  ): void {
    if (this.defaultClient) {
      try {
        const requestPayload = this.stringify(
          this.redactSensitiveDataProperties(request.payload),
        );
        const responseBody = this.stringify(
          this.redactSensitiveDataProperties(error.data),
        );

        const requestContent = `URL: ${request.url}. Payload: ${requestPayload}`;
        const responseContent = `Response error: ${error.status} ${error.statusText} - Body: ${responseBody}`;

        // NOTE: trim to 16,000 characters each for request and response, because of limit in application insights
        const message = `${requestContent.substring(0, 16_000)} - ${responseContent.substring(0, 16_000)}}`;

        this.defaultClient.trackException({
          exception: new Error(message),
          properties: {
            externalUrl: request.url,
          },
        });
        this.defaultClient.flush();
      } catch (error) {
        console.log('An error occured in logErrorRequest: ', error);
      }
    }
  }

  private stringify(obj: object): string {
    let cache: object[] | null = [];
    const str = JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache?.indexOf(value) !== -1) {
          // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.push(value);
      }
      return value;
    });
    cache = null; // reset the cache
    return str;
  }

  /**
   * Overwrite and/or mask sensitive data (only for specific properties, 1-level deep)
   * @param data - Any key-value object
   * @returns - A copy of the input-object with some specific data overwritten/redacted
   */
  private redactSensitiveDataProperties(data: any) {
    if (!isPlainObject(data)) {
      return data;
    }

    const sensitiveProperties = [
      'password',
      CookieNames.general,
      CookieNames.portal,
    ];

    const redactedData = { ...data }; // Shallow copy to avoid mutating the original object

    for (const property of sensitiveProperties) {
      if (redactedData[property]) {
        redactedData[property] = '**REDACTED**';
      }
    }

    // Explicitly mask the username/email:
    if (redactedData.username) {
      redactedData.username = maskValueKeepStart(redactedData.username, 3);
    }

    return redactedData;
  }
}
