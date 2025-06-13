import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { FinancialServiceProviderDto } from '@121-service/src/fsps/fsp.dto';
import { FinancialServiceProvidersService } from '@121-service/src/fsps/fsp.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('financial-service-providers')
@Controller('financial-service-providers')
export class FinancialServiceProvidersController {
  public constructor(
    private readonly fspService: FinancialServiceProvidersService,
  ) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: 'Get all Financial Service Providers.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All Financial Service Providers with attributes',
    type: FinancialServiceProviderDto,
  })
  @Get()
  public async getAllFsps(): Promise<FinancialServiceProviderDto[]> {
    return await this.fspService.getAllFsps();
  }

  @ApiOperation({ summary: 'Get Financial Service Provider (FSP) by name.' })
  @ApiParam({
    name: 'financialServiceProviderName',
    required: true,
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fsp with attributes',
    type: FinancialServiceProviderDto,
  })
  @Get(':financialServiceProviderName')
  public async getFspByName(
    @Param('financialServiceProviderName')
    financialServiceProviderName: string,
  ): Promise<FinancialServiceProviderDto> {
    return await this.fspService.getFspByName(financialServiceProviderName);
  }
}
