import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { TelemetryClient } from 'applicationinsights';
import { catchError, lastValueFrom, map, of } from 'rxjs';

class Header {
  public name: string;
  public value: string;
}

class Request {
  public headers: Header[];
  public url: string;
  public payload: any;
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
            this._logMessage({ headers, url, payload: null }, response);
            return response;
          }),
          catchError((err) => {
            this._logError({ headers, url, payload: null }, err.response);
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
            this._logMessage({ headers, url, payload: payload }, response);
            return response;
          }),
          catchError((err) => {
            this._logError({ headers, url, payload: payload }, err.response);
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

  private _logMessage(request: Request, response: AxiosResponse): void {
    if (this.defaultClient) {
      const requestContent = `URL: ${request.url}. Payload: ${JSON.stringify(
        request.payload,
      )}`;
      const responseContent = `Response: ${response.status} ${
        response.statusText
      } - Body: ${JSON.stringify(response.data)}`;
      this.defaultClient.trackTrace({
        message: `${requestContent} - ${responseContent}`,
      });
      this.defaultClient.flush();
    }
  }

  private _logError(request: Request, error: AxiosResponse): void {
    if (this.defaultClient) {
      const requestContent = `URL: ${request.url}. Payload: ${JSON.stringify(
        request.payload,
      )}`;
      const responseContent = `Response error: ${error.status} ${
        error.statusText
      } - Body: ${JSON.stringify(error.data)}`;
      this.defaultClient.trackException({
        exception: new Error(`${requestContent} - ${responseContent}}`),
      });
      this.defaultClient.flush();
    }
  }
}
