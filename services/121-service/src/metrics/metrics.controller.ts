import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
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
import { Admin } from '../guards/admin.decorator';
import { Permissions } from '../guards/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PaginateConfigRegistrationViewOnlyFilters } from '../registration/const/filter-operation.const';
import { RegistrationViewEntity } from '../registration/registration-view.entity';
import { PermissionEnum } from '../user/enum/permission.enum';
import { User } from '../user/user.decorator';
import {
  ExportDetailsQueryParamsDto,
  ExportType,
} from './dto/export-details.dto';
import { ProgramMetrics } from './dto/program-metrics.dto';
import { ProgramStats } from './dto/program-stats.dto';
import { RegistrationStatusStats } from './dto/registrationstatus-stats.dto';
import { MetricsService } from './metrics.service';

@UseGuards(PermissionsGuard)
@ApiTags('metrics')
@Controller()
export class MetricsController {
  private readonly metricsService: MetricsService;
  public constructor(metricsService: MetricsService) {
    this.metricsService = metricsService;
  }
  @Permissions(PermissionEnum.RegistrationPersonalEXPORT)
  @ApiOperation({
    summary: `[SCOPED] Retrieve data for export. Filters only work for export type ${ExportType.allPeopleAffected}`,
  })
  @ApiResponse({
    status: 200,
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
    @User('id') userId: number,
    @Paginate() paginationQuery: PaginateQuery,
  ): Promise<any> {
    if (
      queryParams.toDate &&
      queryParams.fromDate &&
      queryParams.toDate <= queryParams.fromDate
    ) {
      const errors = 'toDate must be greater than fromDate';
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    return await this.metricsService.getExportList(
      Number(programId),
      exportType as ExportType,
      userId,
      queryParams.minPayment,
      queryParams.maxPayment,
      queryParams.fromDate,
      queryParams.toDate,
      paginationQuery,
    );
  }

  @Admin()
  @ApiOperation({
    summary: 'Get list of vouchers to cancel, only used by admin',
  })
  @ApiResponse({
    status: 200,
    description: 'Retrieved list of vouchers to cancel',
  })
  // TODO: move to intersolve-voucher.controller and rename to /financial-servicer-providers/intersolve-voucher/vouchers?status=toCancel&responseType=csv
  @Get('metrics/to-cancel-vouchers')
  public async getToCancelVouchers(): Promise<any> {
    return await this.metricsService.getToCancelVouchers();
  }

  @Permissions(PermissionEnum.ProgramMetricsREAD)
  @ApiOperation({
    summary: '[SCOPED] Get metrics about people affected for dashboard page',
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @ApiQuery({
    name: 'payment',
    required: false,
    type: 'integer',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: 'integer',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: 'integer',
  })
  @ApiQuery({
    name: 'fromStart',
    required: false,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description:
      'Metrics of a program to gain an overview of the program - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('programs/:programId/metrics/person-affected')
  public async getPAMetrics(
    @Param() params,
    @Query() query,
  ): Promise<ProgramMetrics> {
    return {
      pa: await this.metricsService.getPaMetrics(
        Number(params.programId),
        query.payment ? Number(query.payment) : undefined,
        query.month ? Number(query.month) : undefined,
        query.year ? Number(query.year) : undefined,
        query.fromStart ? Number(query.fromStart) : undefined,
      ),
      updated: new Date(),
    };
  }

  @Permissions(PermissionEnum.ProgramMetricsREAD)
  @ApiOperation({
    summary: '[SCOPED] Get payments with state sums by program-id',
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description:
      'Payment state sums to create bar charts to show the number of new vs existing PAs per installmet - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('programs/:programId/metrics/payment-state-sums')
  public async getPaymentsWithStateSums(@Param() params): Promise<any> {
    return await this.metricsService.getPaymentsWithStateSums(
      Number(params.programId),
    );
  }

  @Permissions(PermissionEnum.ProgramMetricsREAD)
  @ApiOperation({ summary: '[SCOPED] Get monitoring data' })
  @ApiResponse({
    status: 200,
    description:
      'All monitoring data of a program - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Get('programs/:programId/metrics/monitoring')
  public async getMonitoringData(@Param() params): Promise<any[]> {
    return await this.metricsService.getMonitoringData(
      Number(params.programId),
    );
  }

  @Permissions(PermissionEnum.ProgramMetricsREAD)
  @ApiOperation({ summary: '[SCOPED] Get program stats summary' })
  @ApiParam({ name: 'programId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Program stats summary',
  })
  @Get('programs/:programId/metrics/program-stats-summary')
  public async getProgramStats(@Param() params): Promise<ProgramStats> {
    return await this.metricsService.getProgramStats(Number(params.programId));
  }

  @Permissions(PermissionEnum.ProgramMetricsREAD)
  @ApiOperation({ summary: '[SCOPED] Get registration statuses with count' })
  @ApiParam({ name: 'programId', required: true })
  @ApiResponse({
    status: 200,
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
