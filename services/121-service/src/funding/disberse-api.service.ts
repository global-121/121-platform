import { tap } from 'rxjs/operators';
import { Injectable, HttpService } from '@nestjs/common';
import { API } from '../config';

@Injectable()
export class DisberseApiService {
  public constructor(private readonly httpService: HttpService) {}

  public async balance(disberseProjectId): Promise<any> {
    return this.get(disberseProjectId + '/balance');
  }

  public async get(path: string): Promise<any> {
    const endcodedURI = encodeURI(API.disberse.url +  path)
    console.log(API.disberse.key)
    return Promise.resolve(12345); // This needs to be removed after we get the API key
    return this.httpService
      .get(endcodedURI
      ).pipe(
        tap(response => console.log(`ApiService GET: ${API.disberse.url}${path}`, `\nResponse:`, response)),
      )
      .toPromise();
  }
}
