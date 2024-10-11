import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NoteEntity } from '@121-service/src/notes/note.entity';
import { NoteScopedRepository } from '@121-service/src/notes/note.repository';
import { NoteController } from '@121-service/src/notes/notes.controller';
import { NotesService } from '@121-service/src/notes/notes.service';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NoteEntity]),
    RegistrationsModule,
    UserModule,
  ],
  providers: [NotesService, NoteScopedRepository, RegistrationScopedRepository],
  controllers: [NoteController],
  exports: [NotesService, NoteScopedRepository],
})
export class NoteModule {}
