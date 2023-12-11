import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuardsService } from '../guards/guards.service';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import { RegistrationScopedRepository } from '../registration/registration-scoped.repository';
import { RegistrationsModule } from '../registration/registrations.module';
import { UserModule } from '../user/user.module';
import { NoteEntity } from './note.entity';
import { NoteController } from './notes.controller';
import { NoteService } from './notes.service';
import { createScopedRepositoryProvider } from '../utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegistrationEntity,
      ProgramAidworkerAssignmentEntity,
    ]),
    RegistrationsModule,
    UserModule,
  ],
  providers: [
    NoteService,
    GuardsService,
    RegistrationScopedRepository,
    createScopedRepositoryProvider(NoteEntity),
  ],
  controllers: [NoteController],
  exports: [NoteService, GuardsService],
})
export class NoteModule {}
