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
import { AuthenticatedUser } from '../../guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '../../guards/authenticated-user.guard';
import { PermissionEnum } from '../../user/enum/permission.enum';
import {
  CreateMessageTemplateDto,
  DeleteTemplateParamDto,
  DeleteTemplateQueryDto,
  UpdateTemplateBodyDto,
  UpdateTemplateParamDto,
} from './dto/message-template.dto';
import { MessageTemplateEntity } from './message-template.entity';
import { MessageTemplateService } from './message-template.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('notifications')
@Controller('notifications')
export class MessageTemplateController {
  public constructor(
    private readonly messageTemplateService: MessageTemplateService,
  ) {}

  @ApiOperation({ summary: 'Get all message templates per program' })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @ApiResponse({
    status: HttpStatus.OK,
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
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<MessageTemplateEntity[]> {
    return await this.messageTemplateService.getMessageTemplatesByProgramId(
      programId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramUPDATE] })
  @ApiOperation({ summary: 'Create message template' })
  @ApiResponse({
    status: HttpStatus.CREATED,
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

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramUPDATE] })
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

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramUPDATE] })
  @ApiOperation({
    summary: 'Delete message template(s) by type and optionally language',
  })
  @ApiResponse({
    status: HttpStatus.OK,
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
