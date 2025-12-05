import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { defaultClient, TelemetryClient } from 'applicationinsights';
import { isPlainObject } from 'lodash';
import fs from 'node:fs';
import https from 'node:https';
import { catchError, lastValueFrom, map, of } from 'rxjs';

import { CookieNames } from '@121-service/src/shared/enum/cookie.enums';
import { maskValueKeepStart } from '@121-service/src/utils/mask-value.helper';

class Request {
  public headers?: Headers;
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
    this.defaultClient = defaultClient;
  }

  public async get<T>(url: string, headers?: Headers): Promise<T> {
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
    headers?: Headers,
    httpsAgent?: https.Agent,
  ): Promise<T> {
    return await lastValueFrom(
      this.httpService
        .post(url, payload, {
          headers: this.createHeaders(headers),
          httpsAgent,
        })
        .pipe(
          map((response) => {
            this.logMessageRequest({ headers, url, payload }, response);
            return response;
          }),
          catchError((err) => {
            const errorResponse = err.response || this.setNoResponseError(err);
            this.logErrorRequest({ headers, url, payload }, errorResponse);
            return of(errorResponse);
          }),
        ),
    );
  }

  public async put<T>(
    url: string,
    payload: any,
    headers?: Headers,
  ): Promise<T> {
    return await lastValueFrom(
      this.httpService
        .put(url, payload, {
          headers: this.createHeaders(headers),
        })
        .pipe(
          map((response) => {
            this.logMessageRequest({ headers, url, payload }, response);
            return response;
          }),
          catchError((err) => {
            const errorResponse = err.response || this.setNoResponseError(err);
            this.logErrorRequest({ headers, url, payload }, errorResponse);
            return of(errorResponse);
          }),
        ),
    );
  }

  public async patch<T>(
    url: string,
    payload: any,
    headers?: Headers,
  ): Promise<T> {
    return await lastValueFrom(
      this.httpService
        .patch(url, payload, {
          headers: this.createHeaders(headers),
        })
        .pipe(
          map((response) => {
            this.logMessageRequest({ headers, url, payload }, response);
            return response;
          }),
          catchError((err) => {
            const errorResponse = err.response || this.setNoResponseError(err);
            this.logErrorRequest({ headers, url, payload }, errorResponse);
            return of(errorResponse);
          }),
        ),
    );
  }

  public async delete<T>(url: string, headers?: Headers): Promise<T> {
    return await lastValueFrom(
      this.httpService
        .delete(url, {
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

  public async request<T>({
    method,
    url,
    payload,
    headers,
    httpsAgent,
  }: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    payload?: unknown;
    headers?: Headers;
    httpsAgent?: https.Agent;
  }): Promise<T> {
    const params: AxiosRequestConfig = {
      method,
      url,
      headers: this.createHeaders(headers),
    };
    if (payload) {
      params.data = payload; // If payload is null on a GET, axios will throw an error
    }
    if (httpsAgent) {
      params.httpsAgent = httpsAgent;
    }
    return await lastValueFrom(
      this.httpService
        .request<T>(params) //
        .pipe(
          map((response) => {
            this.logMessageRequest({ headers, url, payload }, response);
            return response;
          }),
          catchError((err) => {
            const errorResponse = err.response || this.setNoResponseError(err);
            this.logErrorRequest({ headers, url, payload }, errorResponse);
            return of(errorResponse);
          }),
        ),
    );
  }

  private createHeaders(headers?: Headers): Record<string, string> {
    const returnHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (headers) {
      headers.forEach((key, value) => {
        returnHeaders[key] = value;
      });
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
        this.flushLogs('logMessageRequest');
      } catch (error) {
        console.log('An error occurred in logMessageRequest: ', error);
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
        this.flushLogs('logErrorRequest');
      } catch (error) {
        console.log('An error occurred in logErrorRequest: ', error);
      }
    }
  }

  /**
   * Create an HTTPS agent with a certificate.
   * @param certificatePath The path to the certificate.
   * @param password The passphrase for the certificate.
   * @returns The HTTPS agent.
   */
  public createHttpsAgentWithCertificate(
    certificatePath: string,
    password?: string,
  ): https.Agent {
    return new https.Agent({
      pfx: fs.readFileSync(certificatePath),
      passphrase: password,
    });
  }

  private flushLogs(methodName: string): void {
    try {
      this.defaultClient.flush();
    } catch (flushError) {
      console.error(
        `An error occurred in CustomHttpService::${methodName}:`,
        flushError,
      );
    }
  }

  private stringify(obj: object): string {
    let cache: object[] | null = [];
    const str = JSON.stringify(obj, (_key, value) => {
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
