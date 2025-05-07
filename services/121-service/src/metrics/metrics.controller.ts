import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Paginate, PaginatedSwaggerDocs, PaginateQuery } from 'nestjs-paginate';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { ExportDetailsQueryParamsDto } from '@121-service/src/metrics/dto/export-details.dto';
import { FileDto } from '@121-service/src/metrics/dto/file.dto';
import { ProgramStats } from '@121-service/src/metrics/dto/program-stats.dto';
import { ExportFileFormat } from '@121-service/src/metrics/enum/export-file-format.enum';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { MetricsService } from '@121-service/src/metrics/metrics.service';
import { PaginateConfigRegistrationViewOnlyFilters } from '@121-service/src/registration/const/filter-operation.const';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';
import { sendXlsxReponse } from '@121-service/src/utils/send-xlsx-response';
import { WrapperType } from '@121-service/src/wrapper.type';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('metrics')
@Controller()
export class MetricsController {
  private readonly metricsService: MetricsService;
  public constructor(metricsService: MetricsService) {
    this.metricsService = metricsService;
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.RegistrationPersonalEXPORT],
  })
  @ApiOperation({
    summary: `[SCOPED] Retrieve data for export. Filters only work for export type ${ExportType.allRegistrations}`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieved data for export',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'exportType',
    required: true,
    type: 'string',
    enum: ExportType,
  })
  @ApiQuery({ name: 'fromDate', required: false, type: 'string' })
  @ApiQuery({ name: 'toDate', required: false, type: 'string' })
  @ApiQuery({ name: 'minPayment', required: false, type: 'number' })
  @ApiQuery({ name: 'maxPayment', required: false, type: 'number' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'boolean',
    description: 'Not used for this endpoint',
    deprecated: true,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'boolean',
    description: 'Not used for this endpoint',
    deprecated: true,
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ExportFileFormat,
    description:
      'Format to return the data in. Options are "json" and "xlsx". Defaults to "json" if not specified.',
  })
  // TODO: REFACTOR: move endpoint to registrations.controller and rename endpoint according to our guidelines
  @Get('programs/:programId/metrics/export-list/:exportType')
  @PaginatedSwaggerDocs(
    RegistrationViewEntity,
    PaginateConfigRegistrationViewOnlyFilters,
  )
  public async getExportList(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('exportType') exportType: WrapperType<ExportType>,
    @Query() queryParams: WrapperType<ExportDetailsQueryParamsDto>,
    @Paginate() paginationQuery: PaginateQuery,
    @Query('format') format = 'json',
    @Req() req: ScopedUserRequest,
    @Res() res: Response,
  ): Promise<Response | void> {
    const userId = RequestHelper.getUserId(req);

    if (
      queryParams.toDate &&
      queryParams.fromDate &&
      queryParams.toDate <= queryParams.fromDate
    ) {
      const errors = 'toDate must be greater than fromDate';
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    if (queryParams['search']) {
      paginationQuery.search = queryParams['search'];
    }
    const result = await this.metricsService.getExportList({
      programId,
      type: exportType,
      userId,
      minPayment: queryParams.minPayment ?? null,
      maxPayment: queryParams.maxPayment ?? null,
      paginationQuery,
    });
    if (!result || !Array.isArray(result.data) || result.data.length === 0) {
      const errors = 'There is currently no data to export';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    if (format === ExportFileFormat.xlsx) {
      return sendXlsxReponse(result.data, result.fileName, res);
    }
    return res.send(result);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Get list of vouchers to cancel, only used by admin',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieved list of vouchers to cancel',
  })
  // TODO: move to intersolve-voucher.controller and rename to /financial-servicer-providers/intersolve-voucher/vouchers?status=toCancel&responseType=csv
  @Get('metrics/to-cancel-vouchers')
  public async getToCancelVouchers(): Promise<FileDto> {
    return await this.metricsService.getToCancelVouchers();
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramMetricsREAD] })
  @ApiOperation({ summary: '[SCOPED] Get program stats summary' })
  @ApiParam({ name: 'programId', required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Program stats summary',
  })
  @Get('programs/:programId/metrics/program-stats-summary')
  public async getProgramStats(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<ProgramStats> {
    return await this.metricsService.getProgramStats(programId);
  }
}
