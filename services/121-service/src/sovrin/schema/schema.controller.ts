import { ApiBearerAuth, ApiUseTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { Controller, Get } from "@nestjs/common";
import { SchemaService } from "./schema.service";
import { CountryEntity } from "../../programs/country/country.entity";


@ApiBearerAuth()
@ApiUseTags('sovrin')
@Controller('sovrin/schema')
export class SchemaController {
  private readonly schemaService: SchemaService;
  public constructor(schemaService: SchemaService) {
    this.schemaService = schemaService;
  }

  @ApiOperation({ title: 'Get identity schema, creddef and criteriums' })
  @ApiResponse({ status: 200, description: 'Got all schemas' })
  @Get('/identity')
  public async findIdentitySchema(): Promise<any> {
    return await this.schemaService.findIdentitySchema();
  }
}
