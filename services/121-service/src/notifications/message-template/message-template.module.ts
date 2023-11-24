import { Module } from '@nestjs/common';
import { MessageTemplateService } from './message-template.service';
import { MessageTemplateController } from './message-template.controller';
import { GuardsService } from '../../guards/guards.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageTemplateEntity } from './message-template.entity';
import { UserModule } from '../../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([MessageTemplateEntity]), UserModule],
  providers: [MessageTemplateService, GuardsService],
  controllers: [MessageTemplateController],
  exports: [MessageTemplateService, GuardsService],
})
export class MessageTemplateModule {}
