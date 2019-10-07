import { ApiBearerAuth, ApiUseTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { Controller, Get } from "@nestjs/common";
import { SchemaService } from "./schema.service";
import { CountryEntity } from "../../programs/country/country.entity";


@ApiBearerAuth()
@ApiUseTags('sovrin')
@Controller('sovrin/schema')
export class SchemaController {}
