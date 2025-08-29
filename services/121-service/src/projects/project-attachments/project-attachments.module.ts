import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { env } from '@121-service/src/env';
import { ProjectAttachmentEntity } from '@121-service/src/projects/project-attachments/project-attachment.entity';
import { ProjectAttachmentScopedRepository } from '@121-service/src/projects/project-attachments/project-attachment.repository';
import { ProjectAttachmentsController } from '@121-service/src/projects/project-attachments/project-attachments.controller';
import { ProjectAttachmentsService } from '@121-service/src/projects/project-attachments/project-attachments.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectAttachmentEntity])],
  providers: [
    ProjectAttachmentsService,
    ProjectAttachmentScopedRepository,
    {
      provide: ContainerClient,
      useFactory: async () => {
        const blobServiceClient = BlobServiceClient.fromConnectionString(
          env.AZURE_STORAGE_CONNECTION_STRING,
        );

        const containerClient = blobServiceClient.getContainerClient(
          env.AZURE_STORAGE_CONTAINER_NAME,
        );

        await containerClient.createIfNotExists();

        return containerClient;
      },
    },
  ],
  controllers: [ProjectAttachmentsController],
  exports: [ProjectAttachmentsService],
})
export class ProjectAttachmentsModule {}
