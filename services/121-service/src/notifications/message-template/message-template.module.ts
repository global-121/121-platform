import { MessageTemplateController } from '@121-service/src/notifications/message-template/message-template.controller';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { ProgramAttributesModule } from '@121-service/src/program-attributes/program-attributes.module';
import { UserModule } from '@121-service/src/user/user.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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
