import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuardsService } from '../guards/guards.service';
import { RegistrationScopedRepository } from '../registration/registration-scoped.repository';
import { RegistrationsModule } from '../registration/registrations.module';
import { UserModule } from '../user/user.module';
import { createScopedRepositoryProvider } from '../utils/scope/createScopedRepositoryProvider.helper';
import { NoteEntity } from './note.entity';
import { NoteController } from './notes.controller';
import { NoteService } from './notes.service';

@Module({
  imports: [TypeOrmModule.forFeature(), RegistrationsModule, UserModule],
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
