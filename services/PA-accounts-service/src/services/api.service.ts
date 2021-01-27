import { tap } from 'rxjs/operators';
import { Injectable, HttpService } from '@nestjs/common';

@Injectable()
export class ApiService {
  public constructor(private readonly httpService: HttpService) {}
  public async get(endpoint: string, path: string): Promise<any> {
    const endcodedURI = encodeURI(endpoint + path);
    return this.httpService
      .get(endcodedURI)
      .pipe(tap())
      .toPromise();
  }

  public async post(
    endpoint: string,
    path: string,
    body: object,
  ): Promise<any> {
    const endcodedURI = encodeURI(endpoint + path);
    return this.httpService
      .post(endcodedURI, body)
      .pipe(tap())
      .toPromise();
  }
}
