import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MessageTemplateService } from './message-template.service';
import { MessageTemplateEntity } from './message-template.entity';
import { MessageTemplateDto } from './dto/message-template.dto';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { Permissions } from '../../guards/permissions.decorator';
import { PermissionEnum } from '../../user/permission.enum';
import { DeleteResult } from 'typeorm';

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
  @Get(':programId/message-template')
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
  @Post(':programId/message-template')
  public async createMessageTemplate(
    @Param('programId') programId: number,
    @Body() templateData: MessageTemplateDto,
  ): Promise<void> {
    await this.messageTemplateService.createMessageTemplate(
      Number(programId),
      templateData,
    );
  }

  @Permissions(PermissionEnum.ProgramUPDATE)
  @ApiOperation({ summary: 'Update message template' })
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
  @ApiParam({ name: 'messageId', required: true, type: 'integer' })
  @Patch(':programId/message-template/:messageId')
  public async updateMessageTemplate(
    @Param('programId') programId: number,
    @Param('messageId') messageId: number,
    @Body() updateMessageTemplateDto: MessageTemplateDto,
  ): Promise<MessageTemplateEntity> {
    return await this.messageTemplateService.updateMessageTemplate(
      Number(programId),
      Number(messageId),
      updateMessageTemplateDto,
    );
  }

  @Permissions(PermissionEnum.ProgramUPDATE)
  @ApiOperation({ summary: 'Delete message template' })
  @ApiResponse({
    status: 200,
    description: 'Message template deleted',
    type: DeleteResult,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'messageId', required: true, type: 'integer' })
  @Delete(':programId/message-template/:messageId')
  public async deleteMessageTemplate(
    @Param('programId') programId: number,
    @Param('messageId') messageId: number,
  ): Promise<DeleteResult> {
    return await this.messageTemplateService.deleteMessageTemplate(
      Number(programId),
      Number(messageId),
    );
  }
}
