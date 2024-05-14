import { Injectable } from '@nestjs/common';

@Injectable()
export class IntersolveVisaMockService {
  public createCustomer(): any {
    console.log('IntersolveVisaMockService.createCustomer()');
  }
}
