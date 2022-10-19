import { AdminAuthGuard } from './../guards/admin.guard';
import { Controller, UseGuards, Get, Post, Body } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InstanceEntity } from './instance.entity';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Admin } from '../guards/admin.decorator';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('instance')
@Controller('instance')
export class InstanceController {
  private readonly instanceService: InstanceService;
  public constructor(instanceService: InstanceService) {
    this.instanceService = instanceService;
  }

  @ApiOperation({ summary: 'Get instance' })
  @Get()
  public async getInstance(): Promise<InstanceEntity> {
    return await this.instanceService.getInstance();
  }

  @Admin()
  @ApiOperation({ summary: 'Update instance' })
  @Post('update')
  public async updateInstance(
    @Body() updateInstanceDto: UpdateInstanceDto,
  ): Promise<InstanceEntity> {
    return await this.instanceService.updateInstance(updateInstanceDto);
  }
}
