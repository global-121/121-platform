import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateExcelFspConfigurationDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/create-excel-fsp-configuration.dto';
import { ExcelFspConfigurationResponseDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/excel-fsp-configuration-response.dto';
import { UpdateExcelFspConfigurationDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/update-excel-fsp-configuration.dto';
import { ExcelFspConfigurationService } from '@121-service/src/fsp-integrations/integrations/excel/excel-fsp-configuration.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { ProgramFspConfigurationResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-response.dto';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/fsp-configurations')
@Controller('programs/:programId/fsp-configurations')
export class ExcelFspConfigurationController {
  public constructor(
    private readonly excelFspConfigurationService: ExcelFspConfigurationService,
  ) {}

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramFspConfigREAD] })
  @ApiOperation({
    summary:
      'Get Excel FSP-configuration in a structured shape (unique identifier field + export fields).',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'name', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Excel FSP-configuration retrieved successfully.',
    type: ExcelFspConfigurationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Excel FSP-configuration not found for this program.',
  })
  @Get(':name/excel')
  public async getConfiguration(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('name') name: string,
  ): Promise<ExcelFspConfigurationResponseDto> {
    return this.excelFspConfigurationService.getConfiguration({
      programId,
      configurationName: name,
    });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramFspConfigCREATE] })
  @ApiOperation({ summary: 'Create an Excel FSP configuration.' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ProgramFspConfigurationResponseDto })
  @Post('excel')
  public async createConfiguration(
    @Param('programId', ParseIntPipe) programId: number,
    @Body() configuration: CreateExcelFspConfigurationDto,
  ): Promise<ProgramFspConfigurationResponseDto> {
    return this.excelFspConfigurationService.createConfiguration({ programId, configuration });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramFspConfigUPDATE] })
  @ApiOperation({ summary: 'Update an Excel FSP configuration.' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'name', required: true, type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, type: ProgramFspConfigurationResponseDto })
  @Patch(':name/excel')
  public async updateConfiguration(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('name') name: string,
    @Body() configuration: UpdateExcelFspConfigurationDto,
  ): Promise<ProgramFspConfigurationResponseDto> {
    return this.excelFspConfigurationService.updateConfiguration({
      programId,
      configurationName: name,
      configuration,
    });
  }
}
