import {
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import {
  ActivityInfoMockService,
  MockFormSchema,
} from '@mock-service/src/activityinfo/activityinfo.mock.service';

@ApiTags('activityinfo')
@Controller('activityinfo/resources/form')
export class ActivityInfoMockController {
  public constructor(
    private readonly activityInfoMockService: ActivityInfoMockService,
  ) {}

  @ApiOperation({
    description:
      'Returns the schema of a mock ActivityInfo form. Matches the ActivityInfo API endpoint /resources/form/{formId}/schema',
  })
  @ApiParam({ name: 'formId', required: true, type: 'string' })
  @Get(':formId/schema')
  public getFormSchema(
    @Param('formId') formId: string,
    @Headers('authorization') authorizationHeader?: string,
  ): MockFormSchema {
    this.assertBearerTokenPresent(authorizationHeader);

    return this.activityInfoMockService.getFormSchema(formId);
  }

  @ApiOperation({
    description:
      'Returns the records of a mock ActivityInfo form. Matches the ActivityInfo API endpoint /resources/form/{formId}/query, where every query parameter defines one output column.',
  })
  @ApiParam({ name: 'formId', required: true, type: 'string' })
  @Get(':formId/query')
  public getRecords(
    @Param('formId') formId: string,
    @Query() query: Record<string, string>,
    @Headers('authorization') authorizationHeader?: string,
  ): Record<string, string | number | null>[] {
    this.assertBearerTokenPresent(authorizationHeader);

    return this.activityInfoMockService.getRecords({
      formId,
      columnAliasesToFormulas: query,
    });
  }

  private assertBearerTokenPresent(authorizationHeader?: string): void {
    if (authorizationHeader?.startsWith('Bearer ')) {
      return;
    }

    throw new HttpException(
      {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'The request must be authenticated',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
