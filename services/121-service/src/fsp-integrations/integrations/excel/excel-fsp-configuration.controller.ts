import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ExcelFspConfigurationResponseDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/excel-fsp-configuration-response.dto';
import { UpdateExcelFspConfigurationDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/update-excel-fsp-configuration.dto';
import { ExcelFspConfigurationService } from '@121-service/src/fsp-integrations/integrations/excel/excel-fsp-configuration.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
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

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramFspConfigUPDATE] })
  @ApiOperation({ summary: 'Create or update an Excel FSP configuration.' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'name', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ExcelFspConfigurationResponseDto,
  })
  @Put(':name/excel')
  public async createOrReplaceConfiguration(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('name') name: string,
    @Body() configuration: UpdateExcelFspConfigurationDto,
  ): Promise<ExcelFspConfigurationResponseDto> {
    return this.excelFspConfigurationService.createOrReplaceConfiguration({
      programId,
      configurationName: name,
      configuration,
    });
  }
}
