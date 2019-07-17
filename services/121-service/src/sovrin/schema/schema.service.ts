import { Injectable } from '@nestjs/common';

@Injectable()
export class SchemaService {
  public async create(program): Promise<any> {
    console.log(program);
    `
    schemaId = tykn.issuerCreateSchema()

    credDefId = tykn.issuerCreateSchema()
    `;

    const result = {
      schemaId: 'id:2034823984',
      credDefId: 'id:90248290834',
    };
    return result;
  }
}
