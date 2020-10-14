import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class JwtService {
  private tokenKey = 'jwt-PA';

  public getToken(): string | undefined {
    return window.sessionStorage[this.tokenKey];
  }

  public saveToken(token: string): void {
    window.sessionStorage[this.tokenKey] = token;
  }

  public destroyToken(): void {
    window.sessionStorage.removeItem(this.tokenKey);
  }
}
