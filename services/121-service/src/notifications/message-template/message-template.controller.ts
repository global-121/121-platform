import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

@ApiTags('notifications')
@Controller('notifications/message-template')
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
  @Get(':programId')
  public async getMessageTemplatesByProgramId(
    @Param('programId') programId,
  ): Promise<MessageTemplateEntity[]> {
    return await this.messageTemplateService.getMessageTemplatesByProgramId(
      Number(programId),
    );
  }

  @ApiOperation({ summary: 'Create message template' })
  @ApiResponse({
    status: 201,
    description: 'Created new message template',
  })
  @Post('create')
  public async createMessageTemplate(
    @Body() templateData: MessageTemplateDto,
  ): Promise<MessageTemplateEntity> {
    return await this.messageTemplateService.createMessageTemplate(
      templateData,
    );
  }
}
