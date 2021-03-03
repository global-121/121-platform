import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root',
})
export class JwtService {
  private tokenKey = 'jwt-HO';
  private jwtHelper = new JwtHelperService();

  public getToken(): string | undefined {
    return window.sessionStorage[this.tokenKey];
  }

  public saveToken(token: string): void {
    window.sessionStorage[this.tokenKey] = token;
  }

  public destroyToken(): void {
    window.sessionStorage.removeItem(this.tokenKey);
  }

  public decodeToken(rawToken: string): any {
    if (this.jwtHelper.isTokenExpired(rawToken)) {
      console.log('JwtService: Token is expired.');
      this.destroyToken();
      return null;
    }
    return this.jwtHelper.decodeToken(rawToken);
  }
}
