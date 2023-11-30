import { Module } from '@nestjs/common';
import { MessageTemplateService } from './message-template.service';
import { MessageTemplateController } from './message-template.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageTemplateEntity } from './message-template.entity';
import { UserModule } from '../../user/user.module';
import { ProgramAttributesModule } from '../../program-attributes/program-attributes.module';

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
