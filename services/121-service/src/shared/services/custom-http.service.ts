import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import {
  defaultClient,
  KnownSeverityLevel,
  TelemetryClient,
} from 'applicationinsights';
import { AxiosRequestConfig } from 'axios';
import { cloneDeepWith, isPlainObject } from 'lodash';
import fs from 'node:fs';
import https, { AgentOptions } from 'node:https';
import { SecureContextOptions } from 'node:tls';
import { catchError, lastValueFrom, map, of } from 'rxjs';

import { SensitivePiiValue } from '@121-service/src/shared/consts/sensitive-pii-value.class';

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
  defaultClient: TelemetryClient | undefined;

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

  public async getStream<T>(url: string, headers?: Headers): Promise<T> {
    return await lastValueFrom(
      this.httpService
        .get(url, {
          headers: this.createHeaders(headers),
          responseType: 'stream',
        })
        .pipe(
          map((response) => {
            this.logMessageRequest(
              { headers, url, payload: null },
              {
                status: response.status,
                statusText: response.statusText,
                data: '[stream]',
              },
            );
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
    const unwrappedPayload = this.unwrapSensitivePiiValues(payload);

    return await lastValueFrom(
      this.httpService
        .post(url, unwrappedPayload, {
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

  private unwrapSensitivePiiValues<T>(data: T): T {
    if (!isPlainObject(data) && !Array.isArray(data)) {
      return data;
    }

    return cloneDeepWith(data, (value: unknown) => {
      if (value instanceof SensitivePiiValue) {
        return value.value;
      }
      return undefined;
    });
  }

  public async put<T>(
    url: string,
    payload: any,
    headers?: Headers,
  ): Promise<T> {
    const unwrappedPayload = this.unwrapSensitivePiiValues(payload);

    return await lastValueFrom(
      this.httpService
        .put(url, unwrappedPayload, {
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
    const unwrappedPayload = this.unwrapSensitivePiiValues(payload);

    return await lastValueFrom(
      this.httpService
        .patch(url, unwrappedPayload, {
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
      params.data = this.unwrapSensitivePiiValues(payload); // If payload is null on a GET, axios will throw an error
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
      Object.assign(returnHeaders, Object.fromEntries(headers));
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
        this.defaultClient.trackTrace({
          message: 'External HTTP request completed',
          severity: KnownSeverityLevel.Information,
          properties: this.getRequestTelemetryProperties({ request, response }),
        });
      } catch (error) {
        console.error('An error occurred in logMessageRequest: ', error);
      }
    }
  }

  public logErrorRequest(
    request: Partial<Request>,
    error: Partial<Response>,
  ): void {
    if (this.defaultClient) {
      try {
        this.defaultClient.trackTrace({
          message: 'External HTTP request failed',
          severity: KnownSeverityLevel.Error,
          properties: this.getRequestTelemetryProperties({
            request,
            response: error,
          }),
        });
      } catch (error) {
        console.error('An error occurred in logErrorRequest: ', error);
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
    let certificate: SecureContextOptions['pfx'];
    try {
      certificate = fs.readFileSync(certificatePath);
    } catch (error) {
      throw new Error(`Certificate not found at: ${certificatePath}`, {
        cause: error,
      });
    }

    return new https.Agent({
      pfx: certificate,
      passphrase: password,
    });
  }

  /**
   * Create an HTTPS agent that accepts weak certificates (e.g., 1024-bit RSA keys).
   *
   * **Why needed:** Node.js 24+ rejects certificates with RSA keys < 2048 bits.
   * Some external services (e.g., CBE) still use legacy 1024-bit certificates that cannot be upgraded.
   *
   * Should only be used for VPN-protected connections where the certificate
   * still provides identity verification, and the VPN ensures encrypted transport layer security.
   *
   * @param certificatePath The path to the certificate.
   * @param extraOpts Any extra options to pass to the HTTPS agent.
   * @returns The HTTPS agent configured to accept weak keys.
   */
  public createHttpsAgentWithWeakSelfSignedCertificateOnly(
    certificatePath: string,
    extraOpts?: AgentOptions,
  ): https.Agent {
    let certificate: SecureContextOptions['ca'];
    try {
      certificate = fs.readFileSync(certificatePath);
    } catch (error) {
      throw new Error(`Certificate not found at: ${certificatePath}`, {
        cause: error,
      });
    }

    return new https.Agent({
      ca: certificate,
      // Lower OpenSSL security level to accept weak keys (1024-bit RSA)
      ciphers: 'DEFAULT:@SECLEVEL=0',
      ...extraOpts,
    });
  }

  private getRequestTelemetryProperties({
    request,
    response,
  }: {
    request: Partial<Request>;
    response: Partial<Response>;
  }): Record<string, string> {
    const properties: Record<string, string> = {};
    if (request.url) {
      if (URL.canParse(request.url)) {
        properties.externalUrl = new URL(request.url).origin;
      } else {
        console.warn('Omitted an invalid external request URL from telemetry');
      }
    }
    if (response.status !== undefined) {
      properties.statusCode = String(response.status);
    }
    return properties;
  }
}
