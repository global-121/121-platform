import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MessageTemplateController } from '@121-service/src/notifications/message-template/message-template.controller';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { ProgramRegistrationAttributesModule } from '@121-service/src/program-registration-attributes/program-registration-attributes.module';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageTemplateEntity]),
    UserModule,
    ProgramRegistrationAttributesModule,
  ],
  providers: [MessageTemplateService],
  controllers: [MessageTemplateController],
  exports: [MessageTemplateService],
})
export class MessageTemplateModule {}
