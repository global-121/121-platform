import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class JwtService {
  private tokenKey = 'jwt-PA';
  private jwtHelper = new JwtHelperService();

  constructor(private cookieService: CookieService) {}

  public getToken(): string | undefined {
    return this.cookieService.get(this.tokenKey);
  }

  public saveToken(token: string): void {
    this.cookieService.set(this.tokenKey, token);
  }

  public destroyToken(): void {
    this.cookieService.delete(this.tokenKey);
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
