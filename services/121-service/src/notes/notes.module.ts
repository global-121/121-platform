import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NoteEntity } from '@121-service/src/notes/note.entity';
import { NoteController } from '@121-service/src/notes/notes.controller';
import { NotesService } from '@121-service/src/notes/notes.service';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { UserModule } from '@121-service/src/user/user.module';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [TypeOrmModule.forFeature(), RegistrationsModule, UserModule],
  providers: [
    NotesService,
    RegistrationScopedRepository,
    createScopedRepositoryProvider(NoteEntity),
  ],
  controllers: [NoteController],
  exports: [NotesService],
})
export class NoteModule {}
