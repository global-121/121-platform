import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { TelemetryClient } from 'applicationinsights';
import { catchError, lastValueFrom, map, of } from 'rxjs';

class Header {
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
            this.logErrorRequest({ headers, url, payload: null }, err.response);
            return of(err.response);
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
            this.logErrorRequest(
              { headers, url, payload: payload },
              err.response,
            );
            return of(err.response);
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
            this.logErrorRequest(
              { headers, url, payload: payload },
              err.response,
            );
            return of(err.response);
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

  public logMessageRequest(request: Request, response: Response): void {
    if (this.defaultClient) {
      try {
        const requestContent = `URL: ${request.url}. Payload: ${JSON.stringify(
          request.payload,
        )}`;
        const responseContent = `Response: ${response.status} ${
          response.statusText
        } - Body: ${JSON.stringify(response.data)}`;
        this.defaultClient.trackTrace({
          message: `${requestContent.substring(
            0,
            16000,
          )} - ${responseContent.substring(0, 16000)}`,
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
        const requestContent = `URL: ${request.url}. Payload: ${JSON.stringify(
          request.payload,
        )}`;
        const responseContent = `Response error: ${error.status} ${
          error.statusText
        } - Body: ${JSON.stringify(error.data)}`;
        this.defaultClient.trackException({
          exception: new Error(
            `${requestContent.substring(
              0,
              16000,
            )} - ${responseContent.substring(0, 16000)}}`,
          ),
        });
        this.defaultClient.flush();
      } catch (error) {
        console.log('An error occured in logErrorRequest: ', error);
      }
    }
  }
}
