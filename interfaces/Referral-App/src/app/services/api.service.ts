import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private jwtService: JwtService, private http: HttpClient) {}

  private showSecurity(anonymous: boolean) {
    return anonymous ? '🌐' : '🔐';
  }

  private createHeaders(anonymous: boolean = false): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    if (!anonymous) {
      return headers.set(
        'Authorization',
        `Token ${this.jwtService.getToken()}`,
      );
    }

    return headers;
  }

  get(
    endpoint: string,
    path: string,
    anonymous: boolean = false,
  ): Observable<any> {
    const security = this.showSecurity(anonymous);
    console.log(`ApiService GET: ${security} ${endpoint}${path}`);

    return this.http
      .get(endpoint + path, {
        headers: this.createHeaders(false),
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
        headers: this.createHeaders(anonymous),
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
