import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DeleteResult } from 'typeorm';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import {
  CreateMessageTemplateDto,
  DeleteTemplateParamDto,
  DeleteTemplateQueryDto,
  UpdateTemplateBodyDto,
  UpdateTemplateParamDto,
} from '@121-service/src/notifications/message-template/dto/message-template.dto';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('notifications')
@Controller('notifications')
export class MessageTemplateController {
  public constructor(
    private readonly messageTemplateService: MessageTemplateService,
  ) {}

  @ApiOperation({ summary: 'Get all message templates per project' })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All message templates',
    type: [MessageTemplateEntity],
  })
  @ApiParam({
    name: 'projectId',
    required: true,
    type: 'integer',
  })
  @Get(':projectId/message-templates')
  public async getMessageTemplatesByProjectId(
    @Param('projectId', ParseIntPipe)
    projectId: number,
  ): Promise<MessageTemplateEntity[]> {
    return await this.messageTemplateService.getMessageTemplatesByProjectId(
      projectId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProjectUPDATE] })
  @ApiOperation({ summary: 'Create message template' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Created new message template',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @Post(':projectId/message-templates')
  public async createMessageTemplate(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() templateData: CreateMessageTemplateDto,
  ): Promise<void> {
    await this.messageTemplateService.createMessageTemplate(
      projectId,
      templateData,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProjectUPDATE] })
  @ApiOperation({ summary: '[EXTERNALLY USED] Update message template' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message template updated',
    type: MessageTemplateEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No message template found with given id',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiParam({ name: 'type', required: true, type: 'string' })
  @ApiParam({ name: 'language', required: true, type: 'string' })
  @Patch(':projectId/message-templates/:type/:language')
  public async updateMessageTemplate(
    @Param() params: UpdateTemplateParamDto,
    @Body() updateMessageTemplateDto: UpdateTemplateBodyDto,
  ): Promise<MessageTemplateEntity> {
    return await this.messageTemplateService.updateMessageTemplate(
      params.projectId,
      params.type,
      params.language,
      updateMessageTemplateDto,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProjectUPDATE] })
  @ApiOperation({
    summary: 'Delete message template(s) by type and optionally language',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message template deleted',
    type: DeleteResult,
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiParam({ name: 'type', required: true, type: 'string' })
  @ApiQuery({
    name: 'language',
    required: false,
    type: 'string',
    description:
      'Optional. If not supplied, all languages for given type are removed.',
  })
  @Delete(':projectId/message-templates/:type')
  public async deleteMessageTemplate(
    @Param() params: DeleteTemplateParamDto,
    @Query() query: DeleteTemplateQueryDto,
  ): Promise<DeleteResult> {
    return await this.messageTemplateService.deleteMessageTemplate(
      params.projectId,
      params.type,
      query.language,
    );
  }
}
