import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root',
})
export class JwtService {
  private tokenKey = 'logged-in-user-HO';
  private jwtHelper = new JwtHelperService();

  constructor() {}

  public getToken(): string | undefined {
    return sessionStorage[this.tokenKey];
  }

  public saveToken(token: string): void {
    sessionStorage[this.tokenKey] = token;
  }

  public destroyToken(): void {
    sessionStorage.removeItem(this.tokenKey);
  }

  public decodeToken(rawToken: string): any | null {
    if (this.jwtHelper.isTokenExpired(rawToken)) {
      console.log('JwtService: Token is expired.');
      this.destroyToken();
      return null;
    }
    return this.jwtHelper.decodeToken(rawToken);
  }
}
