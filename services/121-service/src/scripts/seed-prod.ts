import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { InterfaceScript } from './scripts.module';
import SeedInit from './seed-init';

@Injectable()
export class SeedProd implements InterfaceScript {
  public constructor(private dataSource: DataSource) {}

  public async run(): Promise<void> {
    console.log('----------------Running seed production------------------');
    const userRepository = this.dataSource.getRepository(UserEntity);
    if ((await userRepository.find({ take: 1 })).length === 0) {
      const seedInit = await new SeedInit(this.dataSource);
      await seedInit.run();
    } else {
      console.log(
        '----------------NOTE: Users were found in database already, so init-script is not run.------------------',
      );
    }
  }
}

export default SeedProd;
