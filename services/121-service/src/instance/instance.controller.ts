import { Controller, UseGuards, Get, Post, Body } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { ApiUseTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '../roles.guard';
import { InstanceEntity } from './instance.entity';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { UserRole } from '../user-role.enum';
import { Roles } from '../roles.decorator';

@UseGuards(RolesGuard)
@ApiUseTags('instance')
@Controller('instance')
export class InstanceController {
  private readonly instanceService: InstanceService;
  public constructor(instanceService: InstanceService) {
    this.instanceService = instanceService;
  }

  @ApiOperation({ title: 'Get instance' })
  @Get()
  public async getInstance(): Promise<InstanceEntity> {
    return await this.instanceService.getInstance();
  }

  @ApiBearerAuth()
  @Roles(UserRole.Admin)
  @ApiOperation({ title: 'Update instance' })
  @Post('update')
  public async updateInstance(
    @Body() updateInstanceDto: UpdateInstanceDto,
  ): Promise<InstanceEntity> {
    return await this.instanceService.updateInstance(updateInstanceDto);
  }
}
