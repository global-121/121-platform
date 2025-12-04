import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { FspDto } from '@121-service/src/fsp-management/fsp.dto';
import { FspsService } from '@121-service/src/fsp-management/fsp.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';

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
    type: FspDto,
  })
  @Get()
  public async getAllFsps(): Promise<FspDto[]> {
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
    type: FspDto,
  })
  @Get(':fspName')
  public async getFspByName(
    @Param('fspName')
    fspName: string,
  ): Promise<FspDto> {
    return await this.fspService.getFspByName(fspName);
  }
}
