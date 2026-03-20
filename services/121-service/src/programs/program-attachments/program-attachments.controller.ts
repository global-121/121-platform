import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CreateProgramAttachmentDto } from '@121-service/src/programs/program-attachments/dtos/create-program-attachment.dto';
import { CreateProgramAttachmentResponseDto } from '@121-service/src/programs/program-attachments/dtos/create-program-attachment-response.dto';
import { GetProgramAttachmentResponseDto } from '@121-service/src/programs/program-attachments/dtos/get-program-attachment-response.dto';
import { RenameProgramAttachmentDto } from '@121-service/src/programs/program-attachments/dtos/rename-program-attachment.dto';
import { ProgramAttachmentsService } from '@121-service/src/programs/program-attachments/program-attachments.service';
import { FILE_UPLOAD_WITH_FILENAME_API_FORMAT } from '@121-service/src/shared/file-upload-api-format';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/attachments')
@Controller()
export class ProgramAttachmentsController {
  private readonly programAttachmentsService: ProgramAttachmentsService;
  public constructor(programAttachmentsService: ProgramAttachmentsService) {
    this.programAttachmentsService = programAttachmentsService;
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramAttachmentsCREATE] })
  @ApiOperation({
    summary: 'Post attachments to a program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_WITH_FILENAME_API_FORMAT)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post attachments to a program',
  })
  @Post('programs/:programId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  public async createProgramAttachment(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100000000 }), // 100MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: CreateProgramAttachmentDto,
    @Param('programId', ParseIntPipe) programId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<CreateProgramAttachmentResponseDto> {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Validation failed (invalid file type)');
    }

    const userId = RequestHelper.getUserId(req);
    const scope = RequestHelper.getUserScope(req);

    return await this.programAttachmentsService.createProgramAttachment({
      programId,
      file,
      filename: body.filename,
      userId,
      scope,
    });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramAttachmentsUPDATE] })
  @ApiOperation({
    summary: 'Rename an attachment in a program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'attachmentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rename an attachment in a program',
  })
  @Patch('programs/:programId/attachments/:attachmentId')
  public async renameProgramAttachment(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @Body() body: RenameProgramAttachmentDto,
  ): Promise<void> {
    await this.programAttachmentsService.renameProgramAttachment({
      programId,
      attachmentId,
      filename: body.newFilename,
    });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramAttachmentsREAD] })
  @ApiOperation({
    summary: 'List attachments of a program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List attachments of a program',
  })
  @Get('programs/:programId/attachments')
  public async getProgramAttachments(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<GetProgramAttachmentResponseDto[]> {
    const scope = RequestHelper.getUserScope(req);
    return this.programAttachmentsService.getProgramAttachments(
      programId,
      scope,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramAttachmentsREAD] })
  @ApiOperation({
    summary: 'Download a specific attachment of a program by ID',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'attachmentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Download a specific attachment of a program by ID',
    schema: { type: 'string', format: 'binary' },
  })
  @Get('programs/:programId/attachments/:attachmentId')
  public async downloadProgramAttachmentById(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @Res() res: Response,
    @Req() req: ScopedUserRequest,
  ): Promise<void> {
    const scope = RequestHelper.getUserScope(req);
    const { stream, mimetype, filename } =
      await this.programAttachmentsService.getProgramAttachmentById(
        programId,
        attachmentId,
        scope,
      );

    res.writeHead(HttpStatus.OK, {
      'Content-Type': mimetype,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    // Pipe the blob stream to the response
    stream.pipe(res);
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramAttachmentsDELETE] })
  @ApiOperation({
    summary: 'Delete a specific attachment of a program by ID',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'attachmentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Attachment deleted successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('programs/:programId/attachments/:attachmentId')
  public async deleteProgramAttachmentById(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<void> {
    const scope = RequestHelper.getUserScope(req);
    await this.programAttachmentsService.deleteProgramAttachmentById(
      programId,
      attachmentId,
      scope,
    );
  }
}
