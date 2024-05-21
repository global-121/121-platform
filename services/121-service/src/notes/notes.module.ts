import { NoteEntity } from '@121-service/src/notes/note.entity';
import { NoteController } from '@121-service/src/notes/notes.controller';
import { NoteService } from '@121-service/src/notes/notes.service';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { UserModule } from '@121-service/src/user/user.module';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature(), RegistrationsModule, UserModule],
  providers: [
    NoteService,
    RegistrationScopedRepository,
    createScopedRepositoryProvider(NoteEntity),
  ],
  controllers: [NoteController],
  exports: [NoteService],
})
export class NoteModule {}
