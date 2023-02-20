import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { catchError, lastValueFrom, map, of } from 'rxjs';

@Injectable()
export class CustomHttpService {
  public constructor(private readonly httpService: HttpService) {}

  public async get<T>(url: string, authorizationToken?: string): Promise<T> {
    return await lastValueFrom(
      this.httpService
        .get(url, {
          headers: this.createHeaders(authorizationToken),
        })
        .pipe(
          map((response) => {
            return response;
          }),
          catchError((err) => {
            return of(err.response);
          }),
        ),
    );
  }

  public async post<T>(
    url: string,
    payload: any,
    authorizationToken?: string,
  ): Promise<T> {
    return await lastValueFrom(
      this.httpService
        .post(url, payload, {
          headers: this.createHeaders(authorizationToken),
        })
        .pipe(
          map((response) => {
            return response;
          }),
          catchError((err) => {
            return of(err.response);
          }),
        ),
    );
  }

  private createHeaders(authorizationToken?: string): object {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authorizationToken) {
      headers['Authorization'] = `Bearer ${authorizationToken}`;
      // TODO: find a better way to add this header
      headers['Tenant-ID'] = 'REDCROSS';
    }
    return headers;
  }
}
