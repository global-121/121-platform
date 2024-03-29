import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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

  @ApiOperation({ summary: 'Get instance data' })
  @Get()
  public async getInstance(): Promise<InstanceEntity> {
    return await this.instanceService.getInstance();
  }

  // TODO: we assume only 1 instance. Therefore not patching by instance-id/name. This could be changed in the future.
  @Admin()
  @ApiOperation({ summary: 'Update instance data' })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated instance',
    type: InstanceEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'No instance found',
    type: InstanceEntity,
  })
  @Patch()
  public async updateInstance(
    @Body() updateInstanceDto: UpdateInstanceDto,
  ): Promise<InstanceEntity> {
    return await this.instanceService.updateInstance(updateInstanceDto);
  }

  @Admin()
  @ApiOperation({ summary: 'Update instance monitoring question' })
  @ApiResponse({
    status: 404,
    description: 'No instance found',
    type: InstanceEntity,
  })
  @Patch('monitoringQuestion')
  public async updateMonitoringQuestion(
    @Body() updateMonitoringQuestionDto: UpdateMonitoringQuestionDto,
  ): Promise<MonitoringQuestionEntity> {
    return await this.instanceService.updateMonitoringQuestion(
      updateMonitoringQuestionDto,
    );
  }
}
