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

  private setHeaders(): HttpHeaders {
    const headersConfig = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Token ${this.jwtService.getToken()}`,
    };

    return new HttpHeaders(headersConfig);
  }

  get(
    endpoint: string,
    path: string
  ): Observable<any> {
    console.log(`ApiService GET: ${endpoint}${path}`);

    return this.http.get(
      endpoint + path,
      {
        headers: this.setHeaders(),
      }
    );
  }
}
