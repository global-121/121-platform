import SeedInit from './seed-init';
import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';

@Injectable()
export class SeedProd implements InterfaceScript {
  public constructor(
    private connection: Connection,
  ) {}

  private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

  }
}

export default SeedProd;
