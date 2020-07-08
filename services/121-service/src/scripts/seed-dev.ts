import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InterfaceScript } from './scripts.module';

@Injectable()
export class SeedDev implements InterfaceScript {
  public constructor(private connection: Connection) {}

  public async run(): Promise<void> {
    // *****  ADD DATA YOU WANT TO SEED*****

    await this.connection.close();
  }
}

export default SeedDev;
