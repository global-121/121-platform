import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class JwtService {
  private tokenKey = 'jwt';

  getToken(): string {
    console.log('JWT Service: getToken');

    return window.sessionStorage[this.tokenKey];
  }

  saveToken(token: string) {
    console.log('JWT Service: saveToken');

    window.sessionStorage[this.tokenKey] = token;
  }

  destroyToken() {
    console.log('JWT Service: destroyToken');

    window.sessionStorage.removeItem(this.tokenKey);
  }
}
