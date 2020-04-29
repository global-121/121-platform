import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedInit } from './seed-init';
import { SeedPublish } from './seed-publish';

@Injectable()
export class SeedPilot implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedPublish = new SeedPublish();

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // TO DO: seed pilot program and other pilot data here
  }
}

export default SeedPilot;
