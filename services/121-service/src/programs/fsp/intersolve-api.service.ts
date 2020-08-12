import { Injectable } from '@nestjs/common';
import { INTERSOLVE } from '../../secrets';
import { ApiService } from './api.service';

@Injectable()
export class IntersolveApiService {
  private headerRequest = {
    accept: 'application/json',
    authorization: `Basic ${INTERSOLVE.authToken}`,
  };

  public constructor(private readonly apiService: ApiService) {}

  public async sendPayment(url: string, payload): Promise<any> {
    return this.apiService.post(url, this.headerRequest, payload);
  }
}
