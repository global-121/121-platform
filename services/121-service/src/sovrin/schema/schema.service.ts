import { SchemaEntity } from './schema.entity';
import {
  Injectable,
  HttpService,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { API, DEBUG } from '../../config';

@Injectable()
export class SchemaService {
  @InjectRepository(SchemaEntity)
  private readonly schemaRepository: Repository<SchemaEntity>;

  public constructor(private readonly httpService: HttpService) {}

  public async create(program): Promise<any> {
    let attributes = [];
    for (let criterium of program.customCriteria) {
      attributes.push(criterium.criterium);
    }

    let version: string;
    // Increment version number based on previous version
    // Version set here is overwritten below, but logic is left in for later use
    if (!DEBUG) {
      if (program.schemaId) {
        const n = program.schemaId.lastIndexOf(':');
        const lastVersion = program.schemaId.substring(n + 1);
        const lastVersionNr = Number(lastVersion.slice(0, -2));
        const versionNr = lastVersionNr + 1;
        version = versionNr.toString() + '.0';
      } else {
        version = '1.0';
      }
    }

    const randomNumber = Math.floor(Math.random() * 1000) + 1;
    const randomDecimal = Math.floor(Math.random() * 10) + 1;
    version = randomNumber.toString() + '.' + randomDecimal.toString();

    const schemaPost = {
      name: 'program_' + program.id.toString(),
      version: version,
      attributes: attributes,
    };
    const apiString = API.schema;

    let responseSchema = await this.httpService
      .post(apiString, schemaPost)
      .toPromise();
    if (!responseSchema.data) {
      const errors = 'Schema not published';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    const schemaId = responseSchema.data.schema_id;
    const credDefPost = {
      name: 'test1',
      /* eslint-disable-next-line @typescript-eslint/camelcase */
      schema_id: schemaId,
    };
    let responseCreddef = await this.httpService
      .post(API.credential.definition, credDefPost)
      .toPromise();
    if (!responseCreddef.data) {
      const errors = 'Cred def id not published';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    const credDefId = responseCreddef.data.credential_definition_id;

    const result = {
      schemaId: schemaId,
      credDefId: credDefId,
    };
    return result;
  }
}
