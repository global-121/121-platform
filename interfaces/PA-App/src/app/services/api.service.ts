import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import InterfaceName from '../enums/interface-names.enum';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  private showSecurity(anonymous: boolean) {
    return anonymous ? '🌐' : '🔐';
  }

  private createHeaders(): HttpHeaders {
    return new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-121-Interface': InterfaceName.paApp,
    });
  }

  get(
    endpoint: string,
    path: string,
    anonymous: boolean = true,
  ): Observable<any> {
    const security = this.showSecurity(anonymous);
    console.log(`ApiService GET: ${security} ${endpoint}${path}`);

    return this.http
      .get(endpoint + path, {
        headers: this.createHeaders(),
        withCredentials: true,
      })
      .pipe(
        tap((response) =>
          console.log(
            `ApiService GET: ${security} ${endpoint}${path}`,
            `\nResponse:`,
            response,
          ),
        ),
      );
  }

  post(
    endpoint: string,
    path: string,
    body: object,
    anonymous: boolean = false,
  ): Observable<any> {
    const security = this.showSecurity(anonymous);
    console.log(`ApiService POST: ${security} ${endpoint}${path}`, body);

    return this.http
      .post(endpoint + path, body, {
        headers: this.createHeaders(),
        withCredentials: true,
      })
      .pipe(
        tap((response) =>
          console.log(
            `ApiService POST: ${security} ${endpoint}${path}:`,
            body,
            `\nResponse:`,
            response,
          ),
        ),
      );
  }
}
