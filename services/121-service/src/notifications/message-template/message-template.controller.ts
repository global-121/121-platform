import {
  Body,
  Controller,
  Delete,
  Get,
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
import { Permissions } from '../../guards/permissions.decorator';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { PermissionEnum } from '../../user/permission.enum';
import {
  CreateMessageTemplateDto,
  DeleteTemplateParamDto,
  DeleteTemplateQueryDto,
  UpdateTemplateBodyDto,
  UpdateTemplateParamDto,
} from './dto/message-template.dto';
import { MessageTemplateEntity } from './message-template.entity';
import { MessageTemplateService } from './message-template.service';

@UseGuards(PermissionsGuard)
@ApiTags('notifications')
@Controller('notifications')
export class MessageTemplateController {
  public constructor(
    private readonly messageTemplateService: MessageTemplateService,
  ) {}

  @ApiOperation({ summary: 'Get all message templates per program' })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @ApiResponse({
    status: 200,
    description: 'All message templates',
    type: [MessageTemplateEntity],
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @Get(':programId/message-templates')
  public async getMessageTemplatesByProgramId(
    @Param('programId') programId,
  ): Promise<MessageTemplateEntity[]> {
    return await this.messageTemplateService.getMessageTemplatesByProgramId(
      Number(programId),
    );
  }

  @Permissions(PermissionEnum.ProgramUPDATE)
  @ApiOperation({ summary: 'Create message template' })
  @ApiResponse({
    status: 201,
    description: 'Created new message template',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post(':programId/message-templates')
  public async createMessageTemplate(
    @Param('programId', ParseIntPipe) programId: number,
    @Body() templateData: CreateMessageTemplateDto,
  ): Promise<void> {
    await this.messageTemplateService.createMessageTemplate(
      programId,
      templateData,
    );
  }

  @Permissions(PermissionEnum.ProgramUPDATE)
  @ApiOperation({ summary: '[EXTERNALLY USED] Update message template' })
  @ApiResponse({
    status: 200,
    description: 'Message template updated',
    type: MessageTemplateEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'No message template found with given id',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'type', required: true, type: 'string' })
  @ApiParam({ name: 'language', required: true, type: 'string' })
  @Patch(':programId/message-templates/:type/:language')
  public async updateMessageTemplate(
    @Param() params: UpdateTemplateParamDto,
    @Body() updateMessageTemplateDto: UpdateTemplateBodyDto,
  ): Promise<MessageTemplateEntity> {
    return await this.messageTemplateService.updateMessageTemplate(
      params.programId,
      params.type,
      params.language,
      updateMessageTemplateDto,
    );
  }

  @Permissions(PermissionEnum.ProgramUPDATE)
  @ApiOperation({
    summary: 'Delete message template(s) by type and optionally language',
  })
  @ApiResponse({
    status: 200,
    description: 'Message template deleted',
    type: DeleteResult,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'type', required: true, type: 'string' })
  @ApiQuery({
    name: 'language',
    required: false,
    type: 'string',
    description:
      'Optional. If not supplied, all languages for given type are removed.',
  })
  @Delete(':programId/message-templates/:type')
  public async deleteMessageTemplate(
    @Param() params: DeleteTemplateParamDto,
    @Query() query: DeleteTemplateQueryDto,
  ): Promise<DeleteResult> {
    return await this.messageTemplateService.deleteMessageTemplate(
      params.programId,
      params.type,
      query.language,
    );
  }
}
