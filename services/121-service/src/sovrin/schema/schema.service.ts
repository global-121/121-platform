import { SchemaEntity } from './schema.entity';
import { Injectable, HttpService, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { API } from '../../config';

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

    const randomNumber = Math.floor(Math.random() * 1000) + 1;
    const randomDecimal = Math.floor(Math.random() * 10) + 1;

    const schemaPost = {
      name: "example",
      version: randomNumber.toString() + '.' + randomDecimal.toString(),
      attributes: attributes,
    };
    const api_string = API.schema;

    console.log(schemaPost, api_string);

    let responseSchema = await this.httpService.post(api_string, schemaPost).toPromise();
    if (!responseSchema.data) {
      const errors = 'Schema not published';
      throw new HttpException({ errors }, 400);
    }
    const schemaId = responseSchema.data.schema_id;
    const credDefPost = {
      name: 'test1',
      schema_id: schemaId,
    };
    console.log(API.credential.definition, credDefPost);
    let responseCreddef = await this.httpService.post(API.credential.definition, credDefPost).toPromise();
    if (!responseCreddef.data) {
      const errors = 'Cred def id not published';
      throw new HttpException({ errors }, 400);
    }
    const credDefId = responseCreddef.data.credential_definition_id;

    const result = {
      schemaId: schemaId,
      credDefId: credDefId,
    };
    return result;
  }
  public async findIdentitySchema(): Promise<Object> {
    const schemas = await this.schemaRepository.find();
    const identitySchema = schemas[0];
    identitySchema.criteriums = JSON.parse(identitySchema.criteriums);
    identitySchema.attributes = JSON.parse(identitySchema.attributes);
    return identitySchema;
  }
}
