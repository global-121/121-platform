import { Injectable } from '@nestjs/common';

@Injectable()
export class CreateConnectionService {
  public async create(message): Promise<any> {
    console.log(message);
    return true;
  }
}
