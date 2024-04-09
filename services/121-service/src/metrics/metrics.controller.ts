import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
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
import { Paginate, PaginatedSwaggerDocs, PaginateQuery } from 'nestjs-paginate';
import { AuthenticatedUser } from '../guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '../guards/authenticated-user.guard';
import { PaginateConfigRegistrationViewOnlyFilters } from '../registration/const/filter-operation.const';
import { RegistrationViewEntity } from '../registration/registration-view.entity';
import { PermissionEnum } from '../user/enum/permission.enum';
import { sendXlsxReponse } from '../utils/send-xlsx-response';
import {
  ExportDetailsQueryParamsDto,
  ExportType,
} from './dto/export-details.dto';
import { ProgramStats } from './dto/program-stats.dto';
import { RegistrationStatusStats } from './dto/registrationstatus-stats.dto';
import { ExportFileFormat } from './enum/export-file-format.enum';
import { MetricsService } from './metrics.service';

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
    summary: `[SCOPED] Retrieve data for export. Filters only work for export type ${ExportType.allPeopleAffected}`,
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
    @Param('programId') programId: number,
    @Param('exportType') exportType: ExportType,
    @Query() queryParams: ExportDetailsQueryParamsDto,
    @Paginate() paginationQuery: PaginateQuery,
    @Query('format') format = 'json',
    @Req() req,
    @Res() res,
  ): Promise<any> {
    const userId = req.user.id;
    if (
      queryParams.toDate &&
      queryParams.fromDate &&
      queryParams.toDate <= queryParams.fromDate
    ) {
      const errors = 'toDate must be greater than fromDate';
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    const result = await this.metricsService.getExportList(
      Number(programId),
      exportType as ExportType,
      userId,
      queryParams.minPayment,
      queryParams.maxPayment,
      paginationQuery,
    );
    if (result.data.length === 0) {
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
  public async getToCancelVouchers(): Promise<any> {
    return await this.metricsService.getToCancelVouchers();
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramMetricsREAD] })
  @ApiOperation({
    summary: '[SCOPED] Get payments with state sums by program-id',
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Payment state sums to create bar charts to show the number of new vs existing PAs per installmet - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('programs/:programId/metrics/payment-state-sums')
  public async getPaymentsWithStateSums(@Param() params): Promise<any> {
    return await this.metricsService.getPaymentsWithStateSums(
      Number(params.programId),
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramMetricsREAD] })
  @ApiOperation({ summary: '[SCOPED] Get program stats summary' })
  @ApiParam({ name: 'programId', required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Program stats summary',
  })
  @Get('programs/:programId/metrics/program-stats-summary')
  public async getProgramStats(@Param() params): Promise<ProgramStats> {
    return await this.metricsService.getProgramStats(Number(params.programId));
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramMetricsREAD] })
  @ApiOperation({ summary: '[SCOPED] Get registration statuses with count' })
  @ApiParam({ name: 'programId', required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Registration statuses with count - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('programs/:programId/metrics/registration-status')
  public async getRegistrationStatusStats(
    @Param() params,
  ): Promise<RegistrationStatusStats[]> {
    return await this.metricsService.getRegistrationStatusStats(
      Number(params.programId),
    );
  }
}
