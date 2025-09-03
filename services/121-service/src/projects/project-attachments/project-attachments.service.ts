import { BlockBlobClient, ContainerClient } from '@azure/storage-blob';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { CreateProjectAttachmentResponseDto } from '@121-service/src/projects/project-attachments/dtos/create-project-attachment-response.dto';
import { GetProjectAttachmentResponseDto } from '@121-service/src/projects/project-attachments/dtos/get-project-attachment-response.dto';
import { ProjectAttachmentMapper } from '@121-service/src/projects/project-attachments/mapper/project-attachment.mapper';
import { ProjectAttachmentEntity } from '@121-service/src/projects/project-attachments/project-attachment.entity';
import { ProjectAttachmentScopedRepository } from '@121-service/src/projects/project-attachments/project-attachment.repository';

@Injectable()
export class ProjectAttachmentsService {
  public constructor(
    private readonly projectAttachmentScopedRepository: ProjectAttachmentScopedRepository,
    @Inject(ContainerClient)
    private readonly containerClient: ContainerClient,
  ) {}

  public async createProjectAttachment({
    projectId,
    file,
    filename,
    userId,
  }: {
    projectId: number;
    file: Express.Multer.File;
    filename: string;
    userId: number;
  }): Promise<CreateProjectAttachmentResponseDto> {
    // get extension from original file name
    const extension = file.originalname.split('.').pop();
    const filenameWithExtension = `${filename}.${extension}`;

    // Upload to Blob Storage
    const blobName = `${projectId}/${Date.now()}-${filenameWithExtension}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    // Save metadata to DB
    const attachment = new ProjectAttachmentEntity();
    attachment.filename = filenameWithExtension;
    attachment.mimetype = file.mimetype;
    attachment.blobName = blobName;
    attachment.projectId = projectId;
    attachment.userId = userId;

    const savedAttachment =
      await this.projectAttachmentScopedRepository.save(attachment);

    return {
      id: savedAttachment.id,
    };
  }

  public async getProjectAttachments(
    projectId: number,
  ): Promise<GetProjectAttachmentResponseDto[]> {
    const attachments = await this.projectAttachmentScopedRepository.find({
      where: { projectId: Equal(projectId) },
      relations: {
        user: true,
      },
    });

    return ProjectAttachmentMapper.mapEntitiesToDtos(attachments);
  }

  public async getProjectAttachmentById(
    projectId: number,
    attachmentId: number,
  ): Promise<{
    stream: NodeJS.ReadableStream;
    mimetype: string;
    filename: string;
  }> {
    const { projectAttachment, blockBlobClient } =
      await this.getProjectAttachmentAndBlockBlobClient({
        projectId,
        attachmentId,
      });

    const downloadBlockBlobResponse = await blockBlobClient.download(0);

    if (!downloadBlockBlobResponse.readableStreamBody) {
      throw new Error(
        `Attachment with ID ${attachmentId} not found in blob storage for project ${projectId}`,
      );
    }

    return {
      mimetype: projectAttachment.mimetype,
      stream: downloadBlockBlobResponse.readableStreamBody,
      filename: projectAttachment.filename,
    };
  }

  public async deleteProjectAttachmentById(
    projectId: number,
    attachmentId: number,
  ): Promise<void> {
    const { projectAttachment, blockBlobClient } =
      await this.getProjectAttachmentAndBlockBlobClient({
        projectId,
        attachmentId,
      });

    await blockBlobClient.deleteIfExists();

    // Delete from DB
    await this.projectAttachmentScopedRepository.remove(projectAttachment);
  }

  public async deleteAllProjectAttachments(projectId: number): Promise<void> {
    const projectAttachments =
      await this.projectAttachmentScopedRepository.find({
        where: { projectId: Equal(projectId) },
      });

    await Promise.all(
      projectAttachments.map(async (attachment) => {
        const blockBlobClient = this.containerClient.getBlockBlobClient(
          `${attachment.blobName}`,
        );
        await blockBlobClient.deleteIfExists();
      }),
    );

    await this.projectAttachmentScopedRepository.remove(projectAttachments);
  }

  private async getProjectAttachmentAndBlockBlobClient({
    projectId,
    attachmentId,
  }: {
    projectId: number;
    attachmentId: number;
  }): Promise<{
    projectAttachment: ProjectAttachmentEntity;
    blockBlobClient: BlockBlobClient;
  }> {
    const projectAttachment =
      await this.projectAttachmentScopedRepository.findOne({
        where: {
          projectId: Equal(projectId),
          id: Equal(attachmentId),
        },
      });

    if (!projectAttachment) {
      throw new HttpException(
        `Attachment with ID ${attachmentId} not found for project ${projectId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(
      `${projectAttachment.blobName}`,
    );

    return { projectAttachment, blockBlobClient };
  }
}
