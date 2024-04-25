import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '../guards/authenticated-user.guard';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { InstanceEntity } from './instance.entity';
import { InstanceService } from './instance.service';

@UseGuards(AuthenticatedUserGuard)
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
  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: 'Update instance data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully updated instance',
    type: InstanceEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No instance found',
    type: InstanceEntity,
  })
  @Patch()
  public async updateInstance(
    @Body() updateInstanceDto: UpdateInstanceDto,
  ): Promise<InstanceEntity> {
    return await this.instanceService.updateInstance(updateInstanceDto);
  }
}
