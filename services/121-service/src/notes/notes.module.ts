import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuardsService } from '../guards/guards.service';
import { RegistrationEntity } from '../registration/registration.entity';
import { RegistrationsModule } from '../registration/registrations.module';
import { UserModule } from '../user/user.module';
import { NoteEntity } from './note.entity';
import { NoteController } from './notes.controller';
import { NoteService } from './notes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NoteEntity, RegistrationEntity]),
    RegistrationsModule,
    UserModule,
  ],
  providers: [NoteService, GuardsService],
  controllers: [NoteController],
  exports: [NoteService, GuardsService],
})
export class NoteModule {}
