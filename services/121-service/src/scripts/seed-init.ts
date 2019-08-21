import { ProgramService } from './../programs/program/program.service';
import { Injectable } from "@nestjs/common";
import { InterfaceScript } from "./scripts.module";
import { Connection } from "typeorm";
import { UserEntity } from "../user/user.entity";
import { USERCONFIG } from "../secrets";
import { CountryEntity } from "../programs/country/country.entity";
import { ConnectionEntity } from "../sovrin/create-connection/connection.entity";
import { CustomCriterium } from "../programs/program/custom-criterium.entity";
import { ProgramEntity } from "../programs/program/program.entity";
import * as crypto from 'crypto';
import identitySchemaInitial from './identity-schema.json';


@Injectable()
export class SeedInit implements InterfaceScript {
  public constructor(private connection: Connection) { }

  public async run(): Promise<void> {
    await this.connection.dropDatabase();
    await this.connection.synchronize(true);

    // ***** CREATE ADMIN AND FIELDWORKER USER *****

    const userRepository = this.connection.getRepository(UserEntity);
    await userRepository.save([
      {
        username: USERCONFIG.usernameAdmin,
        role: 'admin',
        email: USERCONFIG.emailAdmin,
        countryId: 1,
        password: crypto
          .createHmac('sha256', USERCONFIG.passwordAdmin)
          .digest('hex'),
        status: 'active',
      },
    ]);

    await userRepository.save([
      {
        username: USERCONFIG.usernameFieldworker,
        role: 'aidworker',
        email: USERCONFIG.emailFieldworker,
        countryId: 1,
        password: crypto
          .createHmac('sha256', USERCONFIG.passwordFieldworker)
          .digest('hex'),
        status: 'active',
      },
    ]);

    // ***** CREATE COUNTRIES *****

    const countryRepository = this.connection.getRepository(
      CountryEntity,
    );
    await countryRepository.save([{ country: 'Identity' }]);

    // ***** CREATE A CONNECTION *****

    const connectionRepository = this.connection.getRepository(
      ConnectionEntity,
    );
    await connectionRepository.save([
      {
        did: 'did:sov:1wJPyULfLLnYTEFYzByfUR',
        programsEnrolled: [1],
        programsIncluded: [1],
        programsExcluded: [],
      },
    ]);

    // ***** CREATE A PROGRAM WITH CUSTOM CRITERIA *****

    const customCriteriumRepository = this.connection.getRepository(
      CustomCriterium,
    );
    const programRepository = this.connection.getRepository(ProgramEntity);

    const identitySchemaDump = JSON.stringify(identitySchemaInitial);
    const identitySchema = JSON.parse(identitySchemaDump);

    const author = await userRepository.findOne(1);
    identitySchema.author = author;

    // Remove original custom criteria and add it to a sepperate variable
    const customCriteria = identitySchema.customCriteria;
    identitySchema.customCriteria = [];

    for (let customCriterium of customCriteria) {
      let customReturn = await customCriteriumRepository.save(customCriterium);
      identitySchema.customCriteria.push(customReturn);
    }

    await programRepository.save(identitySchema);

    const programService = new ProgramService();
    programService.publish(1)

    // await this.connection.close();
  }
}

export default SeedInit;
