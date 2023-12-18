import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramAttributesModule } from '../../program-attributes/program-attributes.module';
import { UserModule } from '../../user/user.module';
import { MessageTemplateController } from './message-template.controller';
import { MessageTemplateEntity } from './message-template.entity';
import { MessageTemplateService } from './message-template.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageTemplateEntity]),
    UserModule,
    ProgramAttributesModule,
  ],
  providers: [MessageTemplateService],
  controllers: [MessageTemplateController],
  exports: [MessageTemplateService],
})
export class MessageTemplateModule {}
