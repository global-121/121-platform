import SeedInit from "./seed-init";
import { Injectable } from "@nestjs/common";
import { InterfaceScript } from "./scripts.module";
import { Connection } from "typeorm";

@Injectable()
export class SeedProd implements InterfaceScript {
  public constructor(private connection: Connection) {}

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    await this.connection.close();
  }
}

export default SeedProd;
