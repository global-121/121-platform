import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Admin } from '../../guards/admin.decorator';
import { CreateProgramFspConfigurationDto } from '../dto/create-program-fsp-configuration.dto';
import { AdminAuthGuard } from './../../guards/admin.guard';
import { PermissionsGuard } from './../../guards/permissions.guard';
import { ProgramFspConfigurationService } from './fsp-configuration.service';
import { ProgramFspConfigurationEntity } from './program-fsp-configuration.entity';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('programs')
@Controller('programs')
export class ProgramFspConfigurationController {
  private readonly programFspConfigurationService: ProgramFspConfigurationService;
  public constructor(
    programFspConfigurationService: ProgramFspConfigurationService,
  ) {
    this.programFspConfigurationService = programFspConfigurationService;
  }

  @Admin()
  @ApiOperation({ summary: 'Get programFspConfigurationEntity by program id' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Return programFspConfigurationEntity by program id.',
  })
  @Get(':programId/fsp-configuration')
  public async findByProgramId(
    @Param() params,
  ): Promise<ProgramFspConfigurationEntity[]> {
    if (isNaN(params.programId)) {
      throw new HttpException(
        'Program ID is not a number',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.programFspConfigurationService.findByProgramId(
      params.programId,
    );
  }

  @Admin()
  @ApiOperation({ summary: 'Create ProgramFspConfigurationEntity' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 201,
    description:
      'The programFspConfigurationEntity has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Post(':programId/fsp-configuration')
  public async create(
    @Body() programFspConfigurationData: CreateProgramFspConfigurationDto,
    @Param() params,
  ): Promise<number> {
    if (isNaN(params.programId)) {
      throw new HttpException(
        'Program ID is not a number',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.programFspConfigurationService.create(
      params.programId,
      programFspConfigurationData,
    );
  }
}
