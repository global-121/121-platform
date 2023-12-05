import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuardsService } from '../guards/guards.service';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import { RegistrationScopedRepository } from '../registration/registration-scoped.repository';
import { RegistrationsModule } from '../registration/registrations.module';
import { UserModule } from '../user/user.module';
import { NoteEntity } from './note.entity';
import { NoteController } from './notes.controller';
import { NoteScopedRepository } from './note.scoped.repository';
import { NoteService } from './notes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NoteEntity,
      RegistrationEntity,
      ProgramAidworkerAssignmentEntity,
    ]),
    RegistrationsModule,
    UserModule,
  ],
  providers: [
    NoteService,
    GuardsService,
    NoteScopedRepository,
    RegistrationScopedRepository,
  ],
  controllers: [NoteController],
  exports: [NoteService, GuardsService],
})
export class NoteModule {}
