import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(
    private jwtService: JwtService,
    private http: HttpClient,
  ) { }

  private createHeaders(anonymous: boolean = false): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    if (!anonymous) {
      return headers.set('Authorization', `Token ${this.jwtService.getToken()}`);
    }

    return headers;
  }

  get(
    endpoint: string,
    path: string
  ): Observable<any> {
    console.log(`ApiService GET: ${endpoint}${path}`);

    return this.http.get(
      endpoint + path,
      {
        headers: this.createHeaders(true),
      }
    );
  }

  post(
    endpoint: string,
    path: string,
    body: object,
    anonymous: boolean = false
  ): Observable<any> {
    console.log(`ApiService POST: ${endpoint}${path}`, body, `Anonymous? ${anonymous}`);

    return this.http.post(
      endpoint + path,
      body,
      {
        headers: this.createHeaders(anonymous),
      }
    );
  }
}
