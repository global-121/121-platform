import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Admin } from '../../guards/admin.decorator';
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

  @ApiOperation({ summary: 'Get ProgramFspConfigurationEntity by program id' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({ status: 200, description: 'Return program by id.' })
  @Admin()
  @Get(':programId/fsp-configuration')
  public async findByProgramId(
    @Param() params,
  ): Promise<ProgramFspConfigurationEntity[]> {
    return this.programFspConfigurationService.findByProgramId(
      params.programId,
    );
  }
}
