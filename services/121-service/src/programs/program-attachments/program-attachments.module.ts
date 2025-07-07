import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { env } from '@121-service/src/env';
import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachment.entity';
import { ProgramAttachmentScopedRepository } from '@121-service/src/programs/program-attachments/program-attachment.repository';
import { ProgramAttachmentController } from '@121-service/src/programs/program-attachments/program-attachments.controller';
import { ProgramAttachmentsService } from '@121-service/src/programs/program-attachments/program-attachments.service';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgramAttachmentEntity]),
    RegistrationsModule,
    UserModule,
  ],
  providers: [
    ProgramAttachmentsService,
    ProgramAttachmentScopedRepository,
    RegistrationScopedRepository,
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
  exports: [],
})
export class ProgramAttachmentModule {}
