import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { FspsService } from '@121-service/src/fsp-management/fsp.service';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps')
@Controller('fsps')
export class FspsController {
  public constructor(private readonly fspService: FspsService) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: 'Get all Financial Service Providers. (Fsps)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All Fsps with attributes',
    type: FspSettingsDto,
  })
  @Get()
  public async getAllFsps(): Promise<FspSettingsDto[]> {
    return await this.fspService.getAllFsps();
  }

  @ApiOperation({ summary: 'Get Financial Service Provider (Fsp) by name.' })
  @ApiParam({
    name: 'fspName',
    required: true,
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fsp with attributes',
    type: FspSettingsDto,
  })
  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramREAD] })
  @Get(':fspName')
  public async getFspByName(
    @Param('fspName')
    fspName: string,
  ): Promise<FspSettingsDto> {
    return await this.fspService.getFspByName(fspName);
  }
}
