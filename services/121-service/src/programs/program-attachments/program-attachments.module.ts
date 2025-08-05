import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { env } from '@121-service/src/env';
import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachment.entity';
import { ProgramAttachmentScopedRepository } from '@121-service/src/programs/program-attachments/program-attachment.repository';
import { ProgramAttachmentController } from '@121-service/src/programs/program-attachments/program-attachments.controller';
import { ProgramAttachmentsService } from '@121-service/src/programs/program-attachments/program-attachments.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramAttachmentEntity])],
  providers: [
    ProgramAttachmentsService,
    ProgramAttachmentScopedRepository,
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
  controllers: [ProgramAttachmentController],
  exports: [ProgramAttachmentsService],
})
export class ProgramAttachmentModule {}
