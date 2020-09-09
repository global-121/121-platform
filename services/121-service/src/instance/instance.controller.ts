import { Controller, UseGuards, Get } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { ApiUseTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '../roles.guard';
import { InstanceEntity } from './instance.entity';

@ApiBearerAuth()
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
}
