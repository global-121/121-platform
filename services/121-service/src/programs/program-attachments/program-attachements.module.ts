import { BlobServiceClient } from '@azure/storage-blob';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachement.entity';
import { ProgramAttachmentScopedRepository } from '@121-service/src/programs/program-attachments/program-attachement.repository';
import { ProgramAttachmentController } from '@121-service/src/programs/program-attachments/program-attachements.controller';
import { ProgramAttachmentsService } from '@121-service/src/programs/program-attachments/program-attachements.service';
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
      provide: BlobServiceClient,
      useFactory: () => {
        return BlobServiceClient.fromConnectionString(
          process.env.AZURE_STORAGE_CONNECTION_STRING!,
        );
      },
    },
  ],
  controllers: [ProgramAttachmentController],
  exports: [],
})
export class ProgramAttachmentModule {}
