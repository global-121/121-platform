import { SchemaEntity } from './schema.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SchemaService {
  @InjectRepository(SchemaEntity)
  private readonly schemaRepository: Repository<SchemaEntity>;

  public constructor() {}

  public async create(program): Promise<any> {
    let attributes = [];
    for (let criterium of program.customCriteria) {
      attributes.push(criterium.criterium);
    }
    let schema = {
      name: 'schema-program-' + program.id,
      version: '1.2',
      attributes: attributes,
    };
    `
    schemaId = tykn.issuerCreateSchema(schema)

    credDefId = tykn.issuerCreateCredefId()
    `;

    const result = {
      schemaId: 'id:2034823984',
      credDefId: 'id:90248290834',
    };
    return result;
  }
  public async findIdentitySchema(): Promise<Object> {
    const schemas = await this.schemaRepository.find();
    const identitySchema = schemas[0]
    identitySchema.criteriums = JSON.parse(identitySchema.criteriums)
    identitySchema.attributes = JSON.parse(identitySchema.attributes);
    return identitySchema;
  }
}
