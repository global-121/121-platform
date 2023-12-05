import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { TelemetryClient } from 'applicationinsights';
import { catchError, lastValueFrom, map, of } from 'rxjs';

export class Header {
  public name: string;
  public value: string;
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

  public logMessageRequest(request: Request, response: Response): void {
    if (this.defaultClient) {
      try {
        const requestContent = `URL: ${request.url}. Payload: ${JSON.stringify(
          request.payload,
        )}`;
        const responseContent = `Response: ${response.status} ${
          response.statusText
        } - Body: ${JSON.stringify(response.data)}`;
        // NOTE: trim to 16,000 characters each for request and response, because of limit in application insights
        this.defaultClient.trackTrace({
          message: `${requestContent.substring(
            0,
            16000,
          )} - ${responseContent.substring(0, 16000)}`,
          properties: { externalUrl: request.url },
        });
        this.defaultClient.flush();
      } catch (error) {
        console.log('An error occured in logMessageRequest: ', error);
      }
    }
  }

  public logErrorRequest(request: Request, error: Response): void {
    if (this.defaultClient) {
      try {
        const requestContent = `URL: ${request.url}. Payload: ${this.stringify(
          request.payload,
        )}`;
        const responseContent = `Response error: ${error.status} ${
          error.statusText
        } - Body: ${this.stringify(error.data)}`;
        this.defaultClient.trackException({
          // NOTE: trim to 16,000 characters each for request and response, because of limit in application insights
          exception: new Error(
            `${requestContent.substring(
              0,
              16000,
            )} - ${responseContent.substring(0, 16000)}}`,
          ),
          properties: { externalUrl: request.url },
        });
        this.defaultClient.flush();
      } catch (error) {
        console.log('An error occured in logErrorRequest: ', error);
      }
    }
  }

  public stringify(obj): string {
    let cache = [];
    const str = JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
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
}
