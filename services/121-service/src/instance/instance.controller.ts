import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Admin } from '../guards/admin.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminAuthGuard } from './../guards/admin.guard';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { UpdateMonitoringQuestionDto } from './dto/update-monitoring-question.dto';
import { InstanceEntity } from './instance.entity';
import { InstanceService } from './instance.service';
import { MonitoringQuestionEntity } from './monitoring-question.entity';

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

  @Admin()
  @ApiOperation({ summary: 'Update monitoring question' })
  @Put('monitoringQuestion')
  public async updateUserRole(
    @Body() updateMonitoringQuestionDto: UpdateMonitoringQuestionDto,
  ): Promise<MonitoringQuestionEntity> {
    return await this.instanceService.updateMonitoringQuestion(
      updateMonitoringQuestionDto,
    );
  }
}
