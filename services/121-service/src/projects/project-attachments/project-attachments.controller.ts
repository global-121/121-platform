import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
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
import { CreateProjectAttachmentDto } from '@121-service/src/projects/project-attachments/dtos/create-project-attachment.dto';
import { CreateProjectAttachmentResponseDto } from '@121-service/src/projects/project-attachments/dtos/create-project-attachment-response.dto';
import { GetProjectAttachmentResponseDto } from '@121-service/src/projects/project-attachments/dtos/get-project-attachment-response.dto';
import { ProjectAttachmentsService } from '@121-service/src/projects/project-attachments/project-attachments.service';
import { FILE_UPLOAD_WITH_FILENAME_API_FORMAT } from '@121-service/src/shared/file-upload-api-format';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('projects/attachments')
@Controller()
export class ProjectAttachmentsController {
  private readonly projectAttachmentsService: ProjectAttachmentsService;
  public constructor(projectAttachmentsService: ProjectAttachmentsService) {
    this.projectAttachmentsService = projectAttachmentsService;
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProjectAttachmentsCREATE] })
  @ApiOperation({
    summary: 'Post attachments to a project',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_WITH_FILENAME_API_FORMAT)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post attachments to a project',
  })
  @Post('projects/:projectId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  public async createProjectAttachment(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100000000 }), // 100MB
          new FileTypeValidator({
            fileType:
              /^(image\/(jpeg|png|gif|webp)|application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|pdf))$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: CreateProjectAttachmentDto,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<CreateProjectAttachmentResponseDto> {
    const userId = RequestHelper.getUserId(req);

    return await this.projectAttachmentsService.createProjectAttachment({
      projectId,
      file,
      filename: body.filename,
      userId,
    });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProjectAttachmentsREAD] })
  @ApiOperation({
    summary: 'List attachments of a project',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List attachments of a project',
  })
  @Get('projects/:projectId/attachments')
  public async getProjectAttachments(
    @Param('projectId', ParseIntPipe)
    projectId: number,
  ): Promise<GetProjectAttachmentResponseDto[]> {
    return this.projectAttachmentsService.getProjectAttachments(projectId);
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProjectAttachmentsREAD] })
  @ApiOperation({
    summary: 'Download a specific attachment of a project by ID',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiParam({ name: 'attachmentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Download a specific attachment of a project by ID',
    schema: { type: 'string', format: 'binary' },
  })
  @Get('projects/:projectId/attachments/:attachmentId')
  public async downloadProjectAttachmentById(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @Res() res: Response,
  ): Promise<void> {
    const { stream, mimetype, filename } =
      await this.projectAttachmentsService.getProjectAttachmentById(
        projectId,
        attachmentId,
      );

    res.writeHead(HttpStatus.OK, {
      'Content-Type': mimetype,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    // Pipe the blob stream to the response
    stream.pipe(res);
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProjectAttachmentsDELETE] })
  @ApiOperation({
    summary: 'Delete a specific attachment of a project by ID',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiParam({ name: 'attachmentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Attachment deleted successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('projects/:projectId/attachments/:attachmentId')
  public async deleteProjectAttachmentById(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
  ): Promise<void> {
    await this.projectAttachmentsService.deleteProjectAttachmentById(
      projectId,
      attachmentId,
    );
  }
}
