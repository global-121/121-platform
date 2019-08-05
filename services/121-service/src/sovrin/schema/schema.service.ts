import { Injectable } from '@nestjs/common';

@Injectable()
export class SchemaService {
  public async create(program): Promise<any> {
    // console.log(program.customCriteria);
    
    let attributes = [];
    for (let criterium of program.customCriteria){
      attributes.push(criterium.criterium);
    }
    let schema = {
      name: 'schema-program-'+program.id,
      version: '1.2',
      attributes: attributes,
    };
    
    `
    schemaId = tykn.issuerCreateSchema(schema)

    credDefId = tykn.issuerCreateSchema()
    `;

    const result = {
      schemaId: 'id:2034823984',
      credDefId: 'id:90248290834',
    };
    return result;
  }
}
