import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
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
import { PassThrough } from 'stream';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachement.entity';
import { ProgramAttachmentsService } from '@121-service/src/programs/program-attachments/program-attachements.service';
import { FILE_UPLOAD_API_FORMAT } from '@121-service/src/shared/file-upload-api-format';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs')
@Controller('programs')
export class ProgramAttachmentController {
  private readonly programAttachmentsService: ProgramAttachmentsService;
  public constructor(programAttachmentsService: ProgramAttachmentsService) {
    this.programAttachmentsService = programAttachmentsService;
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Post attachments to a program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_API_FORMAT)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post attachments to a program',
  })
  @Post('programs/:programId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  public async createProgramAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<void> {
    await this.programAttachmentsService.createProgramAttachment(
      programId,
      file,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'List attachments of a program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List attachments of a program',
  })
  @Get('programs/:programId/attachments/meta')
  public async getProgramAttachmentsMeta(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<ProgramAttachmentEntity[]> {
    return this.programAttachmentsService.getProgramAttachmentsMeta(programId);
  }

  @AuthenticatedUser({ isAdmin: true })
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
  ): Promise<void> {
    const { stream, mimeType, fileName } =
      await this.programAttachmentsService.getProgramAttachmentById(
        programId,
        attachmentId,
      );

    res.writeHead(HttpStatus.OK, {
      'Content-Type': mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    // Pipe the blob stream to the response
    stream.pipe(res as unknown as PassThrough);
  }
}
