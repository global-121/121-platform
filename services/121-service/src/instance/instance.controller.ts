import { Controller, UseGuards, Get, Post, Body } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InstanceEntity } from './instance.entity';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { PermissionsGuard } from '../permissions.guard';
import { Permissions } from '../permissions.decorator';
import { PermissionEnum } from '../user/permission.enum';

@UseGuards(PermissionsGuard)
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

  @Permissions(PermissionEnum.InstanceUPDATE)
  @ApiOperation({ summary: 'Update instance' })
  @Post('update')
  public async updateInstance(
    @Body() updateInstanceDto: UpdateInstanceDto,
  ): Promise<InstanceEntity> {
    return await this.instanceService.updateInstance(updateInstanceDto);
  }
}
